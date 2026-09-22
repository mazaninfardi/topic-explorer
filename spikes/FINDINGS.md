# Gemini extraction spike — findings

**Verdict: GO.** Gemini (Vertex AI, `gemini-2.5-flash`) produces accurate, genuinely accessible What/Why/How + salient terms from a raw arXiv PDF. The core premise holds; proceed to MVP.

## Method
- Vertex AI via `google-genai` (`Client(vertexai=True, project=…, location=us-central1)`).
- PDF passed as **inline bytes** (`Part.from_bytes`, `application/pdf`) — the AI-Studio **File API is not used on Vertex**.
- Structured output: `response_mime_type=application/json` + `response_schema` for `{what, why, how, salient_terms[]}`.
- 4 papers: Attention Is All You Need, BERT, ResNet, and 2203.00555 (a Post-LN/Pre-LN deep-transformer paper — was mislabeled "alphafold2"; AlphaFold2 is not on arXiv).

## Results
| Paper | Latency | PDF | Tokens | Quality |
|---|---|---|---|---|
| Attention | 13.8s | 2.1MB | 5.9k | Excellent |
| BERT | 83.4s | 0.7MB | 5.6k | Excellent |
| ResNet | 12.2s | 0.8MB | 4.9k | Excellent |
| 2203.00555 | 20.0s | 1.2MB | 7.2k | Excellent |

What = paper's headline (M1+M5), Why = context+gap (M2+M3), How = method (M4) — all mapped correctly and read as plain language a curious newcomer could follow.

## Learnings that shape MVP
1. **Vertex ingestion = inline bytes (or GCS URI), not the File API.** Update the plan/spec: download the arXiv PDF server-side and pass inline bytes. For very large PDFs, fall back to uploading to a GCS bucket and `Part.from_uri`. (arXiv PDFs here were 0.7–2.1MB; inline is fine.)
2. **`gemini-2.5-flash` is sufficient** — no need for `pro` at MVP. Keep the model behind config so we can switch.
3. **Latency is high and variable (12–83s).** This validates the **What-first streaming** design: do a fast first pass for What (+ its salient terms) so the root node appears quickly, then a second call (or continued stream) for Why/How. A single blocking call would make users wait up to ~80s.
4. **Constrain salient terms to verbatim substrings.** The spike returned terms like "Bidirectional Encoder Representations from Transformers (BERT)" that don't appear verbatim in the What text — fine as a list, but the graph UI highlights terms *inside* node text. For MVP, instruct the model to return salient terms that appear **verbatim** in the relevant node's text (or return per-node term spans), so `TermText` can highlight and expand them.
5. **Term definitions (defineTerm) not tested here.** The hybrid "general definition + one paper-usage line" is a separate, lower-risk call; validate during MVP build.

## Recommended MVP extraction contract (starting point)
- **What call (fast):** input PDF → `{ what: string, salient_terms: string[] }`, terms verbatim in `what`.
- **Why/How call:** input PDF (or cached context) → `{ why: string, why_terms: string[], how: string, how_terms: string[] }`, terms verbatim in their text.
- Stream What first; render root node; then fill Why/How.
- Model: `gemini-2.5-flash`; region `us-central1`; auth via ADC (Vertex), config (project/location/model) from env.
