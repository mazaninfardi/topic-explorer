import pytest

from app.arxiv import IngestionError, arxiv_id, to_pdf_url


@pytest.mark.parametrize(
    "ref,expected",
    [
        ("1706.03762", "1706.03762"),
        ("https://arxiv.org/abs/1706.03762", "1706.03762"),
        ("https://arxiv.org/pdf/1706.03762v2", "1706.03762v2"),
    ],
)
def test_arxiv_id(ref, expected):
    assert arxiv_id(ref) == expected


def test_arxiv_id_rejects_non_arxiv():
    with pytest.raises(IngestionError):
        arxiv_id("https://example.com/1234.56789")


@pytest.mark.parametrize(
    "ref,expected",
    [
        ("1706.03762", "https://arxiv.org/pdf/1706.03762"),
        ("https://arxiv.org/abs/1706.03762", "https://arxiv.org/pdf/1706.03762"),
        ("https://arxiv.org/pdf/1706.03762v2", "https://arxiv.org/pdf/1706.03762v2"),
        ("arxiv.org/abs/2005.14165", "https://arxiv.org/pdf/2005.14165"),
    ],
)
def test_valid_refs(ref, expected):
    assert to_pdf_url(ref) == expected


@pytest.mark.parametrize("ref", ["", "hello world", "https://example.com/1234.56789", "nature.com/foo"])
def test_invalid_refs(ref):
    with pytest.raises(IngestionError):
        to_pdf_url(ref)


# --- topic vs. link resolution (ux-overhaul) ---

from app.arxiv import _SEARCH_ID, is_arxiv_ref


@pytest.mark.parametrize(
    "ref,expected",
    [
        ("1706.03762", True),
        ("https://arxiv.org/abs/1706.03762", True),
        ("how do transformers work?", False),
        ("attention is all you need", False),
        ("", False),
    ],
)
def test_is_arxiv_ref(ref, expected):
    assert is_arxiv_ref(ref) is expected


def test_search_id_regex_picks_entry_id():
    feed = (
        "<feed><id>http://arxiv.org/api/query?search_query=all:x</id>"
        "<entry><id>http://arxiv.org/abs/1512.03385v1</id>"
        "<title>Deep Residual Learning</title></entry></feed>"
    )
    m = _SEARCH_ID.search(feed)
    assert m and m.group(1) == "1512.03385v1"
