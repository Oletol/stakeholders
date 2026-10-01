// Comprehensive Needs Analysis – group workspace, live sync and PDF export
import { initGroup, status, esc } from "./group.js";
import { uid, todayISO, formatDate } from "./db.js";

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

const COMPONENTS = {
  "1.1": "Component 1.1: Conduct needs assessment",
  "1.2": "Component 1.2: Conduct needs research",
  "1.3": "Component 1.3: Conduct needs limitations",
  "1.4": "Component 1.4: Conduct needs analysis"
};

export const STAGES = ["Needs analysis", "Design", "Development", "Pilot", "Launch", "Evaluation"];
const ROLES = ["Decision maker", "User", "Implementer", "Expert or regulator", "Partner"];
const DIMENSIONS = ["Background", "Prior knowledge", "Motivation", "Goals", "Digital competence", "Learning behaviour",
  "Typical difficulties", "Barriers", "Assessment experience", "Language proficiency (CEFR)", "Target language situations"];
const CEFR = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2", "Unknown"];
const SCORE = ["1", "2", "3", "4", "5"];
const SUPPORT = ["-2", "-1", "0", "+1", "+2"];
const SUPPORT_LABEL = { "-2": "Actively opposed", "-1": "Resistant", "0": "Neutral", "+1": "Supportive", "+2": "Champion" };

const T = (label, extra = {}) => ({ label, kind: "textarea", ...extra });
const S = (label, options, extra = {}) => ({ label, kind: "select", options, ...extra });

