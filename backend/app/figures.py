"""Render a paper's figures out of its PDF, cropping to model-located regions.

Gemini locates each figure (page + bounding box + caption); here we render that
page with pypdfium2 (permissive license) and crop to the box. A missing or
implausible box falls back to the whole page, so a bad localisation still shows
a real, captioned figure rather than nothing.
"""

from __future__ import annotations

import base64
from io import BytesIO

import pypdfium2 as pdfium
from PIL import Image

# Render scale (1.0 ≈ 72dpi); 2.0 ≈ 144dpi is crisp enough for on-screen figures.
_SCALE = 2.0
# Bound each stored image so a handful fit comfortably in one DB row.
_MAX_W = 1100
_MAX_FIGURES = 12
# A box smaller than this (fraction of the page) is almost certainly a bad
# localisation — fall back to the full page instead of a sliver.
_MIN_FRAC_W = 0.06
_MIN_FRAC_H = 0.04


def _valid_bbox(bbox: object) -> tuple[float, float, float, float] | None:
    """Normalise a model bbox to 0-1 fractions and validate it.

    The model doesn't reliably honour "0 to 1": it often returns a 0-1000 scale
    (e.g. [498, 276, 804, 375]) or 0-100. Infer the scale from the largest
    coordinate and divide accordingly, then validate as fractions.
    """
    if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
        return None
    try:
        vals = [float(v) for v in bbox]
    except (TypeError, ValueError):
        return None
    hi = max(abs(v) for v in vals)
    divisor = 1000.0 if hi > 100 else 100.0 if hi > 1 else 1.0
    x0, y0, x1, y1 = (v / divisor for v in vals)
    x0, x1 = sorted((x0, x1))
    y0, y1 = sorted((y0, y1))
    x0, y0 = max(0.0, x0), max(0.0, y0)
    x1, y1 = min(1.0, x1), min(1.0, y1)
    if x1 - x0 < _MIN_FRAC_W or y1 - y0 < _MIN_FRAC_H:
        return None
    return x0, y0, x1, y1


def _encode(img: Image.Image) -> str:
    if img.width > _MAX_W:
        h = round(img.height * _MAX_W / img.width)
        img = img.resize((_MAX_W, h), Image.LANCZOS)
    buf = BytesIO()
    img.convert("RGB").save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def render_figures(pdf: bytes, specs: list[dict]) -> list[dict]:
    """specs: [{number, caption, page, bbox}] → [{number, caption, b64, content_type}]."""
    doc = pdfium.PdfDocument(pdf)
    try:
        n_pages = len(doc)
        out: list[dict] = []
        for spec in specs[:_MAX_FIGURES]:
            try:
                page_no = int(spec.get("page", 1))
            except (TypeError, ValueError):
                page_no = 1
            idx = max(0, min(n_pages - 1, page_no - 1))
            page = doc[idx]
            try:
                full = page.render(scale=_SCALE).to_pil()
            finally:
                page.close()
            box = _valid_bbox(spec.get("bbox"))
            if box is None:
                img = full
            else:
                w, h = full.size
                x0, y0, x1, y1 = box
                img = full.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
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
