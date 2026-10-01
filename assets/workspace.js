// Reusable team workspace engine: renders answer fields from a task schema,
// syncs them live with Firebase, draws stakeholder matrices and exports PDFs.
//
// A page provides:
//   root        – database branch for the page, e.g. "cna" or "stakeholder"
//   title       – PDF kicker, e.g. "Comprehensive Needs Analysis"
//   components  – { key: "Heading used in PDF" }  (export buttons use data-export="key" or "all")
//   tasks       – { taskId: { c: componentKey, title, parts: [...] } }
//
// Part types: fixed, rows, fields, checks, assess, plots, raci (see README in SETUP.md).
import { status, esc } from "./group.js";
import { uid, todayISO, formatDate } from "./db.js";

export const STAGES = ["Needs analysis", "Design", "Development", "Pilot", "Launch", "Evaluation"];
export const ROLES = ["Decision maker", "User", "Implementer", "Expert or regulator", "Partner"];
const SCORE = ["1", "2", "3", "4", "5"];
const SUPPORT = ["-2", "-1", "0", "+1", "+2"];
const SUPPORT_LABEL = { "-2": "Actively opposed", "-1": "Resistant", "0": "Neutral", "+1": "Supportive", "+2": "Champion" };
const DIM = {
  inf: { label: "Influence", opts: SCORE },
  imp: { label: "Impact", opts: SCORE },
  int: { label: "Interest", opts: SCORE },
  cur: { label: "Current support", opts: SUPPORT },
  des: { label: "Desired support", opts: SUPPORT }
};
const IMPACT_Q = { tl: "Important decision makers", tr: "Critical stakeholders", bl: "Peripheral stakeholders", br: "Affected stakeholders" };
const INTEREST_Q = { tl: "Keep satisfied", tr: "Manage closely", bl: "Monitor", br: "Keep informed" };
const CHARTS = {
  impact: { title: "Influence and Impact Grid", x: "imp", q: IMPACT_Q, label: "Impact" },
  interest: { title: "Influence and Interest Matrix", x: "int", q: INTEREST_Q, label: "Interest" }
};

export const T = (label, extra = {}) => ({ label, kind: "textarea", ...extra });
export const S = (label, options, extra = {}) => ({ label, kind: "select", options, ...extra });
export const I = (label, extra = {}) => ({ label, kind: "input", ...extra });

const get = (obj, rel) => rel.split("/").reduce((o, k) => (o == null ? undefined : o[k]), obj);
const NAVY = "#12213f";

export function displayRows(stored, min) {
  const rows = Object.entries(stored || {})
    .filter(([, v]) => v && typeof v === "object")
    .map(([id, v]) => ({ id, o: v.o ?? 0, v }));
  for (let k = 0; k < min; k++) {
    const id = "p" + k;
    if (!rows.some(r => r.id === id)) rows.push({ id, o: k, v: {} });
  }
  return rows.sort((a, b) => a.o - b.o || a.id.localeCompare(b.id));
}
const rowHasContent = v => Object.keys(v || {}).some(k => k !== "o" && v[k] !== "" && v[k] != null);

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
const riskFlag = p => p.inf >= 4 && p.cur != null && Number(p.cur) <= -1;

