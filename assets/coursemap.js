// Course Map: a team builds an aligned course map for the client.
// Students edit a tree (goal, objectives, assessment tools with rubrics, learning activities);
// the page builds the merged course map table, checks alignment and exports a PDF.
import { initGroup, status, esc } from "./group.js";
import { uid, todayISO, formatDate } from "./db.js";
import { sectionNav, displayRows } from "./workspace.js";

const ROOT = "coursemap";
const NAVY = "#12213f";
const COMPONENTS = [
  { key: "c11", no: "1.1", label: "Needs assessment" },
  { key: "c12", no: "1.2", label: "Needs research" },
  { key: "c13", no: "1.3", label: "Needs limitations" },
  { key: "c14", no: "1.4", label: "Needs analysis" }
];
const INFO = [
  { key: "title", label: "Course title", kind: "input", ph: "e.g. English for International Project Meetings" },
  { key: "client", label: "Client", kind: "input", ph: "Organisation or unit that ordered the course" },
  { key: "clientGoal", label: "Course goal stated by the client", ph: "Write the goal in the client's own words, as agreed at the initial interview" },
  { key: "approach", label: "Teaching approach and mode", ph: "e.g. task-based learning; blended mode (LMS + synchronous online sessions). Explain which needs analysis conclusions support this choice" },
  { key: "scenario", label: "Course scenario", ph: "Duration, number of modules or weeks, sequence of modules, what happens in each type of session" }
];
const MAP_COLS = ["Needs analysis basis", "Course goal", "Learning objective", "Assessment tool", "Weight", "Rubric",
  "Types of materials (assessment)", "Learning activity", "Types of materials (learning)"];

/* ---------------- helpers ---------------- */
const get = (obj, rel) => rel.split("/").reduce((o, k) => (o == null ? undefined : o[k]), obj);
const filled = v => v != null && String(v).trim() !== "";
const hasContent = v => v && typeof v === "object"
  ? Object.entries(v).some(([k, x]) => k !== "o" && hasContent(x))
  : filled(v) && v !== false;
const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const fmtPct = n => (Math.round(n * 10) / 10) + "%";

/* Normalise stored data into ordered lists with codes. withEmpty=false drops blank items (table, PDF). */
function buildModel(data, withEmpty) {
  data = data || {};
  const keep = r => withEmpty || hasContent(r.v);
  const needs = [];
  COMPONENTS.forEach(c => displayRows(get(data, `needs/${c.key}`), withEmpty ? 1 : 0).forEach((r, i) => {
    if (keep(r)) needs.push({ id: `${c.key}_${r.id}`, rid: r.id, comp: c, code: `N${c.no}.${i + 1}`, t: r.v.t || "", v: r.v });
  }));
  const needById = Object.fromEntries(needs.map(n => [n.id, n]));
  const goals = displayRows(get(data, "goals"), withEmpty ? 1 : 0).map((g, gi) => {
    const gc = `${gi + 1}`;
    const objs = displayRows(g.v.obj, withEmpty ? 1 : 0).map((o, oi) => {
      const oc = `${gc}.${oi + 1}`;
      const tools = displayRows(o.v.tools, withEmpty ? 1 : 0).map((t, ti) => ({
        id: t.id, o: t.o, code: `${oc}.${ti + 1}`, t: t.v.t || "", w: t.v.w ?? "", mat: t.v.mat || "", v: t.v,
        crit: displayRows(t.v.crit, withEmpty ? 1 : 0).map(c => ({ id: c.id, o: c.o, c: c.v.c || "", d: c.v.d || "", w: c.v.w ?? "", v: c.v })).filter(keep)
      })).filter(keep);
      const acts = displayRows(o.v.acts, withEmpty ? 1 : 0).map((a, ai) => ({
        id: a.id, o: a.o, code: `${oc}.${ai + 1}`, t: a.v.t || "", mat: a.v.mat || "", v: a.v
      })).filter(keep);
      return { id: o.id, o: o.o, code: oc, t: o.v.t || "", tools, acts, v: o.v };
    }).filter(keep);
    const links = Object.keys(g.v.nb || {}).filter(k => g.v.nb[k] === true);
    return { id: g.id, o: g.o, code: gc, t: g.v.t || "", objs, v: g.v,
      needs: needs.filter(n => links.includes(n.id)), links };
  }).filter(keep);
  return { info: data.info || {}, needs, needById, goals };
}

