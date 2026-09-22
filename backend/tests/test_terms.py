from app.gemini import _verbatim


def test_keeps_only_verbatim_terms():
    text = "The Transformer relies on attention mechanisms."
    terms = ["Transformer", "attention", "recurrence", "self-attention"]
    # "recurrence" and "self-attention" are not substrings -> dropped
    assert _verbatim(text, terms) == ["Transformer", "attention"]


def test_case_insensitive_and_dedup():
    text = "Residual learning uses shortcut connections."
    assert _verbatim(text, ["residual", "Residual", "shortcut"]) == ["residual", "shortcut"]
