# The Unmerged 🕯️

A repository is read as a record of what got built. It is equally a record of **what didn't** —
and that half never gets read.

The Unmerged reads any public repository's history, finds the work that was abandoned in it, and
has an open-weight language model write a one-line epitaph for each — **running entirely inside
your browser tab.** No install, no server, no API key, no account.

**[Open it →](https://amankumarsahani.github.io/the-unmerged/)**

---

## What it finds

| Rite | What it exhumes |
| --- | --- |
| **The Unmerged** | Pull requests closed without ever being merged — finished work that went nowhere |
| **The Forsaken** | Branches still standing, never merged back into the main line |
| **Revenants** | Commits shipped and then reverted — the only ghosts a history admits to making |
| **The Erased** | Commits whose whole purpose was to delete something |

Point it at `facebook/react` and it finds branches named `0.3-stable` through `0.9-stable`, each
still pointing at a commit, each still waiting.

## The open pieces are the whole project

It runs [**SmolLM2-135M-Instruct**](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct)
— Apache-2.0 weights, openly published training data — through
[**Transformers.js**](https://github.com/huggingface/transformers.js), executing ONNX on WebGPU
where the browser has it and WASM where it doesn't.

That isn't a detail of the implementation. It *is* the implementation:

- **No server exists.** Three static files. Nothing to deploy, no key to rotate, no bill that
  grows with strangers' curiosity. Fork it and it is permanently yours.
- **Nothing is uploaded.** Your browser reads the history and your browser reasons about it. The
  privacy isn't a feature that was implemented carefully — it's a property of having no server.
- **It still works in five years.** The weights are downloadable and Apache-2.0. No deprecation
  notice can switch this off.

135M parameters is small, and it is sometimes wrong or strange. That is the honest trade: small
enough to load in a tab over a normal connection, which is what makes everything above true.

## Running it

No build step, no dependencies.

```bash
git clone https://github.com/amankumarsahani/the-unmerged.git
cd the-unmerged
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

**Model download:** ~112 MB on WebGPU (`q4f16`), ~174 MB on the WASM fallback (`q4`). Once, then
cached by the browser.

**Rate limits:** unauthenticated GitHub allows 60 requests an hour and one reading costs four.
Paste a [personal access token](https://github.com/settings/tokens) into the optional field to
raise it — it's used for exactly one `fetch` and is never stored.

**Browser support:** WebGPU (Chrome/Edge 113+, Safari 26+) runs it in seconds. Everything else
falls back to WASM, which works and is slower.

## Licence

MIT — see [LICENSE](LICENSE). The model carries its own Apache-2.0 licence.