/* Merged grid of the course map: rows of cells, null = covered by a rowSpan above. */
function mapGrid(model) {
  const rows = [];
  const cell = (text, span, cls = "", extra = {}) => ({ text, span, cls, ...extra });
  model.goals.forEach(g => {
    const objRows = g.objs.map(o => Math.max(o.tools.length, o.acts.length, 1));
    const gSpan = objRows.reduce((a, b) => a + b, 0) || 1;
    const start = rows.length;
    for (let k = 0; k < gSpan; k++) rows.push(new Array(MAP_COLS.length).fill(null));
    rows[start][0] = cell(g.needs.map(n => `${n.code} ${n.t}`).join("\n"), gSpan, "c-basis", { needs: g.needs });
    rows[start][1] = cell(g.t, gSpan, "c-goal", { code: `Goal ${g.code}` });
    if (!g.objs.length) {
      for (let c = 2; c < MAP_COLS.length; c++) rows[start][c] = cell("", 1, "c-empty");
      return;
    }
    let r = start;
    g.objs.forEach((o, oi) => {
      const span = objRows[oi];
      rows[r][2] = cell(o.t, span, "c-obj", { code: `Objective ${o.code}` });
      const place = (items, cols, make) => {
        if (!items.length) { cols.forEach(c => { rows[r][c] = cell("", span, "c-empty"); }); return; }
        items.forEach((it, i) => {
          const s = i === items.length - 1 ? span - i : 1;
          make(it).forEach((x, j) => { rows[r + i][cols[j]] = { ...x, span: s }; });
        });
      };
      place(o.tools, [3, 4, 5, 6], t => [
        cell(t.t, 1, "c-tool", { code: `Assessment ${t.code}` }),
        cell(filled(t.w) ? `${num(t.w) ?? t.w}%` : "", 1, "c-w"),
        cell(t.crit.map(c => `${c.c}${filled(c.w) ? ` (${num(c.w) ?? c.w}%)` : ""}${c.d ? ". " + c.d : ""}`).join("\n"), 1, "c-rub", { crit: t.crit }),
        cell(t.mat, 1, "c-mat")]);
      place(o.acts, [7, 8], a => [cell(a.t, 1, "c-act", { code: `Activity ${a.code}` }), cell(a.mat, 1, "c-mat")]);
      r += span;
    });
  });
  return rows;
}