export function plotSVG(points, chart) {
  const { x: xKey, q: Q, label: xLabel } = CHARTS[chart];
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
  const ql = (x, y, t, a) => `<text x="${x}" y="${y}" font-size="11" font-weight="700" fill="#6b7a90" text-anchor="${a}">${esc(t)}</text>`;
  s += ql(L + 6, Tp + 15, Q.tl, "start") + ql(L + pw - 6, Tp + 15, Q.tr, "end");
  s += ql(L + 6, Tp + ph - 7, Q.bl, "start") + ql(L + pw - 6, Tp + ph - 7, Q.br, "end");
  for (let v = 1; v <= 5; v++) {
    s += `<text x="${sx(v)}" y="${Tp + ph + 16}" font-size="11" fill="#667085" text-anchor="middle">${v}</text>`;
    s += `<text x="${L - 8}" y="${sy(v) + 4}" font-size="11" fill="#667085" text-anchor="end">${v}</text>`;
  }
  s += `<text x="${L + pw / 2}" y="${H - 8}" font-size="12" font-weight="700" fill="${NAVY}" text-anchor="middle">${xLabel} →</text>`;
  s += `<text x="16" y="${Tp + ph / 2}" font-size="12" font-weight="700" fill="${NAVY}" text-anchor="middle" transform="rotate(-90 16 ${Tp + ph / 2})">Influence →</text>`;
  const placed = points.filter(p => p.inf && p[xKey]);
  const groups = {};
  placed.forEach(p => { (groups[p.inf + ":" + p[xKey]] ||= []).push(p); });
  Object.values(groups).forEach(g => g.forEach((p, i) => {
    const a = (2 * Math.PI * i) / g.length, r = g.length > 1 ? 13 : 0;
    const cx = sx(p[xKey]) + r * Math.cos(a), cy = sy(p.inf) + r * Math.sin(a);
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10" fill="${NAVY}"><title>${esc(p.name)}</title></circle>`;
    s += `<text x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="10.5" font-weight="700" fill="#fff" text-anchor="middle">${p.n}</text>`;
  }));
  if (!placed.length) s += `<text x="${L + pw / 2}" y="${Tp + ph / 2}" font-size="12" fill="#667085" text-anchor="middle">Rate influence and ${xLabel.toLowerCase()} to see the chart</text>`;
  return s + `</svg>`;
}

/* ================================================================== */

