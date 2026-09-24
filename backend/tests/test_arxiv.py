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