function mapTableHTML(model, { empty = "Your course map will appear here as you fill in the goals." } = {}) {
  const grid = mapGrid(model);
  if (!grid.length) return `<div class="ws-empty">${esc(empty)}</div>`;
  const body = grid.map(row => `<tr>${row.map(c => {
    if (!c) return "";
    let inner;
    if (c.needs) inner = c.needs.length ? c.needs.map(n => `<div class="nb"><b>${esc(n.code)}</b> ${esc(n.t)}</div>`).join("") : `<span class="missing">No link to needs analysis</span>`;
    else if (c.crit) inner = c.crit.length ? `<ul class="rub">${c.crit.map(x => `<li><b>${esc(x.c)}</b>${filled(x.w) ? ` <span class="w">${esc(num(x.w) ?? x.w)}%</span>` : ""}${x.d ? `<br>${esc(x.d)}` : ""}</li>`).join("")}</ul>` : "";
    else inner = (c.code ? `<span class="code">${esc(c.code)}</span>` : "") + esc(c.text).replace(/\n/g, "<br>");
    return `<td class="${c.cls}"${c.span > 1 ? ` rowspan="${c.span}"` : ""}>${inner}</td>`;
  }).join("")}</tr>`).join("");
  return `<div class="ws-scroll"><table class="map-table"><thead><tr>${MAP_COLS.map((h, i) =>
    `<th class="${i === 6 || i === 8 ? "h-mat" : ""}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/* Alignment check: [ok, message] */
function checks(model) {
  const out = [];
  const info = model.info;
  if (!filled(info.title)) out.push([false, "The course title is missing."]);
  if (!filled(info.clientGoal)) out.push([false, "The course goal stated by the client is missing."]);
  if (!model.needs.length) out.push([false, "No needs analysis conclusions yet."]);
  if (!model.goals.length) { out.push([false, "No course goals yet."]); return out; }
  const used = new Set(model.goals.flatMap(g => g.links));
  const unused = model.needs.filter(n => !used.has(n.id));
  if (model.needs.length) out.push(unused.length
    ? [false, `Not used by any goal: ${unused.map(n => n.code).join(", ")}. Link them to a goal or remove them.`]
    : [true, "Every needs analysis conclusion is used by at least one goal."]);
  let total = 0, tools = 0;
  model.goals.forEach(g => {
    if (!g.links.length) out.push([false, `Goal ${g.code} is not linked to any needs analysis conclusion.`]);
    if (!g.objs.length) out.push([false, `Goal ${g.code} has no learning objectives.`]);
    g.objs.forEach(o => {
      if (!o.tools.length) out.push([false, `Objective ${o.code} has no assessment tool.`]);
      if (!o.acts.length) out.push([false, `Objective ${o.code} has no learning activity.`]);
      o.tools.forEach(t => {
        tools++;
        const w = num(t.w);
        if (w == null) out.push([false, `Assessment ${t.code} has no weight.`]); else total += w;
        if (!t.crit.length) out.push([false, `Assessment ${t.code} has no rubric criteria.`]);
        else {
          const cw = t.crit.map(c => num(c.w));
          if (cw.some(x => x == null)) out.push([false, `Assessment ${t.code}: give every rubric criterion a weight.`]);
          else if (Math.abs(cw.reduce((a, b) => a + b, 0) - 100) > 0.01) out.push([false, `Assessment ${t.code}: rubric weights add up to ${fmtPct(cw.reduce((a, b) => a + b, 0))}, not 100%.`]);
        }
        if (!filled(t.mat)) out.push([false, `Assessment ${t.code} has no types of materials.`]);
      });
      o.acts.forEach(a => { if (!filled(a.mat)) out.push([false, `Activity ${a.code} has no types of materials.`]); });
    });
  });
  if (tools) out.push(Math.abs(total - 100) < 0.01
    ? [true, "Assessment plan weights add up to 100%."]
    : [false, `Assessment plan weights add up to ${fmtPct(total)}, not 100%.`]);
  return out;
}

/* ---------------- worked example (read only) ---------------- */
const EX = {
  info: {
    title: "English for International Project Meetings",
    client: "International Projects Department of a regional engineering company",
    clientGoal: "Our engineers must take part in online project meetings with foreign partners without an interpreter.",
    approach: "Task-based language teaching (N1.2.1, N1.4.1). Blended mode: asynchronous work in the LMS and weekly synchronous online sessions, because engineers work on different sites (N1.1.1).",
    scenario: "12 weeks, 4 modules: meeting structure, clarifying and checking, discussing options, summarising decisions. Each module ends with a simulated meeting."
  },
  needs: {
    c11: { a: { o: 1, t: "The client expects engineers to join weekly online meetings with partners within six months; engineers work on different sites." } },
    c12: { b: { o: 1, t: "Research on engineers' professional English shows that listening to accented speech is the main difficulty in meetings." } },
    c13: { c: { o: 1, t: "Company rules do not allow real project documents outside the corporate platform." } },
    c14: { d: { o: 1, t: "Survey (34 engineers): most rate their spoken interaction at A2–B1; 80% name asking for clarification as their main problem." } }
  },
  goals: {
    g1: { o: 1, t: "SS will understand the structure and conventions of an international online project meeting.", nb: { c11_a: true, c13_c: true }, obj: {
      o1: { o: 1, t: "SS will be able to follow the agenda and identify decisions and action points in a recorded meeting (B1).",
        tools: { t1: { o: 1, t: "Listening test on a recorded meeting, 10 items", w: 20, mat: "Recording of a simulated meeting with non-native speakers; test items in the LMS",
          crit: { k1: { o: 1, c: "Correct answers", d: "One point per item, automatic scoring", w: 100 } } } },
        acts: { a1: { o: 1, t: "Listening to meeting extracts and completing an action point log", mat: "Meeting recordings with accented speech; action point log template" },
                a2: { o: 2, t: "Comparing model minutes with the recording", mat: "Model minutes; gap fill worksheet" } } },
      o2: { o: 2, t: "SS will be able to write minutes of a short project meeting using the company template.",
        tools: { t1: { o: 1, t: "Meeting minutes writing task", w: 20, mat: "Task sheet; anonymised company minutes template",
          crit: { k1: { o: 1, c: "Content accuracy", d: "All decisions and action points recorded correctly", w: 40 },
                  k2: { o: 2, c: "Structure", d: "Template sections used as required", w: 30 },
                  k3: { o: 3, c: "Language", d: "Clear, accurate, concise sentences", w: 30 } } } },
        acts: { a1: { o: 1, t: "Analysis of model minutes and guided writing", mat: "Anonymised minutes samples (N1.3.1); writing frame" } } } } },
    g2: { o: 2, t: "SS will know strategies for interaction in meetings: clarifying, agreeing, disagreeing, summarising.", nb: { c12_b: true, c14_d: true }, obj: {
      o1: { o: 1, t: "SS will be able to ask for and give clarification in a simulated online meeting.",
        tools: { t1: { o: 1, t: "Simulated meeting role play, recorded", w: 40, mat: "Role cards; meeting scenario; recording instructions",
          crit: { k1: { o: 1, c: "Interaction strategies", d: "Asks for and gives clarification when needed", w: 40 },
                  k2: { o: 2, c: "Fluency", d: "Keeps the conversation going without long pauses", w: 20 },
                  k3: { o: 3, c: "Accuracy", d: "Errors do not block understanding", w: 20 },
                  k4: { o: 4, c: "Task completion", d: "Meeting goal reached", w: 20 } } } },
        acts: { a1: { o: 1, t: "Functional language practice with video models", mat: "Video models; interactive phrase exercises" },
                a2: { o: 2, t: "Pair role plays with peer feedback", mat: "Role cards; peer feedback checklist" } } },
      o2: { o: 2, t: "SS will be able to summarise agreed decisions at the end of a meeting.",
        tools: { t1: { o: 1, t: "Oral summary, 2 minutes, recorded", w: 20, mat: "Summary prompt; recording tool in the LMS",
          crit: { k1: { o: 1, c: "Completeness", d: "All decisions mentioned", w: 50 },
                  k2: { o: 2, c: "Clarity", d: "Logical order, signposting", w: 30 },
                  k3: { o: 3, c: "Language", d: "Accurate summarising phrases", w: 20 } } } },
        acts: { a1: { o: 1, t: "Summarising practice after listening tasks", mat: "Short meeting recordings; summary checklist" } } } } }
  }
};

function renderExample() {
  const host = document.getElementById("exampleMap");
  if (!host) return;
  const m = buildModel(EX, false);
  host.innerHTML = `
    <div class="map-info">
      ${INFO.map(f => `<div><span class="field-label">${esc(f.label)}</span>${esc(m.info[f.key])}</div>`).join("")}
    </div>
    <h4>Needs analysis conclusions</h4>
    ${needsTableHTML(m)}
    <h4>Course map</h4>
    ${mapTableHTML(m)}`;
}

function needsTableHTML(m) {
  if (!m.needs.length) return `<div class="ws-empty">No conclusions yet.</div>`;
  return `<div class="ws-scroll"><table class="needs-table"><thead><tr><th>Component</th><th>Code</th><th>Conclusion</th></tr></thead><tbody>${
    m.needs.map(n => `<tr><td>${esc(n.comp.no)} ${esc(n.comp.label)}</td><td class="code-col">${esc(n.code)}</td><td>${esc(n.t)}</td></tr>`).join("")}</tbody></table></div>`;
}

/* ---------------- editor ---------------- */
sectionNav();
renderExample();

let G = null, state = {}, unsub = null, sig = null;
const base = () => `${ROOT}/g${G.group}`;
const editor = document.getElementById("cmEditor");

function bind(el, rel, order) {
  // order: [[relOfItem, o], ...] – every list item on the path keeps its sort order
  el.dataset.rel = rel;
  const instant = el.tagName === "SELECT" || el.type === "checkbox";
  let timer;
  el.addEventListener(instant ? "change" : "input", () => {
    if (G.readOnly) return;
    el.dataset.dirty = "1";
    status.saving();
    clearTimeout(timer);
    timer = setTimeout(async () => {
      let value = el.type === "checkbox" ? el.checked : el.value;
      if (value === "" || value === false) value = null;
      try {
        const upd = { [rel]: value };
        (order || []).forEach(([p, o]) => { if (get(state, `${p}/o`) == null) upd[`${p}/o`] = o; });
        await G.db.update(base(), upd);
        status.saved();
      } catch (err) { status.error("Unable to save"); console.error(err); }
      delete el.dataset.dirty;
    }, instant ? 0 : 450);
  });
  return el;
}

function field(label, rel, order, { kind = "textarea", ph = "", cls = "" } = {}) {
  const box = document.createElement("label");
  box.className = "cm-field " + cls;
  box.innerHTML = `<span class="field-label">${esc(label)}</span>`;
  let el;
  if (kind === "input") { el = document.createElement("input"); el.type = "text"; }
  else if (kind === "num") { el = document.createElement("input"); el.type = "text"; el.inputMode = "decimal"; el.className = "cm-num"; }
  else { el = document.createElement("textarea"); el.rows = 2; }
  el.placeholder = ph;
  el.value = get(state, rel) ?? "";
  box.appendChild(bind(el, rel, order));
  return box;
}

const button = (cls, label, fn, title) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = cls; b.textContent = label;
  if (title) { b.title = title; b.setAttribute("aria-label", title); }
  b.addEventListener("click", fn);
  return b;
};
async function addItem(listRel, order) {
  try {
    const upd = { [`${listRel}/${uid()}/o`]: Date.now() };
    (order || []).forEach(([p, o]) => { if (get(state, `${p}/o`) == null) upd[`${p}/o`] = o; });
    await G.db.update(base(), upd);
  } catch (err) { status.error("Unable to add"); console.error(err); }
}
async function removeItem(rel, v, what) {
  if (hasContent(v) && !confirm(`Delete this ${what} and everything inside it?`)) return;
  try { await G.db.remove(`${base()}/${rel}`); status.saved(); }
  catch (err) { status.error("Unable to delete"); console.error(err); }
}
const el = (tag, cls, html = "") => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };

function signature(m) {
  return JSON.stringify([m.needs.map(n => n.id), m.goals.map(g => [g.id, g.objs.map(o => [o.id,
    o.tools.map(t => [t.id, t.crit.map(c => c.id)]), o.acts.map(a => a.id)])])]);
}

function buildEditor(m) {
  editor.innerHTML = "";

  /* 1. course information */
  const info = el("section", "cm-block");
  info.innerHTML = `<h3>Step 1 · Course information</h3>`;
  const grid = el("div", "cm-info-grid");
  INFO.forEach(f => grid.appendChild(field(f.label, `info/${f.key}`, null, { kind: f.kind || "textarea", ph: f.ph, cls: f.kind === "input" ? "" : "wide" })));
  info.appendChild(grid);
  editor.appendChild(info);

  /* 2. needs analysis conclusions */
  const needs = el("section", "cm-block");
  needs.innerHTML = `<h3>Step 2 · Needs analysis conclusions</h3>
    <p class="ws-hint">Copy the main conclusions from your Comprehensive Needs Analysis that influence the course design. One conclusion per line. Each gets a code that you will use to link goals to the needs analysis.</p>`;
  COMPONENTS.forEach(c => {
    const box = el("div", "cm-comp");
    box.innerHTML = `<div class="cm-comp-head">Component ${c.no} · ${c.label}</div>`;
    m.needs.filter(n => n.comp.key === c.key).forEach(n => {
      const rel = `needs/${c.key}/${n.rid}`;
      const row = el("div", "cm-need");
      row.appendChild(el("span", "cm-code", esc(n.code)));
      const ta = document.createElement("textarea"); ta.rows = 2; ta.value = n.t;
      ta.placeholder = "Conclusion that influences the course design";
      ta.setAttribute("aria-label", n.code);
      row.appendChild(bind(ta, `${rel}/t`, [[rel, n.o]]));
      row.appendChild(button("row-del", "×", () => removeItem(rel, n.v, "conclusion"), "Delete conclusion"));
      box.appendChild(row);
    });
    box.appendChild(button("ws-btn", "+ Add conclusion", () => addItem(`needs/${c.key}`)));
    needs.appendChild(box);
  });
  editor.appendChild(needs);

  /* 3. goals tree */
  const goals = el("section", "cm-block");
  goals.innerHTML = `<h3>Step 3 · Course goals, objectives, assessment and learning activities</h3>
    <p class="ws-hint">Each course goal is broken down into learning objectives. Each objective gets its assessment tools (with weight, rubric and materials) and its learning activities (with materials).</p>`;
  m.goals.forEach(g => {
    const gRel = `goals/${g.id}`, gOrd = [[gRel, g.o]];
    const gBox = el("div", "cm-goal");
    const head = el("div", "cm-head");
    head.appendChild(el("span", "cm-tag goal", `Goal ${esc(g.code)}`));
    head.appendChild(button("row-del", "×", () => removeItem(gRel, g.v, "goal"), `Delete goal ${g.code}`));
    gBox.appendChild(head);
    gBox.appendChild(field("Course goal", `${gRel}/t`, gOrd, { ph: "SS will understand / know …" }));

    const nb = el("div", "cm-links");
    nb.innerHTML = `<span class="field-label">Needs analysis basis · tick the conclusions this goal responds to</span>`;
    const chips = el("div", "cm-chips");
    if (!m.needs.length) chips.innerHTML = `<span class="muted">Add needs analysis conclusions in Step 2 first.</span>`;
    m.needs.forEach(n => {
      const lab = el("label", "cm-chip");
      lab.dataset.need = n.id;
      const cb = document.createElement("input"); cb.type = "checkbox";
      cb.checked = get(state, `${gRel}/nb/${n.id}`) === true;
      lab.appendChild(bind(cb, `${gRel}/nb/${n.id}`, gOrd));
      lab.appendChild(el("span", "", `<b>${esc(n.code)}</b> <span class="cm-chip-text"></span>`));
      chips.appendChild(lab);
    });
    nb.appendChild(chips);
    gBox.appendChild(nb);

    g.objs.forEach(o => {
      const oRel = `${gRel}/obj/${o.id}`, oOrd = [...gOrd, [oRel, o.o]];
      const oBox = el("div", "cm-obj");
      const oh = el("div", "cm-head");
      oh.appendChild(el("span", "cm-tag obj", `Objective ${esc(o.code)}`));
      oh.appendChild(button("row-del", "×", () => removeItem(oRel, o.v, "objective"), `Delete objective ${o.code}`));
      oBox.appendChild(oh);
      oBox.appendChild(field("Learning objective", `${oRel}/t`, oOrd, { ph: "SS will be able to … (observable action, conditions, level)" }));

      const cols = el("div", "cm-cols");
      /* assessment tools */
      const aCol = el("div", "cm-col assess");
      aCol.innerHTML = `<div class="cm-col-head">Assessment</div>`;
      o.tools.forEach(t => {
        const tRel = `${oRel}/tools/${t.id}`, tOrd = [...oOrd, [tRel, t.o]];
        const tBox = el("div", "cm-item");
        const th = el("div", "cm-head");
        th.appendChild(el("span", "cm-tag tool", `Assessment ${esc(t.code)}`));
        th.appendChild(button("row-del", "×", () => removeItem(tRel, t.v, "assessment tool"), `Delete assessment ${t.code}`));
        tBox.appendChild(th);
        const r1 = el("div", "cm-row2");
        r1.appendChild(field("Assessment tool", `${tRel}/t`, tOrd, { ph: "e.g. recorded role play, essay, test" }));
        r1.appendChild(field("Weight, %", `${tRel}/w`, tOrd, { kind: "num", ph: "%" }));
        tBox.appendChild(r1);

        const rub = el("div", "cm-rubric");
        rub.innerHTML = `<span class="field-label">Rubric · criteria, descriptors and weight</span>`;
        const tbl = el("table", "cm-rub-table", `<thead><tr><th>Criterion</th><th>Descriptor</th><th>Weight, %</th><th></th></tr></thead><tbody></tbody>`);
        t.crit.forEach(c => {
          const cRel = `${tRel}/crit/${c.id}`, cOrd = [...tOrd, [cRel, c.o]];
          const tr = tbl.tBodies[0].insertRow();
          const mk = (k, kind, ph) => {
            const e = kind === "ta" ? document.createElement("textarea") : document.createElement("input");
            if (kind !== "ta") { e.type = "text"; if (kind === "num") { e.inputMode = "decimal"; e.className = "cm-num"; } }
            else e.rows = 2;
            e.placeholder = ph; e.value = c.v[k] ?? "";
            return bind(e, `${cRel}/${k}`, cOrd);
          };
          tr.insertCell().appendChild(mk("c", "ta", "Criterion"));
          tr.insertCell().appendChild(mk("d", "ta", "What a good performance looks like"));
          tr.insertCell().appendChild(mk("w", "num", "%"));
          const d = tr.insertCell(); d.className = "del-col";
          d.appendChild(button("row-del", "×", () => removeItem(cRel, c.v, "criterion"), "Delete criterion"));
        });
        const sc = el("div", "ws-scroll"); sc.appendChild(tbl); rub.appendChild(sc);
        rub.appendChild(el("div", "cm-sum", "")).dataset.sum = tRel;
        rub.appendChild(button("ws-btn small", "+ Add criterion", () => addItem(`${tRel}/crit`, tOrd)));
        tBox.appendChild(rub);
        tBox.appendChild(field("Types of materials for this assessment", `${tRel}/mat`, tOrd, { ph: "Materials you will design for the assessment, and the needs analysis conclusion they respond to" }));
        aCol.appendChild(tBox);
      });
      aCol.appendChild(button("ws-btn", "+ Add assessment tool", () => addItem(`${oRel}/tools`, oOrd)));

      /* learning activities */
      const lCol = el("div", "cm-col learn");
      lCol.innerHTML = `<div class="cm-col-head">Learning activities</div>`;
      o.acts.forEach(a => {
        const aRel = `${oRel}/acts/${a.id}`, aOrd = [...oOrd, [aRel, a.o]];
        const aBox = el("div", "cm-item");
        const ah = el("div", "cm-head");
        ah.appendChild(el("span", "cm-tag act", `Activity ${esc(a.code)}`));
        ah.appendChild(button("row-del", "×", () => removeItem(aRel, a.v, "learning activity"), `Delete activity ${a.code}`));
        aBox.appendChild(ah);
        aBox.appendChild(field("Learning activity", `${aRel}/t`, aOrd, { ph: "Activity that prepares learners for the assessment" }));
        aBox.appendChild(field("Types of materials for this activity", `${aRel}/mat`, aOrd, { ph: "Texts, recordings, worksheets, interactive exercises … and the needs they respond to" }));
        lCol.appendChild(aBox);
      });
      lCol.appendChild(button("ws-btn", "+ Add learning activity", () => addItem(`${oRel}/acts`, oOrd)));

      cols.appendChild(aCol); cols.appendChild(lCol);
      oBox.appendChild(cols);
      gBox.appendChild(oBox);
    });
    gBox.appendChild(button("ws-btn", `+ Add objective to goal ${g.code}`, () => addItem(`${gRel}/obj`, gOrd)));
    goals.appendChild(gBox);
  });
  goals.appendChild(button("ws-btn primary", "+ Add course goal", () => addItem("goals")));
  editor.appendChild(goals);

  if (G.readOnly) editor.querySelectorAll("input,textarea,select").forEach(e => { e.disabled = true; });
}

