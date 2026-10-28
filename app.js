import { pipeline, TextStreamer } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1";

const MODEL = "HuggingFaceTB/SmolLM2-135M-Instruct";

const el = {
  form: document.getElementById("summon"),
  repo: document.getElementById("repo"),
  token: document.getElementById("token"),
  begin: document.getElementById("begin"),
  status: document.getElementById("status"),
  progress: document.getElementById("progress"),
  bar: document.getElementById("bar"),
  graveyard: document.getElementById("graveyard"),
  colophon: document.getElementById("colophon"),
};

let medium = null;

function say(text, isError = false) {
  el.status.textContent = text;
  el.status.classList.toggle("err", isError);
}

/* ---------------------------------------------------------------- the model */

// SmolLM2 is small enough to live in a tab. WebGPU when the browser has it, WASM when it doesn't.
async function summonMedium() {
  if (medium) return medium;

  const hasWebGPU = "gpu" in navigator;
  say(hasWebGPU ? "Loading the model (WebGPU)…" : "Loading the model (CPU — slower)…");
  el.progress.hidden = false;

  medium = await pipeline("text-generation", MODEL, {
    // q4f16 halves the weights again on a GPU that has fp16; WASM needs the fp32 variant
    dtype: hasWebGPU ? "q4f16" : "q4",
    device: hasWebGPU ? "webgpu" : "wasm",
    progress_callback: (p) => {
      if (p.status === "progress" && p.total) {
        const pct = Math.round((p.loaded / p.total) * 100);
        el.bar.style.width = `${pct}%`;
        say(`Downloading open weights — ${pct}%`);
      }
    },
  });

  el.progress.hidden = true;
  return medium;
}

/* ------------------------------------------------------------- the GitHub dig */

async function dig(owner, name, token) {
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const get = async (path) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${name}${path}`, { headers });
    if (res.status === 404) throw new Error("No such repository — check the owner/name.");
    if (res.status === 403 || res.status === 429) {
      throw new Error("GitHub rate limit reached. Add a token above, or wait an hour.");
    }
    if (!res.ok) throw new Error(`GitHub returned ${res.status}.`);
    return res.json();
  };

  const [meta, commits, pulls, branches] = await Promise.all([
    get(""),
    get("/commits?per_page=100"),
    get("/pulls?state=closed&per_page=100&sort=updated&direction=desc"),
    get("/branches?per_page=100"),
  ]);

  return { meta, commits, pulls, branches };
}

const when = (iso) => (iso ? iso.slice(0, 10) : "date unknown");
const firstLine = (msg) => (msg || "").split("\n")[0].trim();

// A revert is the clearest grave in a git history: someone shipped it, then took it back.
const ERASURE = /\b(remove|removes|removed|delete|deleted|drop|dropped|deprecate|deprecated|kill|killed|purge|rip out)\b/i;

function exhume({ commits, pulls, branches, meta }) {
  const reverts = commits
    .filter((c) => /^revert\b/i.test(firstLine(c.commit.message)))
    .slice(0, 5)
    .map((c) => ({
      title: firstLine(c.commit.message),
      meta: `reverted ${when(c.commit.author?.date)} · ${c.commit.author?.name ?? "unknown hand"}`,
      url: c.html_url,
      kind: "a commit that was shipped and then taken back",
    }));

  const erased = commits
    .filter((c) => !/^revert\b/i.test(firstLine(c.commit.message)) && ERASURE.test(firstLine(c.commit.message)))
    .slice(0, 5)
    .map((c) => ({
      title: firstLine(c.commit.message),
      meta: `erased ${when(c.commit.author?.date)} · ${c.commit.author?.name ?? "unknown hand"}`,
      url: c.html_url,
      kind: "a commit that deleted something from the codebase",
    }));

  const unmerged = pulls
    .filter((p) => !p.merged_at)
    .slice(0, 8)
    .map((p) => ({
      title: `#${p.number} ${p.title}`,
      meta: `opened ${when(p.created_at)} · closed ${when(p.closed_at)} · @${p.user?.login ?? "ghost"}`,
      url: p.html_url,
      kind: "a pull request that was closed without ever being merged",
    }));

  const forsaken = branches
    .filter((b) => b.name !== meta.default_branch)
    .slice(0, 5)
    .map((b) => ({
      title: b.name,
      meta: `still pointing at ${b.commit.sha.slice(0, 7)} · never merged into ${meta.default_branch}`,
      url: `${meta.html_url}/tree/${encodeURIComponent(b.name)}`,
      kind: "a branch left behind, never merged into the main line",
    }));

  return [
    { id: "unmerged", name: "The Unmerged", gloss: "Finished work. Reviewed or ignored. Closed anyway.", ghosts: unmerged },
    { id: "forsaken", name: "The Forsaken", gloss: "Branches still standing, waiting for a merge that never came.", ghosts: forsaken },
    { id: "revenants", name: "Revenants", gloss: "Shipped, then taken back — the only ghosts a history admits to making.", ghosts: reverts },
    { id: "erased", name: "The Erased", gloss: "Commits whose whole purpose was to delete something.", ghosts: erased },
  ].filter((r) => r.ghosts.length);
}

