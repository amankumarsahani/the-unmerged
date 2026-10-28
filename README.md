# Git Séance 🕯️

**Every repository is a graveyard.** Reverted commits, erased files, pull requests that died
waiting for review — all of it is still in the history, and none of it gets a funeral.

Git Séance names a repository, exhumes what died in it, and lets the dead speak. Every epitaph on
the page is written by an open-weight language model **running inside your browser tab** — no
inference server, no API key, nothing about the repository you searched ever leaves your machine.

**[Open the séance →](https://amankumarsahani.github.io/git-seance/)**

---

## What it summons

The GitHub REST API gives up four kinds of dead:

| Rite | What it exhumes |
| --- | --- |
| **Revenants** | Commits that were shipped and then reverted — the only ghosts a history admits to making |
| **The Erased** | Commits whose whole purpose was to delete something |
| **The Unmerged** | Pull requests closed without ever being merged |
| **The Forsaken** | Branches still standing, waiting for a merge that never came |

Each one is handed to the model with its title, its dates and the hand that buried it. The model
answers in the voice of the dead code itself.

## The open pieces are the whole project

Git Séance runs [**SmolLM2-360M-Instruct**](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct)
— Apache-2.0 weights, trained on openly published data — through
[**Transformers.js**](https://github.com/huggingface/transformers.js), which executes ONNX models
on WebGPU where the browser offers it and WASM where it doesn't.

That is not a detail of the implementation. It *is* the implementation:

- **No server exists.** This is three static files. There is no backend to deploy, no key to
  rotate, no bill that grows with traffic. Fork it and it is yours, permanently.
- **Nothing is uploaded.** The repository you type is read by your browser and reasoned about by
  your browser. A closed API would mean sending someone's git history to a third party to be
  logged.
- **It still works in five years.** The weights are downloadable and the licence is Apache-2.0.
  No deprecation notice can switch this project off.

A 360M-parameter model is small, and sometimes it is wrong or strange. That is the honest trade:
it is small enough to live in a tab, which is what makes everything above true.

## Running it

No build step and no dependencies to install.

```bash
git clone https://github.com/amankumarsahani/git-seance.git
cd git-seance
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The model (~250 MB quantised) downloads once and is cached by
the browser.

**Rate limits:** unauthenticated GitHub allows 60 requests an hour and a séance costs four. Paste
a [personal access token](https://github.com/settings/tokens) into the optional field to raise it.
The token is used for exactly one `fetch` and is never stored.

**Browser support:** WebGPU (Chrome/Edge 113+, Safari 26+) runs it in seconds. Everything else
falls back to WASM, which works and is slower.

## Licence

MIT — see [LICENSE](LICENSE). The model carries its own Apache-2.0 licence.
