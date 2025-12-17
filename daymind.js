// ===============================
// DayMind AI – Frontend Connector
// ===============================

// ✅ FINAL VERIFIED API ENDPOINT
const API_URL = "https://daymind-api.vercel.app/api/plan";

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

function bundleText(r) {
  let txt = `ANCHOR:\n${r.anchor_task}\n\n`;

  txt += "MUST-DO:\n" + (r.must_do || []).map(x => `- ${x}`).join("\n") + "\n\n";
  txt += "SHOULD-DO:\n" + (r.should_do || []).map(x => `- ${x}`).join("\n") + "\n\n";
  txt += "CAN WAIT:\n" + (r.can_wait || []).map(x => `- ${x}`).join("\n") + "\n\n";
  txt += "NOISE:\n" + (r.noise || []).map(x => `- ${x}`).join("\n") + "\n\n";

  txt += "FLOW:\n";
  (r.schedule_blocks || []).forEach(b => {
    txt += `- ${b.label} (${b.minutes}m): ${(b.tasks || []).join(", ")}\n`;
  });

  if (r.cancellations?.length) {
    txt += "\nCANCEL:\n" + r.cancellations.map(x => `- ${x}`).join("\n");
  }

  if (r.moves?.length) {
    txt += "\n\nMOVE:\n";
    r.moves.forEach(m => {
      txt += `- ${m.task}: ${m.from} → ${m.to} (${m.why})\n`;
    });
  }

  txt += `\nNOTE:\n${r.tone_note}\n`;

  if (r.assumptions?.length) {
    txt += "\nASSUMPTIONS:\n" + r.assumptions.map(a => `- ${a}`).join("\n");
  }

  return txt;
}

async function run(mode) {
  const dump = $("dump").value.trim();
  if (dump.length < 10) {
    alert("Please add a bit more detail.");
    return;
  }

  const energy = $("energy").value;

  statusEl.textContent = "Thinking…";
  out.style.display = "none";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, dump, energy })
    });

    if (!res.ok) throw new Error("API error");

    const r = await res.json();

    $("anchor").innerHTML = `<div class="card"><b>Anchor:</b> ${r.anchor_task}</div>`;
    fillList($("must"), r.must_do);
    fillList($("should"), r.should_do);
    fillList($("wait"), r.can_wait);
    fillList($("noise"), r.noise);
    setFlow(r.schedule_blocks);

    if (mode === "AI_RUN_MY_DAY") {
      $("runMyDayExtras").style.display = "block";
      fillList($("cancel"), r.cancellations);

      $("moves").innerHTML = "";
      (r.moves || []).forEach(m => {
        const li = document.createElement("li");
        li.innerHTML = `<b>${m.task}</b> — ${m.from} → ${m.to} <span class="muted">(${m.why})</span>`;
        $("moves").appendChild(li);
      });
    } else {
      $("runMyDayExtras").style.display = "none";
    }

    $("note").textContent = r.tone_note || "";
    fillList($("assumptions"), r.assumptions);

    $("copyBtn").onclick = async () => {
      await navigator.clipboard.writeText(bundleText(r));
      statusEl.textContent = "Copied ✓";
      setTimeout(() => statusEl.textContent = "", 1200);
    };

    out.style.display = "block";
    statusEl.textContent = "";

  } catch (err) {
    statusEl.textContent = "";
    alert("Something went wrong. Check API or Vercel logs.");
  }
}

document.querySelectorAll("button[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => run(btn.dataset.mode));
});