function syncValues() {
  editor.querySelectorAll("[data-rel]").forEach(e => {
    if (document.activeElement === e || e.dataset.dirty) return;
    const v = get(state, e.dataset.rel);
    if (e.type === "checkbox") e.checked = v === true;
    else if (e.value !== String(v ?? "")) e.value = v ?? "";
  });
}

function refresh() {
  const m = buildModel(state, true);
  const s = signature(m);
  if (s !== sig) {
    const active = document.activeElement;
    const focusRel = active && editor.contains(active) ? active.dataset.rel : null;
    const sel = focusRel && "selectionStart" in active ? [active.selectionStart, active.selectionEnd] : null;
    const y = window.scrollY;
    buildEditor(m);
    sig = s;
    window.scrollTo(0, y);
    if (focusRel) {
      const e = editor.querySelector(`[data-rel="${CSS.escape(focusRel)}"]`);
      if (e) { e.focus({ preventScroll: true }); if (sel) try { e.setSelectionRange(...sel); } catch (x) {} }
    }
  }
  syncValues();
  // live labels and sums
  const byId = Object.fromEntries(m.needs.map(n => [n.id, n]));
  editor.querySelectorAll(".cm-chip[data-need]").forEach(l => {
    const n = byId[l.dataset.need]; if (!n) return;
    const t = n.t.length > 70 ? n.t.slice(0, 70) + "…" : n.t;
    l.querySelector(".cm-chip-text").textContent = t || "(empty)";
    l.title = n.t;
  });
  editor.querySelectorAll(".cm-sum[data-sum]").forEach(box => {
    const crit = Object.values(get(state, `${box.dataset.sum}/crit`) || {}).filter(c => c && typeof c === "object");
    const ws = crit.map(c => num(c.w)).filter(x => x != null);
    if (!ws.length) { box.textContent = ""; return; }
    const sum = ws.reduce((a, b) => a + b, 0);
    box.className = "cm-sum " + (Math.abs(sum - 100) < 0.01 ? "ok" : "warn");
    box.textContent = `Rubric total ${fmtPct(sum)}${Math.abs(sum - 100) < 0.01 ? "" : " · should be 100%"}`;
  });
  const total = m.goals.flatMap(g => g.objs.flatMap(o => o.tools)).map(t => num(t.w)).filter(x => x != null).reduce((a, b) => a + b, 0);
  const tot = document.getElementById("weightTotal");
  if (tot) {
    tot.className = "cm-total " + (Math.abs(total - 100) < 0.01 ? "ok" : "warn");
    tot.textContent = `Assessment plan total ${fmtPct(total)}`;
  }

  const clean = buildModel(state, false);
  document.getElementById("cmMap").innerHTML = mapTableHTML(clean);
  document.getElementById("cmCheck").innerHTML = checks(clean).map(([ok, msg]) =>
    `<li class="${ok ? "ok" : "warn"}">${esc(msg)}</li>`).join("");
}