/* ----------------------------------------------------------------- channeling */

function render(rites, repoLabel) {
  el.graveyard.hidden = false;
  el.graveyard.innerHTML = "";

  for (const rite of rites) {
    const section = document.createElement("section");
    section.className = "rite";
    section.innerHTML = `
      <h2>${rite.name} <span class="count">${rite.ghosts.length}</span></h2>
      <p class="gloss">${rite.gloss}</p>`;

    rite.ghosts.forEach((g, i) => {
      const row = document.createElement("article");
      row.className = "ghost";
      const h = document.createElement("h3");
      const a = document.createElement("a");
      a.href = g.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = g.title;
      h.append(a);
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = g.meta;
      const epitaph = document.createElement("p");
      epitaph.className = "epitaph waiting";
      epitaph.textContent = "…";
      epitaph.id = `${rite.id}-${i}`;
      row.append(h, meta, epitaph);
      section.append(row);
    });

    el.graveyard.append(section);
  }

  el.graveyard.insertAdjacentHTML(
    "afterbegin",
    `<p class="status">${rites.reduce((n, r) => n + r.ghosts.length, 0)} abandoned things found in ${repoLabel}.</p>`
  );
}

function prompt(ghost, repoLabel) {
  return [
    {
      role: "system",
      content:
        "You speak for work that was abandoned in a software repository. You are given one abandoned thing. " +
        "Reply with one short sentence, in its own voice, as an epitaph. Be specific to what you are told. " +
        "Be wry and a little mournful. Never explain yourself, never use lists, never exceed one sentence.",
    },
    {
      role: "user",
      content: `Repository: ${repoLabel}\nThis is ${ghost.kind}.\nIt was called: "${ghost.title}"\nDetails: ${ghost.meta}\n\nSpeak its epitaph.`,
    },
  ];
}

async function channel(rites, repoLabel) {
  const pipe = await summonMedium();
  const total = rites.reduce((n, r) => n + r.ghosts.length, 0);
  let done = 0;

  for (const rite of rites) {
    for (let i = 0; i < rite.ghosts.length; i++) {
      const node = document.getElementById(`${rite.id}-${i}`);
      node.classList.remove("waiting");
      node.textContent = "";
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      cursor.textContent = "▌";
      node.append(cursor);

      const streamer = new TextStreamer(pipe.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text) => cursor.insertAdjacentText("beforebegin", text),
      });

      try {
        await pipe(prompt(rite.ghosts[i], repoLabel), {
          max_new_tokens: 48,
          temperature: 0.9,
          top_p: 0.9,
          do_sample: true,
          streamer,
        });
      } catch (err) {
        node.textContent = "…it would not say.";
        console.error(err);
      }

      cursor.remove();
      if (!node.textContent.trim()) node.textContent = "…silence.";
      done++;
      say(`Channeling — ${done} of ${total}`);
    }
  }

  say(`${total} abandoned things spoke.`);
  el.colophon.hidden = false;
}

/* --------------------------------------------------------------------- driver */

el.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const match = el.repo.value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").match(/^([\w.-]+)\/([\w.-]+)/);
  if (!match) return say("Write the repository as owner/name.", true);

  const [, owner, name] = match;
  const repoLabel = `${owner}/${name}`;

  el.begin.disabled = true;
  el.graveyard.hidden = true;
  el.colophon.hidden = true;
  say(`Reading the history of ${repoLabel}…`);

  try {
    const dug = await dig(owner, name, el.token.value.trim());
    const rites = exhume(dug);

    if (!rites.length) {
      say("Nothing was abandoned here. Try an older or busier repository.");
      return;
    }

    render(rites, repoLabel);
    await channel(rites, repoLabel);
  } catch (err) {
    say(err.message || "Could not read that repository.", true);
    console.error(err);
  } finally {
    el.begin.disabled = false;
  }
});