export function createWorkspace({ G, root, title, components, tasks }) {
  let state = {};
  let unsub = null;
  const instances = [];
  const base = () => `${root}/g${G.group}`;

  /* ---------- stakeholders: from a register (rows) or a fixed list ---------- */
  function stakeholders(source) {
    if (source.list) return source.list.map((name, i) => ({ id: "f" + i, n: i + 1, name }));
    return displayRows(get(state, source.rows), source.min || 0)
      .filter(r => String(r.v.c0 || "").trim())
      .map((r, i) => ({ id: r.id, n: i + 1, name: String(r.v.c0).trim() }));
  }
  const sourceSig = source => source.list ? "list" : stakeholders(source).map(s => s.id + ":" + s.name).join("|");

  function points(task, part) {
    return stakeholders(part.source).map(s => {
      const a = get(state, `${task}/${part.from || "assess"}/${s.id}`) || {};
      return { ...s, inf: +a.inf || null, imp: +a.imp || null, int: +a.int || null,
        cur: a.cur ?? null, des: a.des ?? null, why: a.why || "" };
    });
  }

  /* ---------- controls and binding ---------- */
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

  function bind(el, rel, { rowOrder = null } = {}) {
    el.dataset.rel = rel;
    const instant = el.tagName === "SELECT" || el.type === "checkbox";
    let timer;
    el.addEventListener(instant ? "change" : "input", () => {
      if (G.readOnly) return;
      el.dataset.dirty = "1";
      status.saving();
      clearTimeout(timer);
      const path = `${base()}/${rel}`;
      timer = setTimeout(async () => {
        let value = el.type === "checkbox" ? el.checked : el.value;
        if (value === "" || value === false) value = null;
        try {
          if (rowOrder !== null) {
            const p = path.split("/"); const field = p.pop();
            await G.db.update(p.join("/"), { o: rowOrder, [field]: value });
          } else await G.db.set(path, value);
          status.saved();
        } catch (err) { status.error("Unable to save"); console.error(err); }
        delete el.dataset.dirty;
      }, instant ? 0 : 450);
    });
    return el;
  }

  function syncValues(rootEl) {
    rootEl.querySelectorAll("[data-rel]").forEach(el => {
      if (document.activeElement === el || el.dataset.dirty) return;
      const v = get(state, el.dataset.rel);
      if (el.type === "checkbox") el.checked = !!v;
      else if (el.value !== String(v ?? "")) el.value = v ?? "";
    });
  }

  const btn = (cls, label, fn, extra = {}) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = cls; b.textContent = label;
    Object.entries(extra).forEach(([k, v]) => b.setAttribute(k, v));
    b.addEventListener("click", fn);
    return b;
  };
  const delButton = fn => btn("row-del", "×", fn, { title: "Delete row", "aria-label": "Delete row" });
  const addButton = (label, fn) => btn("ws-btn", label, fn);
  const scroll = (el, table, mt) => {
    const w = document.createElement("div");
    w.className = "ws-scroll"; if (mt) w.style.marginTop = mt;
    w.appendChild(table); el.appendChild(w);
  };
  const emptyNote = (el, text) => el.insertAdjacentHTML("beforeend", `<div class="ws-empty">${esc(text)}</div>`);
  async function removeRow(path, v) {
    if (rowHasContent(v) && !confirm("Delete this row?")) return;
    try { await G.db.remove(`${base()}/${path}`); status.saved(); }
    catch (err) { status.error("Unable to delete"); console.error(err); }
  }
  async function addRow(path) {
    try { await G.db.update(`${base()}/${path}/${uid()}`, { o: Date.now() }); }
    catch (err) { status.error("Unable to add row"); console.error(err); }
  }

  /* ---------- renderers: {signature(), build(el), refresh?(el)} ---------- */
  const renderers = {
    fixed(task, part) {
      const fields = part.fields || [{ kind: "textarea" }];
      return {
        signature: () => "fixed",
        build(el) {
          const table = document.createElement("table");
          table.innerHTML = `<thead><tr>${part.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody></tbody>`;
          part.rows.forEach((label, r) => {
            const tr = table.tBodies[0].insertRow();
            tr.insertCell().outerHTML = `<td class="row-label">${esc(label)}</td>`;
            fields.forEach((f, i) => tr.insertCell().appendChild(bind(control({ ...f, aria: label }),
              fields.length === 1 ? `${task}/${part.key}/r${r}` : `${task}/${part.key}/r${r}/f${i}`)));
          });
          scroll(el, table);
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
          rows.forEach((row, i) => {
            const tr = table.tBodies[0].insertRow();
            tr.insertCell().outerHTML = `<td class="num-col">${i + 1}</td>`;
            part.cols.forEach((c, ci) => tr.insertCell().appendChild(
              bind(control({ ...c, aria: `${c.label}, row ${i + 1}` }, row.v[`c${ci}`]), `${rel}/${row.id}/c${ci}`, { rowOrder: row.o })));
            const td = tr.insertCell(); td.className = "del-col";
            td.appendChild(delButton(() => removeRow(`${rel}/${row.id}`, row.v)));
          });
          scroll(el, table);
          el.appendChild(addButton("+ Add row", () => addRow(rel)));
        }
      };
    },

    fields(task, part) {
      return {
        signature: () => "fields",
        build(el) {
          part.fields.forEach(f => {
            const box = document.createElement("label");
            box.className = "ws-field"; box.style.display = "block";
            box.innerHTML = `<span class="field-label">${esc(f.label)}</span>`;
            const ta = control({ kind: "textarea" }); ta.rows = 3;
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
            const cb = document.createElement("input"); cb.type = "checkbox";
            lab.appendChild(bind(cb, `${task}/${part.key}/i${i}`));
            lab.appendChild(document.createTextNode(text));
            el.appendChild(lab);
          });
        }
      };
    },

    assess(task, part) {
      const dims = part.dims || ["inf", "imp", "int", "cur", "des"];
      return {
        signature: () => sourceSig(part.source),
        build(el) {
          if (part.stage) {
            const lab = document.createElement("label");
            lab.style.display = "block";
            lab.innerHTML = `<span class="field-label">Project stage of this assessment</span>`;
            const st = control({ kind: "select", options: STAGES, aria: "Project stage" });
            st.style.maxWidth = "280px";
            lab.appendChild(bind(st, `${task}/stage`));
            el.appendChild(lab);
          }
          const list = stakeholders(part.source);
          if (!list.length) return emptyNote(el, part.emptyText || "Add stakeholders to the register to rate them here.");
          const table = document.createElement("table");
          table.innerHTML = `<thead><tr><th>#</th><th>Stakeholder</th>${dims.map(d => `<th>${DIM[d].label}</th>`).join("")}
            ${part.rationale === false ? "" : "<th>Rationale</th>"}</tr></thead><tbody></tbody>`;
          list.forEach(s => {
            const tr = table.tBodies[0].insertRow();
            tr.insertCell().outerHTML = `<td class="num-col">${s.n}</td>`;
            tr.insertCell().outerHTML = `<td class="row-label" style="width:auto">${esc(s.name)}</td>`;
            dims.forEach(d => tr.insertCell().appendChild(bind(
              control({ kind: "select", options: DIM[d].opts, className: "score", aria: `${DIM[d].label} – ${s.name}` }),
              `${task}/${part.key}/${s.id}/${d}`)));
            if (part.rationale !== false) {
              const td = tr.insertCell(); td.style.minWidth = "200px";
              td.appendChild(bind(control({ kind: "textarea", aria: `Rationale – ${s.name}` }), `${task}/${part.key}/${s.id}/why`));
            }
          });
          scroll(el, table, part.stage ? "10px" : null);
        }
      };
    },

    plots(task, part) {
      const charts = part.charts || ["impact", "interest"];
      return {
        signature: () => "plots",
        build(el) { el.innerHTML = `<div class="plots-host"></div>`; },
        refresh(el) {
          const pts = points(task, part);
          el.querySelector(".plots-host").innerHTML =
            (charts.length ? `<div class="plots"${charts.length === 1 ? ' style="grid-template-columns:minmax(0,560px)"' : ""}>${charts.map(c =>
              `<div class="plot"><h5>${CHARTS[c].title}</h5>${plotSVG(pts, c)}</div>`).join("")}</div>` : "")
            + (part.summary === false ? "" : summaryTable(pts, part));
        }
      };
    },

    raci(task, part) {
      const rel = `${task}/${part.key}`;
      const fixedTasks = part.tasks;
      const rowsNow = () => fixedTasks
        ? fixedTasks.map((t, i) => ({ id: "r" + i, o: i, label: t, v: get(state, `${rel}/r${i}`) || {} }))
        : displayRows(get(state, rel), part.min ?? 5);
      return {
        signature: () => rowsNow().map(r => r.id).join(",") + "#" + sourceSig(part.source),
        build(el) {
          const people = stakeholders(part.source);
          if (!people.length) return emptyNote(el, "Add stakeholders to the register to build the RACI matrix.");
          const rows = rowsNow();
          const table = document.createElement("table");
          table.innerHTML = `<thead><tr><th>#</th>${part.stages ? "<th>Project stage</th>" : ""}<th style="min-width:180px">Task</th>
            ${people.map(p => `<th title="${esc(p.name)}" style="font-size:.78rem;min-width:70px">${part.source.list ? "" : p.n + ". "}${esc(p.name)}</th>`).join("")}
            <th>Check</th>${fixedTasks ? "" : "<th></th>"}</tr></thead><tbody></tbody>`;
          rows.forEach((row, i) => {
            const tr = table.tBodies[0].insertRow();
            const ro = fixedTasks ? {} : { rowOrder: row.o };
            tr.insertCell().outerHTML = `<td class="num-col">${i + 1}</td>`;
            if (part.stages) tr.insertCell().appendChild(bind(control({ kind: "select", options: STAGES, aria: `Stage, row ${i + 1}` }), `${rel}/${row.id}/stage`, ro));
            if (fixedTasks) tr.insertCell().outerHTML = `<td class="row-label" style="width:auto">${esc(row.label)}</td>`;
            else tr.insertCell().appendChild(bind(control({ kind: "textarea", aria: `Task, row ${i + 1}` }), `${rel}/${row.id}/task`, ro));
            people.forEach(p => tr.insertCell().appendChild(bind(
              control({ kind: "select", options: ["R", "A", "C", "I"], className: "score", aria: `${p.name}, row ${i + 1}` }),
              `${rel}/${row.id}/x_${p.id}`, ro)));
            const chk = tr.insertCell(); chk.className = "raci-check"; chk.dataset.row = row.id; chk.style.minWidth = "120px";
            if (!fixedTasks) {
              const d = tr.insertCell(); d.className = "del-col";
              d.appendChild(delButton(() => removeRow(`${rel}/${row.id}`, row.v)));
            }
          });
          scroll(el, table);
          if (!fixedTasks) el.appendChild(addButton("+ Add task", () => addRow(rel)));
        },
        refresh(el) {
          const people = stakeholders(part.source);
          el.querySelectorAll(".raci-check").forEach(cell => {
            const v = get(state, `${rel}/${cell.dataset.row}`) || {};
            cell.innerHTML = raciCheck(v, people, !!fixedTasks).map(([ok, msg]) =>
              `<span class="${ok ? "ws-ok" : "ws-warn"}">${esc(msg)}</span>`).join("");
          });
        }
      };
    }
  };

  function raciCheck(v, people, fixed) {
    const vals = people.map(p => v["x_" + p.id]).filter(Boolean);
    if (!fixed && !v.task && !vals.length) return [];
    if (fixed && !vals.length) return [];
    const a = vals.filter(x => x === "A").length, r = vals.filter(x => x === "R").length;
    const out = [a === 1 ? [true, "One A ✓"] : a === 0 ? [false, "No A assigned"] : [false, `${a} A's – keep one`]];
    out.push(r ? [true, `R: ${r}`] : [false, "No R assigned"]);
    return out;
  }

  function summaryTable(pts, part) {
    const hasInt = pts.some(p => p.int), hasSup = pts.some(p => p.cur != null || p.des != null);
    if (!pts.length) return "";
    const rows = pts.map(p => {
      const st = strategy(p.inf, p.int);
      return `<tr><td class="num-col">${p.n}</td><td>${esc(p.name)}</td>
        ${hasInt || !hasSup ? `<td>${st ? `<span class="badge ${st.c}">${st.t}</span>` : "<span style='color:#98a2b3'>not rated</span>"}</td>` : ""}
        ${hasSup ? `<td>${esc(supportGap(p))}</td><td>${riskFlag(p) ? `<span class="badge b-close">High influence, low support</span>` : ""}</td>` : ""}</tr>`;
    }).join("");
    return `<h4 style="margin-top:16px">${hasSup && !hasInt ? "Support summary" : "Engagement summary"}</h4>
      <div class="ws-scroll"><table><thead><tr><th>#</th><th>Stakeholder</th>
      ${hasInt || !hasSup ? "<th>Engagement strategy</th>" : ""}${hasSup ? "<th>Support: current → desired</th><th>Risk</th>" : ""}
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  /* ---------- lifecycle ---------- */
  function buildAll() {
    instances.length = 0;
    document.querySelectorAll(".ws[data-task]").forEach(host => {
      const task = host.dataset.task;
      if (!tasks[task]) return;
      host.innerHTML = "";
      const only = host.dataset.part;
      tasks[task].parts.filter(p => !only || p.group === only).forEach(part => {
        const box = document.createElement("div");
        box.className = "ws-part";
        if (part.title) box.insertAdjacentHTML("beforeend", `<h4>${esc(part.title)}</h4>`);
        if (part.hint) box.insertAdjacentHTML("beforeend", `<p class="ws-hint">${esc(part.hint)}</p>`);
        const body = document.createElement("div");
        box.appendChild(body); host.appendChild(box);
        instances.push({ r: renderers[part.type](task, part), body, sig: null });
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
        if (G.readOnly) inst.body.querySelectorAll("input,select,textarea").forEach(e => { e.disabled = true; });
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
    unsub = G.db.sub(base(), val => { state = val || {}; refreshAll(); },
      err => { status.error("Unable to read group data"); console.error(err); });
  }

  /* ---------- PDF ---------- */
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
  const empty = () => ({ text: "No entries yet.", style: "muted", margin: [0, 2, 0, 6] });
  const pdfTable = (header, body, widths) => ({
    table: { headerRows: 1, widths: widths || header.map(() => "*"), body: [header.map(l => ({ text: l, style: "th" })), ...body], dontBreakRows: true },
    layout: { hLineColor: () => "#d9e1ec", vLineColor: () => "#d9e1ec", fillColor: r => (r === 0 ? "#edf3fb" : null),
      paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 4, paddingBottom: () => 4 },
    margin: [0, 2, 0, 10]
  });

  async function partToPdf(task, part) {
    const out = [];
    if (part.title) out.push({ text: part.title, style: "h3" });
    const data = get(state, `${task}/${part.key}`);
    switch (part.type) {
      case "fixed": {
        const fields = part.fields || [{}];
        out.push(pdfTable(part.cols, part.rows.map((label, r) => [cell(label, { bold: true, color: "#273b60" }),
          ...fields.map((f, i) => cell(fields.length === 1 ? get(data || {}, `r${r}`) : get(data || {}, `r${r}/f${i}`)))]),
          fields.length === 1 ? ["35%", "*"] : ["25%", "18%", "*"]));
        break;
      }
      case "rows": {
        const rows = displayRows(data, 0).filter(r => rowHasContent(r.v));
        if (!rows.length) { out.push(empty()); break; }
        out.push(pdfTable(["#", ...part.cols.map(c => c.label)],
          rows.map((r, i) => [cell(i + 1), ...part.cols.map((c, ci) => cell(r.v[`c${ci}`]))]), [16, ...part.cols.map(() => "*")]));
        break;
      }
      case "fields":
        part.fields.forEach(f => {
          out.push({ text: f.label, bold: true, color: "#273b60", margin: [0, 2, 0, 2] });
          out.push(get(data || {}, f.key) ? { text: txt(get(data, f.key)), margin: [0, 0, 0, 8] } : empty());
        });
        break;
      case "checks":
        out.push(pdfTable(["Requirement", "Status"], part.items.map((t, i) => {
          const ok = get(data || {}, `i${i}`);
          return [cell(t), cell(ok ? "Confirmed" : "Not yet confirmed", { color: ok ? "#2f6f5e" : "#8d4550", bold: true })];
        }), ["*", 90]));
        break;
      case "assess": {
        const dims = part.dims || ["inf", "imp", "int", "cur", "des"];
        if (part.stage) out.push({ text: [{ text: "Project stage of this assessment: ", bold: true }, get(state, `${task}/stage`) || "not specified"], margin: [0, 0, 0, 4] });
        const pts = points(task, { ...part, from: part.key });
        if (!pts.length) { out.push(empty()); break; }
        const fmt = (d, v) => v == null ? "" : (d === "cur" || d === "des") ? `${v} ${SUPPORT_LABEL[v] || ""}` : v;
        const withWhy = part.rationale !== false;
        out.push(pdfTable(["#", "Stakeholder", ...dims.map(d => DIM[d].label), ...(withWhy ? ["Rationale"] : [])],
          pts.map(p => [cell(p.n), cell(p.name), ...dims.map(d => cell(fmt(d, p[d]))), ...(withWhy ? [cell(p.why)] : [])]),
          [14, "18%", ...dims.map(d => (d === "cur" || d === "des") ? 58 : 40), ...(withWhy ? ["*"] : [])]));
        break;
      }
      case "plots": {
        const pts = points(task, part);
        if (!pts.length) { out.push(empty()); break; }
        const charts = part.charts || ["impact", "interest"];
        if (charts.length) {
          const imgs = await Promise.all(charts.map(c => svgToPng(plotSVG(pts, c))));
          out.push({ columns: charts.map((c, i) => ({ stack: [{ text: CHARTS[c].title, bold: true, margin: [0, 0, 0, 3] }, { image: imgs[i], width: 245 }] })),
            columnGap: 12, margin: [0, 0, 0, 8], unbreakable: true });
        }
        if (part.summary !== false) {
          const hasInt = pts.some(p => p.int), hasSup = pts.some(p => p.cur != null || p.des != null);
          const head = ["#", "Stakeholder", ...(hasInt || !hasSup ? ["Engagement strategy"] : []), ...(hasSup ? ["Support: current to desired", "Risk"] : [])];
          out.push({ text: hasSup && !hasInt ? "Support summary" : "Engagement summary", style: "h3" });
          out.push(pdfTable(head, pts.map(p => [cell(p.n), cell(p.name),
            ...(hasInt || !hasSup ? [cell(strategy(p.inf, p.int)?.t || "not rated")] : []),
            ...(hasSup ? [cell(supportGap(p, "to")), cell(riskFlag(p) ? "High influence, low support" : "", { color: "#8d4550" })] : [])]),
            [14, "*", ...(hasInt || !hasSup ? [100] : []), ...(hasSup ? [110, 100] : [])]));
        }
        break;
      }
      case "raci": {
        const people = stakeholders(part.source);
        const rel = `${task}/${part.key}`;
        const rows = (part.tasks
          ? part.tasks.map((t, i) => ({ v: { task: t, ...(get(state, `${rel}/r${i}`) || {}) } }))
          : displayRows(get(state, rel), 0)).filter(r => rowHasContent(r.v));
        if (!rows.length) { out.push(empty()); break; }
        const who = (v, l) => people.filter(p => v["x_" + p.id] === l).map(p => p.name).join(", ");
        out.push(pdfTable([...(part.stages ? ["Stage"] : []), "Task", "Responsible", "Accountable", "Consulted", "Informed", "Check"],
          rows.map(r => [...(part.stages ? [cell(r.v.stage)] : []), cell(r.v.task), cell(who(r.v, "R")), cell(who(r.v, "A")),
            cell(who(r.v, "C")), cell(who(r.v, "I")), cell(raciCheck(r.v, people, !!part.tasks).map(x => x[1].replace(" ✓", "")).join("; "), { fontSize: 7.5 })]),
          [...(part.stages ? [52] : []), "*", 70, 62, 62, 62, 52]));
        break;
      }
    }
    return out;
  }

  async function exportPdf(key, button) {
    if (!window.pdfMake) { alert("PDF library did not load. Please reload the page."); return; }
    const old = button.textContent;
    button.disabled = true; button.textContent = "Preparing PDF…";
    try {
      const p = G.profile || {};
      const groupLine = `Group ${G.group}${p.name ? " – " + p.name : ""}`;
      const heading = key === "all" ? (components.all || title) : components[key];
      const content = [
        { text: `Stakeholder Communication · ${title}`, style: "kicker" },
        { text: heading, style: "h1" },
        { table: { widths: [120, "*"], body: [
            [cell("Group", { bold: true }), cell(groupLine)],
            [cell("Members", { bold: true }), cell(G.memberNames().join(", ") || "not specified")],
            [cell("Client organisation", { bold: true }), cell(p.clientOrg || G.company || "not specified")],
            [cell("Client contact", { bold: true }), cell(p.clientContact || "not specified")],
            [cell("Exported", { bold: true }), cell(formatDate(todayISO()))]] },
          layout: { hLineColor: () => "#d9e1ec", vLineColor: () => "#d9e1ec", fillColor: (r, n, c) => (c === 0 ? "#f5f8fc" : null),
            paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4 },
          margin: [0, 4, 0, 16] }
      ];
      for (const [task, def] of Object.entries(tasks)) {
        if (key !== "all" && def.c !== key) continue;
        content.push({ text: def.title, style: "h2" });
        for (const part of def.parts) content.push(...await partToPdf(task, part));
      }
      const doc = {
        pageSize: "A4", pageMargins: [40, 50, 40, 46],
        header: page => page === 1 ? null : { columns: [{ text: groupLine }, { text: heading, alignment: "right" }], margin: [40, 20, 40, 0], fontSize: 8, color: "#667085" },
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
        info: { title: `${heading} – ${groupLine}`, author: G.memberNames().join(", ") }
      };
      const slug = String(key === "all" ? "All" : key).replace(/[^A-Za-z0-9]+/g, "-");
      window.__LAST_PDF_DOC__ = doc;
      pdfMake.createPdf(doc).download(`${title.replace(/[^A-Za-z0-9]+/g, "_")}_${slug}_Group_${G.group}.pdf`);
    } catch (err) {
      console.error(err);
      alert("The PDF could not be created. Please try again.");
    } finally {
      button.disabled = false; button.textContent = old;
    }
  }

  buildAll();
  subscribe();
  document.querySelectorAll("[data-export]").forEach(b => b.addEventListener("click", () => exportPdf(b.dataset.export, b)));

  return {
    onGroupChange: subscribe,
    get state() { return state; }
  };
}

export function sectionNav() {
  const links = [...document.querySelectorAll("#topnav a")];
  const sections = links.map(a => document.querySelector(a.getAttribute("href")));
  const update = () => {
    let index = 0;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= 110) index = i; });
    links.forEach((a, i) => a.classList.toggle("active", i === index));
  };
  document.addEventListener("scroll", update, { passive: true });
  update();
}