function subscribe() {
  if (unsub) unsub();
  state = {}; sig = null;
  refresh();
  unsub = G.db.sub(base(), val => { state = val || {}; refresh(); },
    err => { status.error("Unable to read group data"); console.error(err); });
}

/* ---------------- PDF ---------------- */
const txt = v => (v == null || v === "" ? "" : String(v));
const pdfLayout = { hLineColor: () => "#c9d5e4", vLineColor: () => "#c9d5e4",
  paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3 };

function pdfMap(model) {
  const grid = mapGrid(model);
  const head = MAP_COLS.map((h, i) => ({ text: h, style: "th", fillColor: i === 6 || i === 8 ? "#dcefe9" : "#edf3fb" }));
  const body = grid.map(row => row.map(c => {
    if (!c) return {};
    let stack;
    if (c.needs) stack = c.needs.length ? c.needs.map(n => ({ text: [{ text: n.code + " ", bold: true }, n.t], margin: [0, 0, 0, 2] }))
      : [{ text: "No link to needs analysis", color: "#8d4550", italics: true }];
    else if (c.crit) stack = c.crit.map(x => ({ text: [{ text: x.c, bold: true }, filled(x.w) ? ` ${num(x.w) ?? x.w}%` : "", x.d ? `\n${x.d}` : ""], margin: [0, 0, 0, 2] }));
    else stack = [...(c.code ? [{ text: c.code, bold: true, color: "#3f6fb0", fontSize: 6.5 }] : []), { text: txt(c.text) }];
    const out = { stack };
    if (c.span > 1) out.rowSpan = c.span;
    if (c.cls === "c-goal") out.fillColor = "#f5f8fc";
    return out;
  }));
  return { table: { headerRows: 1, widths: [78, 78, 86, 76, 30, "*", 72, 82, 72], body: [head, ...body] },
    layout: pdfLayout, fontSize: 7.2, margin: [0, 2, 0, 10] };
}

