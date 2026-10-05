"""Render a paper's figures out of its PDF by isolating them from the text.

Gemini reliably names each figure, its caption, and its page, but its pixel
bounding boxes are too imprecise to crop by, and the PDF object model hides
form-wrapped figures. So we work on the *rendered page*: white out everything
in the text layer (body text, captions, and the figure's own labels), and the
ink that remains is the drawn figure. We take the ink cluster sitting directly
above the caption, then crop the *original* render (labels intact). When no
figure can be isolated, fall back to the full page — always real and captioned.
"""

from __future__ import annotations

import base64
import re
from io import BytesIO

import numpy as np
import pypdfium2 as pdfium
from PIL import Image

# Bump when the extraction algorithm changes — old cached rows re-extract.
FIGURES_VERSION = 2

_SCALE = 2.0  # render multiplier over 72dpi (≈144dpi)
_MAX_W = 1100  # cap stored width
_MAX_FIGURES = 12
_INK = 200  # grayscale below this counts as ink
_MIN_H_FRAC = 0.05  # reject a cluster shorter/narrower than this → full page
_MIN_W_FRAC = 0.07

Rect = tuple[float, float, float, float]  # (left, bottom, right, top), text: origin bottom-left


def _encode(img: Image.Image) -> str:
    if img.width > _MAX_W:
        h = round(img.height * _MAX_W / img.width)
        img = img.resize((_MAX_W, h), Image.LANCZOS)
    buf = BytesIO()
    img.convert("RGB").save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _find_caption_rects(tp, caption: str, number: object) -> list[Rect] | None:
    """Locate the caption line(s) in the text layer; return their rects or None."""
    cap = (caption or "").strip()
    queries: list[str] = []
    body = re.sub(rf"^(figure|fig\.?)\s*{re.escape(str(number))}[.\:\s]*", "", cap, flags=re.I).strip()
    if len(body) >= 12:
        queries.append(body[:40])
    queries += [f"Figure {number}.", f"Figure {number}:", f"Fig. {number}.", f"Fig {number}."]
    for q in queries:
        if len(q) < 3:
            continue
        res = tp.search(q, match_case=False).get_next()
        if res:
            idx, cnt = res
            nr = tp.count_rects(idx, cnt)
            rects = [tp.get_rect(i) for i in range(nr)]
            if rects:
                return rects
    return None


def _page_rects(tp) -> list[Rect]:
    n = tp.count_rects(0, tp.count_chars())
    return [tp.get_rect(i) for i in range(n)]


def _caption_column(cap_rects: list[Rect], page_rects: list[Rect], pw: float) -> tuple[float, float]:
    """The x-range (points) of the caption's column; full width if the caption is wide."""
    cap_left = min(r[0] for r in cap_rects)
    cap_right = max(r[2] for r in cap_rects)
    if cap_right - cap_left > 0.55 * pw or not page_rects:
        lo = min((r[0] for r in page_rects), default=cap_left)
        hi = max((r[2] for r in page_rects), default=cap_right)
        return lo, hi
    center = pw / 2
    cap_cx = (cap_left + cap_right) / 2
    side = [r for r in page_rects if (r[0] + r[2]) / 2 < center] if cap_cx < center \
        else [r for r in page_rects if (r[0] + r[2]) / 2 >= center]
    col_l = min((r[0] for r in side), default=cap_left)
    col_r = max((r[2] for r in side), default=cap_right)
    return min(col_l, cap_left), max(col_r, cap_right)


def _detect_figure(
    full: Image.Image, page_rects: list[Rect], cap_rects: list[Rect], pw: float, ph: float
) -> Image.Image | None:
    """Isolate the figure directly above the caption via ink left after erasing text."""
    W, H = full.size
    sx, sy = W / pw, H / ph

    def to_px(r: Rect) -> tuple[int, int, int, int]:
        # text rect is (l, b, r, t) in bottom-left points → pixel box (top-left origin)
        return (int(r[0] * sx), int((ph - r[3]) * sy), int(r[2] * sx), int((ph - r[1]) * sy))

    gray = np.asarray(full.convert("L")).astype(np.uint8).copy()
    pad = 2
    for r in page_rects:  # erase ALL text (body, caption, and the figure's labels)
        x0, y0, x1, y1 = to_px(r)
        gray[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad] = 255
    ink = gray < _INK

    cap_top_pt = max(r[3] for r in cap_rects)
    cap_py = int((ph - cap_top_pt) * sy)  # pixel row of the caption's top edge
    col_l, col_r = _caption_column(cap_rects, page_rects, pw)
    cx0, cx1 = max(0, int(col_l * sx)), min(W, int(col_r * sx))
    if cap_py <= 0 or cx1 - cx0 < 4:
        return None

    row_has_ink = ink[:cap_py, cx0:cx1].any(axis=1)  # ink per row, above the caption
    gap_tol = max(4, int(0.012 * H))
    max_skip = int(0.12 * H)  # blank band allowed between figure bottom and caption

    # Nearest ink row scanning up from the caption.
    i = cap_py - 1
    skip = 0
    while i >= 0 and not row_has_ink[i]:
        i -= 1
        skip += 1
        if skip > max_skip:
            return None
    if i < 0:
        return None
    fig_bottom = i

    # Extend up through the figure, tolerating small internal gaps.
    top = i
    blank = 0
    j = i - 1
    while j >= 0:
        if row_has_ink[j]:
            top = j
            blank = 0
        else:
            blank += 1
            if blank > gap_tol:
                break
        j -= 1
    fig_top = top

    band = ink[fig_top:fig_bottom + 1, cx0:cx1]
    col_has_ink = band.any(axis=0)
    xs = np.where(col_has_ink)[0]
    if xs.size == 0:
        return None
    fx0, fx1 = cx0 + int(xs[0]), cx0 + int(xs[-1])

    if (fig_bottom - fig_top) < _MIN_H_FRAC * H or (fx1 - fx0) < _MIN_W_FRAC * W:
        return None

    px = max(2, int(0.01 * W))
    py = max(2, int(0.008 * H))
    box = (max(0, fx0 - px), max(0, fig_top - py), min(W, fx1 + px), min(H, fig_bottom + py))
    return full.crop(box)


def render_figures(pdf: bytes, specs: list[dict]) -> list[dict]:
    """specs: [{number, caption, page, ...}] → [{number, caption, b64, content_type}]."""
    doc = pdfium.PdfDocument(pdf)
    try:
        n_pages = len(doc)
        out: list[dict] = []
        for spec in specs[:_MAX_FIGURES]:
            try:
                page_no = int(spec.get("page", 1))
            except (TypeError, ValueError):
                page_no = 1
            page = doc[max(0, min(n_pages - 1, page_no - 1))]
            try:
                full = page.render(scale=_SCALE).to_pil()
                pw, ph = page.get_size()
                tp = page.get_textpage()
                img = None
                cap_rects = _find_caption_rects(tp, spec.get("caption", ""), spec.get("number"))
                if cap_rects:
                    img = _detect_figure(full, _page_rects(tp), cap_rects, pw, ph)
                if img is None:
                    img = full  # reliable fallback: the whole page, still captioned
            finally:
                page.close()
            out.append(
                {
                    "number": str(spec.get("number", len(out) + 1)),
                    "caption": (spec.get("caption") or "").strip(),
                    "b64": _encode(img),
                    "content_type": "image/png",
                }
            )
        return out
    finally:
        doc.close()
