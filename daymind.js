// IMPORTANT: replace with your deployed backend URL (Part B).
const API_URL = "https://YOUR-VERCEL-PROJECT.vercel.app/api/plan";

const $ = (id) => document.getElementById(id);
const out = $("out");
const statusEl = $("status");

function fillList(ul, items) {
  ul.innerHTML = "";
  (items || []).forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    ul.appendChild(li);
  });
}

function setFlow(blocks) {
  const wrap = $("flow");
  wrap.innerHTML = "";
  (blocks || []).forEach((b) => {
    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "10px";
    div.innerHTML = `
      <b>${b.label}</b> <span class="muted">(${b.minutes} min)</span>
      <ul>${(b.tasks || []).map(x => `<li>${x}</li>`).join("")}</ul>
    `;
    wrap.appendChild(div);
  });
}

function textBundle(r) {
  const lines = [];
  lines.push(`ANCHOR: ${r.anchor_task}`);
  lines.push("");
  lines.push("MUST-DO:");
  (r.must_do || []).forEach(x => lines.push(`- ${x}`));
  lines.push("");
  lines.push("SHOULD-DO:");
  (r.should_do || []).forEach(x => lines.push(`- ${x}`));
  lines.push("");
  lines.push("CAN WAIT:");
  (r.can_wait || []).forEach(x => lines.push(`- ${x}`));
  lines.push("");
  lines.push("NOISE:");
  (r.noise || []).forEach(x => lines.push(`- ${x}`));
  lines.push("");
  lines.push("FLOW:");
  (r.schedule_blocks || []).forEach(b => lines.push(`- ${b.label} (${b.minutes}m): ${(b.tasks||[]).join(", ")}`));
  if (r.cancellations?.length) {
    lines.push("");
    lines.push("CANCEL:");
    r.cancellations.forEach(x => lines.push(`- ${x}`));
  }
  if (r.moves?.length) {
    lines.push("");
    lines.push("MOVE:");
    r.moves.forEach(m => lines.push(`- ${m.task}: ${m.from} → ${m.to} (${m.why})`));
  }
  lines.push("");
  lines.push(`NOTE: ${r.tone_note}`);
  if (r.assumptions?.length) {
    lines.push("");
    lines.push("ASSUMPTIONS:");
    r.assumptions.forEach(a => lines.push(`- ${a}`));
  }
  return lines.join("\n");
}

async function run(mode) {
  const dump = $("dump").value.trim();
  if (dump.length < 10) {
    alert("Add a little more detail (at least 1–2 lines).");
    return;
  }
  const energy = $("energy").value;

  statusEl.textContent = "Thinking…";
  out.style.display = "none";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, dump, energy }),
  });

  if (!res.ok) {
    const txt = await res.text();
    statusEl.textContent = "";
    alert(`Error: ${txt || res.status}`);
    return;
  }

  const r = await res.json();

  $("anchor").innerHTML = `<div class="card"><b>Anchor:</b> ${r.anchor_task}</div>`;
  fillList($("must"), r.must_do);
  fillList($("should"), r.should_do);
  fillList($("wait"), r.can_wait);
  fillList($("noise"), r.noise);
  setFlow(r.schedule_blocks);

  // Run-my-day extras
  const extras = $("runMyDayExtras");
  if (mode === "AI_RUN_MY_DAY") {
    extras.style.display = "block";
    fillList($("cancel"), r.cancellations);
    $("moves").innerHTML = "";
    (r.moves || []).forEach(m => {
      const li = document.createElement("li");
      li.innerHTML = `<b>${m.task}</b> — ${m.from} → ${m.to} <span class="muted">(${m.why})</span>`;
      $("moves").appendChild(li);
    });
  } else {
    extras.style.display = "none";
  }

  $("note").textContent = r.tone_note || "";
  fillList($("assumptions"), r.assumptions);

  $("copyBtn").onclick = async () => {
    await navigator.clipboard.writeText(textBundle(r));
    statusEl.textContent = "Copied ✅";
    setTimeout(() => (statusEl.textContent = ""), 1200);
  };

  statusEl.textContent = "";
  out.style.display = "block";
}

document.querySelectorAll("button[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => run(btn.getAttribute("data-mode")));
});