async function exportPdf(btn) {
  if (!window.pdfMake) { alert("PDF library did not load. Please reload the page."); return; }
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = "Preparing PDF…";
  try {
    const m = buildModel(state, false);
    const p = G.profile || {};
    const groupLine = `Group ${G.group}${p.name ? " – " + p.name : ""}`;
    const kv = (k, v) => [{ text: k, bold: true }, { text: txt(v) || "not specified", color: v ? "#1f2937" : "#98a2b3" }];
    const content = [
      { text: "Stakeholder Communication · Course Map", style: "kicker" },
      { text: m.info.title || "Course map", style: "h1" },
      { table: { widths: [150, "*"], body: [
          kv("Group", groupLine), kv("Members", G.memberNames().join(", ")),
          kv("Client", m.info.client || p.clientOrg || G.company), kv("Course goal stated by the client", m.info.clientGoal),
          kv("Teaching approach and mode", m.info.approach), kv("Course scenario", m.info.scenario),
          kv("Exported", formatDate(todayISO()))] },
        layout: { ...pdfLayout, fillColor: (r, n, c) => (c === 0 ? "#f5f8fc" : null) }, margin: [0, 2, 0, 12] },
      { text: "Needs analysis conclusions", style: "h2" },
      m.needs.length
        ? { table: { headerRows: 1, widths: [110, 50, "*"], body: [["Component", "Code", "Conclusion"].map(t => ({ text: t, style: "th", fillColor: "#edf3fb" })),
            ...m.needs.map(n => [`${n.comp.no} ${n.comp.label}`, { text: n.code, bold: true }, txt(n.t)])] }, layout: pdfLayout, margin: [0, 2, 0, 12] }
        : { text: "No entries yet.", style: "muted" },
      { text: "Course map", style: "h2", pageBreak: "before" },
      m.goals.length ? pdfMap(m) : { text: "No entries yet.", style: "muted" },
      { text: "Alignment check", style: "h2" },
      { ul: checks(m).map(([ok, msg]) => ({ text: msg, color: ok ? "#2f6f5e" : "#8d4550" })) }
    ];
    const doc = {
      pageSize: "A4", pageOrientation: "landscape", pageMargins: [30, 40, 30, 36],
      header: page => page === 1 ? null : { columns: [{ text: groupLine }, { text: m.info.title || "Course map", alignment: "right" }], margin: [30, 16, 30, 0], fontSize: 8, color: "#667085" },
      footer: (page, pages) => ({ text: `Page ${page} of ${pages}`, alignment: "center", fontSize: 8, color: "#667085", margin: [0, 12, 0, 0] }),
      content,
      defaultStyle: { font: "Roboto", fontSize: 8.5, lineHeight: 1.15, color: "#1f2937" },
      styles: {
        kicker: { fontSize: 9, color: "#667085", bold: true, margin: [0, 0, 0, 4] },
        h1: { fontSize: 17, bold: true, color: NAVY, margin: [0, 0, 0, 8] },
        h2: { fontSize: 12.5, bold: true, color: NAVY, margin: [0, 6, 0, 6] },
        th: { bold: true, color: NAVY, fontSize: 7.5 },
        muted: { color: "#98a2b3", italics: true }
      },
      info: { title: `Course Map – ${groupLine}`, author: G.memberNames().join(", ") }
    };
    window.__LAST_PDF_DOC__ = doc;
    pdfMake.createPdf(doc).download(`Course_Map_Group_${G.group}.pdf`);
  } catch (err) {
    console.error(err);
    alert("The PDF could not be created. Please try again.");
  } finally {
    btn.disabled = false; btn.textContent = old;
  }
}

G = await initGroup({ share: "coursemap", onChange: () => G && subscribe() });
subscribe();
document.querySelectorAll("[data-export]").forEach(b => b.addEventListener("click", () => exportPdf(b)));
