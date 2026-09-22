import pytest

from app.arxiv import IngestionError, to_pdf_url


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