const TASKS = {
  t1: { c: "1.1", title: "Task 1 – Client profile", parts: [
    { key: "p", type: "fixed", cols: ["Client profile element", "Your notes"],
      rows: ["Organisation or unit", "Core activity", "Educational area or product", "Decision makers",
        "Available contacts and data sources", "Known expectations and priorities"] }] },

  t2: { c: "1.1", title: "Task 2 – Market scan", parts: [
    { key: "rows", type: "rows", min: 3, cols: [T("Source"), T("Finding"), T("Possible relevance")] }] },

  t3: { c: "1.1", title: "Task 3 – Stakeholder map", parts: [
    { key: "reg", type: "rows", min: 10, title: "A. Stakeholder register",
      hint: "List at least 10 stakeholders of your internship project. You may include your own project team.",
      cols: [{ label: "Stakeholder", kind: "input", width: "22%" }, S("Internal / external", ["Internal", "External"]),
        S("Role", ROLES), T("How they affect or are affected by the project")] },
    { key: "assess", type: "assess", title: "B. Stakeholder assessment",
      hint: "Rate each stakeholder for the selected project stage. Scores 1–2 = low, 3 = borderline (explain why in the rationale), 4–5 = high. Support: –2 actively opposed … +2 champion." },
    { key: "plots", type: "plots", title: "C. Influence and Impact Grid · Influence and Interest Matrix",
      hint: "Built automatically from your ratings. Numbers refer to the stakeholder register." },
    { key: "raci", type: "raci", title: "D. RACI matrix by project stage",
      hint: "Add the key tasks of each project stage. For every task choose R, A, C or I for the stakeholders involved. Each task should have exactly one A (Accountable) and at least one R (Responsible). Roles may change from stage to stage." },
    { key: "notes", type: "fields", title: "E. Conflicts and direct involvement", fields: [
      { key: "conflicts", label: "Which stakeholders' interests may conflict? Describe the conflict." },
      { key: "involve", label: "Which stakeholders will you involve directly during the internship, and how?" }] }] },

  t4: { c: "1.1", title: "Task 4 – Questions for the client", parts: [
    { key: "rows", type: "rows", min: 8, cols: [T("Your question"), T("Why you need this information")] }] },

  t5: { c: "1.2", title: "Task 5 – Literature based audience profile", parts: [
    { key: "rows", type: "rows", min: 4, cols: [T("Source"), S("Profile dimension", DIMENSIONS), T("Finding"),
      T("Design relevance"), S("Needs verification?", ["Yes", "Partly", "No"])] }] },

  t6: { c: "1.2", title: "Task 6 – Provisional learner profile", parts: [
    { key: "p", type: "fixed", cols: ["Profile element", "Provisional description"],
      rows: ["Educational or professional background", "Goals and motivations", "Prior experience",
        "Target situations, genres and texts", "Digital practices", "Difficulties and barriers", "Aspects that remain unknown"] },
    { key: "cefr", type: "fixed", title: "Likely CEFR level by activity type", cols: ["Activity", "Likely level", "Evidence or source"],
      rows: ["Reception", "Production", "Interaction", "Mediation"],
      fields: [{ kind: "select", options: CEFR }, { kind: "textarea" }] }] },

  t7: { c: "1.2", title: "Task 7 – Evidence and projection", parts: [
    { key: "rows", type: "rows", min: 3, cols: [T("What literature suggests"), T("What must be checked in the real audience?")] }] },

  t8: { c: "1.3", title: "Task 8 – Documentation inventory", parts: [
    { key: "rows", type: "rows", min: 3, cols: [T("Document"), T("Owner or source"), T("Why it matters"),
      S("Available?", ["Yes", "Requested", "No"])] }] },

  t9: { c: "1.3", title: "Task 9 – Limitations and design requirements", parts: [
    { key: "rows", type: "rows", min: 3, cols: [T("Document"), T("Requirement or restriction"),
      S("Type", ["Legal", "Institutional", "Technical", "Assessment", "Language standard"]), T("Design implication")] }] },

  t10: { c: "1.3", title: "Task 10 – Conflicts between requirements", parts: [
    { key: "f", type: "fields", fields: [
      { key: "conflict", label: "What is the conflict?" },
      { key: "fixed", label: "Which requirement is non negotiable?" },
      { key: "adapt", label: "Which condition can be adapted?" },
      { key: "authority", label: "Who has authority to resolve the conflict?" }] }] },

  t11: { c: "1.3", title: "Task 11 – Limitations register", parts: [
    { key: "rows", type: "rows", min: 3, cols: [T("Limitation"), T("Evidence"), T("Impact on project")] }] },

  t12: { c: "1.4", title: "Task 12 – Research questions", parts: [
    { key: "rows", type: "rows", min: 3, cols: [T("What do we need to know?"), T("Why do we need it?"), T("What decision will it inform?")] }] },

  t13: { c: "1.4", title: "Task 13 – Question types", parts: [
    { key: "f", type: "fields", fields: [
      { key: "plan", label: "Which question types will you use in each section of the questionnaire, and why?" }] }] },

  t14: { c: "1.4", title: "Task 14 – Improved questionnaire items", parts: [
    { key: "rows", type: "rows", min: 3, cols: [T("Original item"),
      S("Problem", ["Vague frequency", "Double-barrelled", "Leading", "Unanchored self-assessment", "Preference only", "Professional jargon", "Other"]),
      T("Revised item")] }] },

  t15: { c: "1.4", title: "Task 15 – Questionnaire draft", parts: [
    { key: "rows", type: "rows", min: 6, cols: [
      S("Section", ["Background", "Current tasks", "Language use and self-assessment", "Difficulties", "Current strategies", "Priorities", "Open feedback"]),
      T("Item text", { width: "34%" }),
      S("Item type", ["Single choice", "Multiple choice", "Frequency scale", "Likert scale", "Self-assessment grid", "Ranking", "Open response"]),
      T("Response options")] }] },

  t16: { c: "1.4", title: "Task 16 – Ethics and pilot", parts: [
    { key: "ethics", group: "ethics", type: "checks", title: "Ethics checklist", items: [
      "The introduction states the purpose of the study, who conducts it and how the results will be used.",
      "Participation is voluntary and respondents may skip questions or stop at any time.",
      "Only data needed for design decisions is collected. Ranges are used instead of exact age, and names are not requested unless necessary.",
      "If any personal data is collected, the procedure complies with Federal Law No. 152-FZ and the organisation's data rules.",
      "The survey platform is approved by the organisation.",
      "The client has approved the questionnaire before distribution."] },
    { key: "consent", group: "ethics", type: "fields", fields: [
      { key: "text", label: "Introduction and consent text shown to respondents" }] },
    { key: "pilot", group: "pilot", type: "rows", min: 2, title: "Pilot log", cols: [T("Item"), T("Problem observed"), T("Revision")] },
    { key: "pilotinfo", group: "pilot", type: "fields", fields: [
      { key: "who", label: "Who took part in the pilot, and how long did completion take?" }] }] },

  t17: { c: "1.4", title: "Task 17 – Fieldwork package", parts: [
    { key: "p", type: "fixed", cols: ["Package element", "Your plan"],
      rows: ["Target respondent description", "Planned number of respondents", "Distribution method",
        "Data collection period", "Plan for analysing responses", "Client approval (who approved and when)"] }] }
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

let G = null;          // group api
let state = {};        // snapshot of cna/g{N}
let unsub = null;
const instances = [];  // rendered part instances

const get = (obj, rel) => rel.split("/").reduce((o, k) => (o == null ? undefined : o[k]), obj);
const base = () => `cna/g${G.group}`;

function sortedRows(obj) {
  return Object.entries(obj || {})
    .filter(([, v]) => v && typeof v === "object")
    .sort((a, b) => (a[1].o ?? 0) - (b[1].o ?? 0) || a[0].localeCompare(b[0]));
}

// stored rows + placeholder rows up to the minimum
function displayRows(stored, min) {
  // the first `min` rows (p0, p1, …) always exist so the table never shrinks below its minimum
  const rows = sortedRows(stored).map(([id, v]) => ({ id, o: v.o ?? 0, v }));
  for (let k = 0; k < min; k++) {
    const id = "p" + k;
    if (!rows.some(r => r.id === id)) rows.push({ id, o: k, v: {} });
  }
  return rows.sort((a, b) => a.o - b.o || a.id.localeCompare(b.id));
}

function rowHasContent(v, n) {
  return Object.keys(v || {}).some(k => k !== "o" && v[k] !== "" && v[k] != null) ;
}

// stakeholders that have a name, in register order
function stakeholders() {
  const min = TASKS.t3.parts[0].min;
  return displayRows(get(state, "t3/reg"), min)
    .filter(r => String(r.v.c0 || "").trim())
    .map((r, i) => ({ id: r.id, n: i + 1, name: String(r.v.c0).trim(), row: r.v }));
}

function control(spec, value) {
  let el;
  if (spec.kind === "select") {
    el = document.createElement("select");
    el.innerHTML = `<option value="">–</option>` + spec.options.map(o => `<option>${esc(o)}</option>`).join("");
  } else if (spec.kind === "input") {
    el = document.createElement("input");
    el.type = "text";
  } else {
    el = document.createElement("textarea");
    el.rows = 2;
  }
  if (spec.className) el.className = spec.className;
  el.value = value ?? "";
  if (spec.aria) el.setAttribute("aria-label", spec.aria);
  return el;
}

// Bind a control. rel = path inside the group; rowOrder => write {o} together with the value.
function bind(el, rel, { rowOrder = null } = {}) {
  el.dataset.rel = rel;
  const isInstant = el.tagName === "SELECT" || el.type === "checkbox";
  let timer;
  el.addEventListener(isInstant ? "change" : "input", () => {
    el.dataset.dirty = "1";
    status.saving();
    clearTimeout(timer);
    const path = `${base()}/${rel}`;
    timer = setTimeout(async () => {
      let value = el.type === "checkbox" ? el.checked : el.value;
      if (value === "" || value === false) value = null;
      try {
        if (rowOrder !== null) {
          const parts = path.split("/");
          const field = parts.pop();
          await G.db.update(parts.join("/"), { o: rowOrder, [field]: value });
        } else {
          await G.db.set(path, value);
        }
        status.saved();
      } catch (err) { status.error("Unable to save"); console.error(err); }
      delete el.dataset.dirty;
    }, isInstant ? 0 : 450);
  });
  return el;
}

function syncValues(root) {
  root.querySelectorAll("[data-rel]").forEach(el => {
    if (document.activeElement === el || el.dataset.dirty) return;
    const v = get(state, el.dataset.rel);
    if (el.type === "checkbox") el.checked = !!v;
    else if (el.value !== String(v ?? "")) el.value = v ?? "";
  });
}

function delButton(onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "row-del";
  b.title = "Delete row";
  b.setAttribute("aria-label", "Delete row");
  b.textContent = "×";
  b.addEventListener("click", onClick);
  return b;
}

function addButton(label, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ws-btn";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

/* ------------------------------------------------------------------ */
/* Part renderers. Each returns {signature(), build(el), refresh(el)}  */
/* ------------------------------------------------------------------ */

const renderers = {
  fixed(task, part) {
    const fields = part.fields || [{ kind: "textarea" }];
    return {
      signature: () => "fixed",
      build(el) {
        const table = document.createElement("table");
        table.innerHTML = `<thead><tr>${part.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody></tbody>`;
        const tb = table.tBodies[0];
        part.rows.forEach((label, r) => {
          const tr = tb.insertRow();
          tr.insertCell().outerHTML = `<td class="row-label">${esc(label)}</td>`;
          fields.forEach((f, i) => {
            const rel = fields.length === 1 ? `${task}/${part.key}/r${r}` : `${task}/${part.key}/r${r}/f${i}`;
            const td = tr.insertCell();
            td.appendChild(bind(control({ ...f, aria: `${label}` }), rel));
          });
        });
        const wrap = document.createElement("div");
        wrap.className = "ws-scroll";
        wrap.appendChild(table);
        el.appendChild(wrap);
      }
    };
  },

  rows(task, part) {
    const rel = `${task}/${part.key}`;
    return {
      signature: () => displayRows(get(state, rel), part.min).map(r => r.id).join(","),
      build(el) {
        const rows = displayRows(get(state, rel), part.min);
        const table = document.createElement("table");
        table.innerHTML = `<thead><tr><th>#</th>${part.cols.map(c =>
          `<th${c.width ? ` style="width:${c.width}"` : ""}>${esc(c.label)}</th>`).join("")}<th></th></tr></thead><tbody></tbody>`;
        const tb = table.tBodies[0];
        rows.forEach((row, i) => {
          const tr = tb.insertRow();
          tr.insertCell().outerHTML = `<td class="num-col">${i + 1}</td>`;
          part.cols.forEach((c, ci) => {
            const td = tr.insertCell();
            td.appendChild(bind(control({ ...c, aria: `${c.label}, row ${i + 1}` }, row.v[`c${ci}`]),
              `${rel}/${row.id}/c${ci}`, { rowOrder: row.o }));
          });
          const td = tr.insertCell();
          td.className = "del-col";
          td.appendChild(delButton(async () => {
            if (rowHasContent(row.v) && !confirm("Delete this row?")) return;
            try { await G.db.remove(`${base()}/${rel}/${row.id}`); status.saved(); }
            catch (err) { status.error("Unable to delete"); console.error(err); }
          }));
        });
        const wrap = document.createElement("div");
        wrap.className = "ws-scroll";
        wrap.appendChild(table);
        el.appendChild(wrap);
        el.appendChild(addButton("+ Add row", async () => {
          const id = uid();
          try { await G.db.update(`${base()}/${rel}/${id}`, { o: Date.now() }); }
          catch (err) { status.error("Unable to add row"); console.error(err); }
        }));
      }
    };
  },

  fields(task, part) {
    return {
      signature: () => "fields",
      build(el) {
        part.fields.forEach(f => {
          const box = document.createElement("label");
          box.className = "ws-field";
          box.style.display = "block";
          box.innerHTML = `<span class="field-label">${esc(f.label)}</span>`;
          const ta = control({ kind: "textarea" });
          ta.rows = 3;
          box.appendChild(bind(ta, `${task}/${part.key}/${f.key}`));
          el.appendChild(box);
        });
      }
    };
  },

  checks(task, part) {
    return {
      signature: () => "checks",
      build(el) {
        part.items.forEach((text, i) => {
          const lab = document.createElement("label");
          lab.className = "ws-check";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          lab.appendChild(bind(cb, `${task}/${part.key}/i${i}`));
          lab.appendChild(document.createTextNode(text));
          el.appendChild(lab);
        });
      }
    };
  },

  assess(task, part) {
    return {
      signature: () => stakeholders().map(s => s.id + ":" + s.name).join("|"),
      build(el) {
        const stageLab = document.createElement("label");
        stageLab.style.display = "block";
        stageLab.innerHTML = `<span class="field-label">Project stage of this assessment</span>`;
        const stage = control({ kind: "select", options: STAGES, aria: "Project stage" });
        stage.style.maxWidth = "280px";
        stageLab.appendChild(bind(stage, `${task}/stage`));
        el.appendChild(stageLab);

        const list = stakeholders();
        if (!list.length) {
          el.insertAdjacentHTML("beforeend", `<div class="ws-empty" style="margin-top:10px">Add stakeholders to the register (part A) to rate them here.</div>`);
          return;
        }
        const table = document.createElement("table");
        table.innerHTML = `<thead><tr><th>#</th><th>Stakeholder</th><th>Influence</th><th>Impact</th><th>Interest</th>
          <th>Current support</th><th>Desired support</th><th>Rationale</th></tr></thead><tbody></tbody>`;
        const tb = table.tBodies[0];
        list.forEach(s => {
          const tr = tb.insertRow();
          tr.insertCell().outerHTML = `<td class="num-col">${s.n}</td>`;
          tr.insertCell().outerHTML = `<td class="row-label" style="width:auto">${esc(s.name)}</td>`;
          [["inf", SCORE], ["imp", SCORE], ["int", SCORE], ["cur", SUPPORT], ["des", SUPPORT]].forEach(([k, opts]) => {
            const td = tr.insertCell();
            const c = control({ kind: "select", options: opts, className: "score", aria: `${k} – ${s.name}` });
            td.appendChild(bind(c, `${task}/assess/${s.id}/${k}`));
          });
          const td = tr.insertCell();
          td.style.minWidth = "200px";
          td.appendChild(bind(control({ kind: "textarea", aria: `Rationale – ${s.name}` }), `${task}/assess/${s.id}/why`));
        });
        const wrap = document.createElement("div");
        wrap.className = "ws-scroll";
        wrap.style.marginTop = "10px";
        wrap.appendChild(table);
        el.appendChild(wrap);
      }
    };
  },

  plots(task) {
    return {
      signature: () => "plots",
      build(el) { el.innerHTML = `<div class="plots-host"></div>`; },
      refresh(el) {
        const host = el.querySelector(".plots-host");
        const pts = assessedPoints(task);
        host.innerHTML = `
          <div class="plots">
            <div class="plot"><h5>Influence and Impact Grid</h5>${plotSVG(pts, "imp", IMPACT_Q, "Impact")}</div>
            <div class="plot"><h5>Influence and Interest Matrix</h5>${plotSVG(pts, "int", INTEREST_Q, "Interest")}</div>
          </div>
          ${engagementTable(pts)}`;
      }
    };
  },

  raci(task, part) {
    const rel = `${task}/raci`;
    return {
      signature: () => displayRows(get(state, rel), 5).map(r => r.id).join(",") + "#" +
        stakeholders().map(s => s.id + ":" + s.name).join("|"),
      build(el) {
        const people = stakeholders();
        if (!people.length) {
          el.insertAdjacentHTML("beforeend", `<div class="ws-empty">Add stakeholders to the register (part A) to build the RACI matrix.</div>`);
          return;
        }
        const rows = displayRows(get(state, rel), 5);
        const table = document.createElement("table");
        table.innerHTML = `<thead><tr><th>#</th><th>Project stage</th><th style="min-width:180px">Task</th>
          ${people.map(p => `<th title="${esc(p.name)}" style="font-size:.78rem;min-width:70px">${p.n}. ${esc(p.name)}</th>`).join("")}
          <th>Check</th><th></th></tr></thead><tbody></tbody>`;
        const tb = table.tBodies[0];
        rows.forEach((row, i) => {
          const tr = tb.insertRow();
          tr.insertCell().outerHTML = `<td class="num-col">${i + 1}</td>`;
          let td = tr.insertCell();
          td.appendChild(bind(control({ kind: "select", options: STAGES, aria: `Stage, row ${i + 1}` }, row.v.stage),
            `${rel}/${row.id}/stage`, { rowOrder: row.o }));
          td = tr.insertCell();
          td.appendChild(bind(control({ kind: "textarea", aria: `Task, row ${i + 1}` }, row.v.task),
            `${rel}/${row.id}/task`, { rowOrder: row.o }));
          people.forEach(p => {
            const c = tr.insertCell();
            const sel = control({ kind: "select", options: ["R", "A", "C", "I"], className: "score", aria: `${p.name}, row ${i + 1}` },
              row.v["x_" + p.id]);
            c.appendChild(bind(sel, `${rel}/${row.id}/x_${p.id}`, { rowOrder: row.o }));
          });
          const chk = tr.insertCell();
          chk.className = "raci-check";
          chk.dataset.row = row.id;
          chk.style.minWidth = "120px";
          const d = tr.insertCell();
          d.className = "del-col";
          d.appendChild(delButton(async () => {
            if (rowHasContent(row.v) && !confirm("Delete this task row?")) return;
            try { await G.db.remove(`${base()}/${rel}/${row.id}`); } catch (err) { status.error("Unable to delete"); }
          }));
        });
        const wrap = document.createElement("div");
        wrap.className = "ws-scroll";
        wrap.appendChild(table);
        el.appendChild(wrap);
        el.appendChild(addButton("+ Add task", async () => {
          try { await G.db.update(`${base()}/${rel}/${uid()}`, { o: Date.now() }); }
          catch (err) { status.error("Unable to add row"); }
        }));
      },
      refresh(el) {
        const people = stakeholders();
        el.querySelectorAll(".raci-check").forEach(cell => {
          const v = get(state, `${rel}/${cell.dataset.row}`) || {};
          cell.innerHTML = raciCheck(v, people).map(([ok, msg]) =>
            `<span class="${ok ? "ws-ok" : "ws-warn"}">${esc(msg)}</span>`).join("");
        });
      }
    };
  }
};

function raciCheck(v, people) {
  const vals = people.map(p => v["x_" + p.id]).filter(Boolean);
  if (!v.task && !vals.length) return [];
  const a = vals.filter(x => x === "A").length;
  const r = vals.filter(x => x === "R").length;
  const out = [];
  if (a === 1) out.push([true, "One A ✓"]);
  else if (a === 0) out.push([false, "No A assigned"]);
  else out.push([false, `${a} A's – keep one`]);
  out.push(r ? [true, `R: ${r}`] : [false, "No R assigned"]);
  return out;
}

/* ------------------------------------------------------------------ */
/* Matrices                                                            */
/* ------------------------------------------------------------------ */

const IMPACT_Q = { tl: "Important decision makers", tr: "Critical stakeholders", bl: "Peripheral stakeholders", br: "Affected stakeholders" };
const INTEREST_Q = { tl: "Keep satisfied", tr: "Manage closely", bl: "Monitor", br: "Keep informed" };

function assessedPoints(task = "t3") {
  return stakeholders().map(s => {
    const a = get(state, `${task}/assess/${s.id}`) || {};
    return { ...s, inf: +a.inf || null, imp: +a.imp || null, int: +a.int || null,
      cur: a.cur ?? null, des: a.des ?? null, why: a.why || "" };
  });
}

function plotSVG(points, xKey, Q, xLabel) {
  const W = 440, H = 380, L = 54, R = 14, Tp = 14, B = 46;
  const pw = W - L - R, ph = H - Tp - B;
  const sx = v => L + ((v - 0.5) / 5) * pw;
  const sy = v => Tp + ph - ((v - 0.5) / 5) * ph;
  const mx = sx(3), my = sy(3);
  const fill = { tl: "#fff6e5", tr: "#fbeff1", bl: "#f3f5f8", br: "#eaf3ef" };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, Helvetica, sans-serif">`;
  s += `<rect x="${L}" y="${Tp}" width="${mx - L}" height="${my - Tp}" fill="${fill.tl}"/>`;
  s += `<rect x="${mx}" y="${Tp}" width="${L + pw - mx}" height="${my - Tp}" fill="${fill.tr}"/>`;
  s += `<rect x="${L}" y="${my}" width="${mx - L}" height="${Tp + ph - my}" fill="${fill.bl}"/>`;
  s += `<rect x="${mx}" y="${my}" width="${L + pw - mx}" height="${Tp + ph - my}" fill="${fill.br}"/>`;
  s += `<rect x="${L}" y="${Tp}" width="${pw}" height="${ph}" fill="none" stroke="#c9d5e4"/>`;
  s += `<line x1="${mx}" y1="${Tp}" x2="${mx}" y2="${Tp + ph}" stroke="#9fb0c6" stroke-dasharray="4 4"/>`;
  s += `<line x1="${L}" y1="${my}" x2="${L + pw}" y2="${my}" stroke="#9fb0c6" stroke-dasharray="4 4"/>`;
  const ql = (x, y, t, anchor) => `<text x="${x}" y="${y}" font-size="11" font-weight="700" fill="#6b7a90" text-anchor="${anchor}">${esc(t)}</text>`;
  s += ql(L + 6, Tp + 15, Q.tl, "start") + ql(L + pw - 6, Tp + 15, Q.tr, "end");
  s += ql(L + 6, Tp + ph - 7, Q.bl, "start") + ql(L + pw - 6, Tp + ph - 7, Q.br, "end");
  for (let v = 1; v <= 5; v++) {
    s += `<text x="${sx(v)}" y="${Tp + ph + 16}" font-size="11" fill="#667085" text-anchor="middle">${v}</text>`;
    s += `<text x="${L - 8}" y="${sy(v) + 4}" font-size="11" fill="#667085" text-anchor="end">${v}</text>`;
  }
  s += `<text x="${L + pw / 2}" y="${H - 8}" font-size="12" font-weight="700" fill="#12213f" text-anchor="middle">${xLabel} →</text>`;
  s += `<text x="16" y="${Tp + ph / 2}" font-size="12" font-weight="700" fill="#12213f" text-anchor="middle" transform="rotate(-90 16 ${Tp + ph / 2})">Influence →</text>`;

  const placed = points.filter(p => p.inf && p[xKey]);
  const groups = {};
  placed.forEach(p => { (groups[p.inf + ":" + p[xKey]] ||= []).push(p); });
  Object.values(groups).forEach(g => {
    g.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / g.length;
      const r = g.length > 1 ? 13 : 0;
      const cx = sx(p[xKey]) + r * Math.cos(angle), cy = sy(p.inf) + r * Math.sin(angle);
      s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10" fill="#12213f"><title>${esc(p.name)}</title></circle>`;
      s += `<text x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="10.5" font-weight="700" fill="#fff" text-anchor="middle">${p.n}</text>`;
    });
  });
  if (!placed.length) {
    s += `<text x="${L + pw / 2}" y="${Tp + ph / 2}" font-size="12" fill="#667085" text-anchor="middle">Rate influence and ${xLabel.toLowerCase()} in part B</text>`;
  }
  return s + `</svg>`;
}

function level(v) { return v == null ? null : v >= 4 ? "high" : v <= 2 ? "low" : "mid"; }

export function strategy(inf, int) {
  const a = level(inf), b = level(int);
  if (!a || !b) return null;
  if (a === "mid" || b === "mid") return { t: "Borderline – justify", c: "b-mid" };
  if (a === "high" && b === "high") return { t: "Manage closely", c: "b-close" };
  if (a === "high") return { t: "Keep satisfied", c: "b-sat" };
  if (b === "high") return { t: "Keep informed", c: "b-inf" };
  return { t: "Monitor", c: "b-mon" };
}

function supportGap(p, arrow = "→") {
  if (p.cur == null || p.des == null) return "";
  const gap = Number(p.des) - Number(p.cur);
  return `${p.cur} ${arrow} ${p.des}${gap > 0 ? ` (gap ${gap})` : ""}`;
}

function riskFlag(p) {
  return p.inf >= 4 && p.cur != null && Number(p.cur) <= -1;
}

function engagementTable(points) {
  if (!points.length) return "";
  const rows = points.map(p => {
    const st = strategy(p.inf, p.int);
    return `<tr><td class="num-col">${p.n}</td><td>${esc(p.name)}</td>
      <td>${st ? `<span class="badge ${st.c}">${st.t}</span>` : "<span style='color:#98a2b3'>not rated</span>"}</td>
      <td>${esc(supportGap(p))}</td>
      <td>${riskFlag(p) ? `<span class="badge b-close">High influence, low support</span>` : ""}</td></tr>`;
  }).join("");
  return `<h4 style="margin-top:16px">Engagement summary</h4>
    <div class="ws-scroll"><table><thead><tr><th>#</th><th>Stakeholder</th><th>Engagement strategy</th>
    <th>Support: current → desired</th><th>Risk</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ------------------------------------------------------------------ */
/* Workspace lifecycle                                                 */
/* ------------------------------------------------------------------ */

function buildAll() {
  instances.length = 0;
  document.querySelectorAll(".ws[data-task]").forEach(host => {
    host.innerHTML = "";
    const task = host.dataset.task;
    const only = host.dataset.part;
    TASKS[task].parts.filter(p => !only || p.group === only).forEach(part => {
      const box = document.createElement("div");
      box.className = "ws-part";
      if (part.title) box.insertAdjacentHTML("beforeend", `<h4>${esc(part.title)}</h4>`);
      if (part.hint) box.insertAdjacentHTML("beforeend", `<p class="ws-hint">${esc(part.hint)}</p>`);
      const body = document.createElement("div");
      box.appendChild(body);
      host.appendChild(box);
      const r = renderers[part.type](task, part);
      instances.push({ r, body, sig: null });
    });
  });
}

function refreshAll() {
  instances.forEach(inst => {
    const sig = inst.r.signature();
    if (sig !== inst.sig) {
      const active = document.activeElement;
      const focusRel = active && inst.body.contains(active) ? active.dataset.rel : null;
      const sel = focusRel && "selectionStart" in active ? [active.selectionStart, active.selectionEnd] : null;
      inst.body.innerHTML = "";
      inst.r.build(inst.body);
      inst.sig = sig;
      if (focusRel) {
        const el = inst.body.querySelector(`[data-rel="${CSS.escape(focusRel)}"]`);
        if (el) { el.focus(); if (sel) try { el.setSelectionRange(...sel); } catch (e) {} }
      }
    }
    syncValues(inst.body);
    inst.r.refresh && inst.r.refresh(inst.body);
  });
}

function subscribe() {
  if (unsub) unsub();
  state = {};
  instances.forEach(i => { i.sig = null; });
  refreshAll();
  unsub = G.db.sub(base(), val => {
    state = val || {};
    refreshAll();
  }, err => { status.error("Unable to read group data"); console.error(err); });
}

/* ------------------------------------------------------------------ */
/* PDF export                                                          */
/* ------------------------------------------------------------------ */

const NAVY = "#12213f";

function svgToPng(svg, scale = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width * scale; c.height = img.height * scale;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

const txt = v => (v == null || v === "" ? "" : String(v));
const cell = (t, opt = {}) => ({ text: txt(t), ...opt });
const head = labels => labels.map(l => ({ text: l, style: "th" }));
const empty = () => ({ text: "No entries yet.", style: "muted", margin: [0, 2, 0, 6] });

function pdfTable(header, body, widths) {
  return {
    table: { headerRows: 1, widths: widths || header.map(() => "*"), body: [head(header), ...body], dontBreakRows: true },
    layout: {
      hLineColor: () => "#d9e1ec", vLineColor: () => "#d9e1ec",
      fillColor: (r) => (r === 0 ? "#edf3fb" : null),
      paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 4, paddingBottom: () => 4
    },
    margin: [0, 2, 0, 10]
  };
}

async function partToPdf(task, part) {
  const out = [];
  if (part.title) out.push({ text: part.title, style: "h3" });
  const data = get(state, `${task}/${part.key}`);
  switch (part.type) {
    case "fixed": {
      const fields = part.fields || [{}];
      const body = part.rows.map((label, r) => [cell(label, { bold: true, color: "#273b60" }),
        ...fields.map((f, i) => cell(fields.length === 1 ? get(data || {}, `r${r}`) : get(data || {}, `r${r}/f${i}`)))]);
      out.push(pdfTable(part.cols, body, fields.length === 1 ? ["35%", "*"] : ["25%", "18%", "*"]));
      break;
    }
    case "rows": {
      const rows = displayRows(data, 0).filter(r => rowHasContent(r.v));
      if (!rows.length) { out.push(empty()); break; }
      const body = rows.map((r, i) => [cell(i + 1), ...part.cols.map((c, ci) => cell(r.v[`c${ci}`]))]);
      out.push(pdfTable(["#", ...part.cols.map(c => c.label)], body, [16, ...part.cols.map(() => "*")]));
      break;
    }
    case "fields":
      part.fields.forEach(f => {
        out.push({ text: f.label, bold: true, color: "#273b60", margin: [0, 2, 0, 2] });
        out.push(get(data || {}, f.key) ? { text: txt(get(data, f.key)), margin: [0, 0, 0, 8] } : empty());
      });
      break;
    case "checks":
      out.push(pdfTable(["Requirement", "Status"],
        part.items.map((t, i) => [cell(t), cell(get(data || {}, `i${i}`) ? "Confirmed" : "Not yet confirmed",
          { color: get(data || {}, `i${i}`) ? "#2f6f5e" : "#8d4550", bold: true })]), ["*", 90]));
      break;
    case "assess": {
      const stage = get(state, `${task}/stage`);
      out.push({ text: [{ text: "Project stage of this assessment: ", bold: true }, stage || "not specified"], margin: [0, 0, 0, 4] });
      const pts = assessedPoints(task);
      if (!pts.length) { out.push(empty()); break; }
      out.push(pdfTable(["#", "Stakeholder", "Influence", "Impact", "Interest", "Current support", "Desired support", "Rationale"],
        pts.map(p => [cell(p.n), cell(p.name), cell(p.inf), cell(p.imp), cell(p.int),
          cell(p.cur != null ? `${p.cur} ${SUPPORT_LABEL[p.cur] || ""}` : ""),
          cell(p.des != null ? `${p.des} ${SUPPORT_LABEL[p.des] || ""}` : ""), cell(p.why)]),
        [14, "16%", 40, 36, 38, 58, 58, "*"]));
      break;
    }
    case "plots": {
      const pts = assessedPoints(task);
      if (!pts.length) { out.push(empty()); break; }
      const [a, b] = await Promise.all([svgToPng(plotSVG(pts, "imp", IMPACT_Q, "Impact")), svgToPng(plotSVG(pts, "int", INTEREST_Q, "Interest"))]);
      out.push({ columns: [
        { stack: [{ text: "Influence and Impact Grid", bold: true, margin: [0, 0, 0, 3] }, { image: a, width: 245 }] },
        { stack: [{ text: "Influence and Interest Matrix", bold: true, margin: [0, 0, 0, 3] }, { image: b, width: 245 }] }
      ], columnGap: 12, margin: [0, 0, 0, 8], unbreakable: true });
      out.push({ text: "Engagement summary", style: "h3" });
      out.push(pdfTable(["#", "Stakeholder", "Engagement strategy", "Support: current to desired", "Risk"],
        pts.map(p => [cell(p.n), cell(p.name), cell(strategy(p.inf, p.int)?.t || "not rated"), cell(supportGap(p, "to")),
          cell(riskFlag(p) ? "High influence, low support" : "", { color: "#8d4550" })]),
        [14, "*", 100, 110, 100]));
      break;
    }
    case "raci": {
      const people = stakeholders();
      const rows = displayRows(get(state, `${task}/raci`), 0).filter(r => rowHasContent(r.v));
      if (!rows.length) { out.push(empty()); break; }
      const who = (v, letter) => people.filter(p => v["x_" + p.id] === letter).map(p => p.name).join(", ");
      out.push(pdfTable(["Stage", "Task", "Responsible", "Accountable", "Consulted", "Informed", "Check"],
        rows.map(r => [cell(r.v.stage), cell(r.v.task), cell(who(r.v, "R")), cell(who(r.v, "A")), cell(who(r.v, "C")),
          cell(who(r.v, "I")), cell(raciCheck(r.v, people).map(x => x[1].replace(" ✓", "")).join("; "), { fontSize: 7.5 })]),
        [52, "*", 70, 62, 62, 62, 52]));
      break;
    }
  }
  return out;
}

async function exportComponent(comp, btn) {
  if (!window.pdfMake) { alert("PDF library did not load. Please reload the page."); return; }
  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = "Preparing PDF…";
  try {
    const p = G.profile || {};
    const groupLine = `Group ${G.group}${p.name ? " – " + p.name : ""}`;
    const content = [
      { text: "Stakeholder Communication · Comprehensive Needs Analysis", style: "kicker" },
      { text: COMPONENTS[comp], style: "h1" },
      {
        table: { widths: [120, "*"], body: [
          [cell("Group", { bold: true }), cell(groupLine)],
          [cell("Members", { bold: true }), cell(G.memberNames().join(", ") || "not specified")],
          [cell("Client organisation", { bold: true }), cell(p.clientOrg || G.company || "not specified")],
          [cell("Client contact", { bold: true }), cell(p.clientContact || "not specified")],
          [cell("Exported", { bold: true }), cell(formatDate(todayISO()))]
        ] },
        layout: { hLineColor: () => "#d9e1ec", vLineColor: () => "#d9e1ec", fillColor: (r, n, c) => (c === 0 ? "#f5f8fc" : null),
          paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4 },
        margin: [0, 4, 0, 16]
      }
    ];
    for (const [task, def] of Object.entries(TASKS)) {
      if (def.c !== comp) continue;
      content.push({ text: def.title, style: "h2" });
      for (const part of def.parts) content.push(...await partToPdf(task, part));
    }
    const doc = {
      pageSize: "A4",
      pageMargins: [40, 50, 40, 46],
      header: (page) => page === 1 ? null : {
        columns: [{ text: groupLine, alignment: "left" }, { text: COMPONENTS[comp], alignment: "right" }],
        margin: [40, 20, 40, 0], fontSize: 8, color: "#667085"
      },
      footer: (page, pages) => ({ text: `Page ${page} of ${pages}`, alignment: "center", fontSize: 8, color: "#667085", margin: [0, 14, 0, 0] }),
      content,
      defaultStyle: { font: "Roboto", fontSize: 9, lineHeight: 1.2, color: "#1f2937" },
      styles: {
        kicker: { fontSize: 9, color: "#667085", bold: true, margin: [0, 0, 0, 4] },
        h1: { fontSize: 17, bold: true, color: NAVY, margin: [0, 0, 0, 8] },
        h2: { fontSize: 12.5, bold: true, color: NAVY, margin: [0, 10, 0, 6] },
        h3: { fontSize: 10, bold: true, color: "#273b60", margin: [0, 4, 0, 4] },
        th: { bold: true, color: NAVY, fontSize: 8.5 },
        muted: { color: "#98a2b3", italics: true }
      },
      info: { title: `${COMPONENTS[comp]} – ${groupLine}`, author: G.memberNames().join(", ") }
    };
    const file = `CNA_Component_${comp.replace(".", "-")}_Group_${G.group}.pdf`;
    window.__LAST_PDF_DOC__ = doc;
    pdfMake.createPdf(doc).download(file);
  } catch (err) {
    console.error(err);
    alert("The PDF could not be created. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

/* ------------------------------------------------------------------ */
/* Start                                                               */
/* ------------------------------------------------------------------ */

// section nav highlighting
const links = [...document.querySelectorAll("#topnav a")];
const sections = links.map(a => document.querySelector(a.getAttribute("href")));
function updateActive() {
  let index = 0;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= 110) index = i; });
  links.forEach((a, i) => a.classList.toggle("active", i === index));
}
document.addEventListener("scroll", updateActive, { passive: true });
updateActive();

buildAll();
G = await initGroup({ onChange: () => { if (G) subscribe(); } });
subscribe();

document.querySelectorAll("[data-export]").forEach(btn =>
  btn.addEventListener("click", () => exportComponent(btn.dataset.export, btn)));

window.__CNA__ = { TASKS, get state() { return state; } };
