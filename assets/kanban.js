// Project Kanban – shared board per group with mandatory deadlines,
// one-time postponement and Kanban colour coding.
import { initGroup, status, esc } from "./group.js";
import { uid, todayISO, formatDate, daysBetween } from "./db.js";

const COLS = ["backlog", "progress", "review", "done"];
const COL_NAME = { backlog: "Backlog", progress: "In Progress", review: "Review / Approval", done: "Done" };
export const TYPES = ["Needs analysis", "Client communication", "Course design", "Materials development", "Moodle setup", "Documentation"];
const CLASS_NAME = { expedite: "Expedite", fixed: "Fixed date", standard: "Standard", intangible: "Intangible" };
const CLASS_ORDER = { expedite: 0, fixed: 1, standard: 2, intangible: 3 };
const SOON_DAYS = 2;

let G = null;
let tasks = {};
let unsub = null;
const cards = new Map();        // id -> {el, sig}
const openForm = new Map();     // id -> "postpone" | "block"
let typeFilter = "";

const base = () => `kanban/g${G.group}/tasks`;
const list = raw => String(raw || "").split(",").map(s => s.trim()).filter(Boolean);

/* ---------------- deadline logic ---------------- */

export function deadlineState(t, today = todayISO()) {
  if (t.status === "done") {
    const done = t.actualDate || today;
    const late = t.due && done > t.due ? daysBetween(t.due, done) : 0;
    return late > 0 ? { cls: "bs-late", text: `Done late by ${late} day${late === 1 ? "" : "s"}` }
                    : { cls: "bs-done", text: "Done on time" };
  }
  if (!t.due) return { cls: "bs-over", text: "No deadline" };
  const d = daysBetween(today, t.due);
  if (d < 0) return { cls: "bs-over", text: `Overdue by ${-d} day${d === -1 ? "" : "s"}`, overdue: true };
  if (d <= SOON_DAYS) return { cls: "bs-soon", text: d === 0 ? "Due today" : `Due in ${d} day${d === 1 ? "" : "s"}` };
  return { cls: "bs-ok", text: "On track" };
}

function sortTasks(arr, col) {
  if (col === "done") return arr.sort((a, b) => (b.actualDate || "").localeCompare(a.actualDate || "") || b.o - a.o);
  return arr.sort((a, b) =>
    (CLASS_ORDER[a.cls] ?? 2) - (CLASS_ORDER[b.cls] ?? 2) ||
    (a.blocked ? 1 : 0) - (b.blocked ? 1 : 0) ||
    (a.due || "9999").localeCompare(b.due || "9999") || a.o - b.o);
}

/* ---------------- writes ---------------- */

async function write(id, patch) {
  status.saving();
  try { await G.db.update(`${base()}/${id}`, patch); status.saved(); }
  catch (err) { status.error("Unable to save"); console.error(err); }
}

/* ---------------- card ---------------- */

function cardSignature(t) {
  return [t.status, t.cls, t.type, t.reviewSince, t.due, t.dueOriginal, t.postponedOn, t.postponeReason, t.blocked, t.blockReason,
    t.actualDate, t.createdAt, openForm.get(t.id) || "", todayISO(), G.readOnly].join("|");
}

function textBind(el, id, field, onLocal) {
  el.dataset.field = field;
  let timer;
  el.addEventListener("input", () => {
    el.dataset.dirty = "1";
    status.saving();
    clearTimeout(timer);
    timer = setTimeout(async () => {
      await write(id, { [field]: el.value.trim() ? el.value : null });
      delete el.dataset.dirty;
    }, 450);
    onLocal && onLocal(el.value);
  });
  return el;
}

function renderChips(box, raw) {
  box.innerHTML = list(raw).map(n => `<span class="chip">${esc(n)}</span>`).join("");
}

function renderLink(box, url) {
  box.innerHTML = /^https?:\/\//i.test(url || "") ?
    `<a class="result-link" href="${esc(url)}" target="_blank" rel="noopener">Open result ↗</a>` : "";
}

function buildCard(t) {
  const el = document.createElement("article");
  const st = deadlineState(t);
  el.className = `kcard cls-${t.cls || "standard"}` + (t.blocked ? " is-blocked" : "") +
    (st.overdue ? " is-overdue" : "") + (t.status === "done" ? " is-done" : "");
  el.dataset.id = t.id;

  const badges = [`<span class="badge bc-${t.cls || "standard"}">${CLASS_NAME[t.cls] || "Standard"}</span>`,
    ...(t.type ? [`<span class="badge type-badge">${esc(t.type)}</span>`] : []),
    `<span class="badge ${st.cls}">${st.text}</span>`];
  if (t.dueOriginal) badges.push(`<span class="badge bs-post">Deadline postponed</span>`);
  if (t.blocked && t.status !== "done") badges.push(`<span class="badge bs-block">Blocked</span>`);

  const dueCell = t.dueOriginal
    ? `<s>${formatDate(t.dueOriginal)}</s> → <b>${formatDate(t.due)}</b>`
    : `<b>${formatDate(t.due) || "–"}</b>`;
  const thirdCell = t.status === "done"
    ? `<div><small>Completed</small><b>${formatDate(t.actualDate)}</b></div>`
    : t.status === "review" && t.reviewSince
      ? `<div><small>In review since</small><b>${formatDate(t.reviewSince)}</b></div>` : "";

  el.innerHTML = `
    <div class="badges">${badges.join("")}</div>
    <textarea class="k-text" aria-label="Task description" maxlength="500"></textarea>
    <div class="dates">
      <div><small>Task set</small>${formatDate(t.createdAt) || "–"}</div>
      <div><small>Deadline</small>${dueCell}</div>
      ${thirdCell}
    </div>
    ${t.dueOriginal ? `<div class="post-note">Deadline moved once on ${formatDate(t.postponedOn)} from ${formatDate(t.dueOriginal)} to ${formatDate(t.due)}.${t.postponeReason ? ` Reason: ${esc(t.postponeReason)}` : ""}</div>` : ""}
    ${t.blocked && t.status !== "done" ? `<div class="block-note"><b>Blocked:</b> ${esc(t.blockReason || "no reason given")}</div>` : ""}
    <div class="kfield"><span class="field-label">Task type</span><select class="k-type"><option value="">–</option>${TYPES.map(x => `<option${x === t.type ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
    <div class="kfield"><span class="field-label">Assignees</span><input type="text" class="k-who" list="memberList" placeholder="Comma separated"><div class="chips"></div></div>
    <div class="kfield"><span class="field-label">Result link</span><input type="url" class="k-url" placeholder="https://…"><div class="link-box"></div></div>
    <div class="actions"></div>
    <div class="form-host"></div>`;

  el.querySelector(".k-type").addEventListener("change", e => write(t.id, { type: e.target.value || null }));

  const text = el.querySelector(".k-text");
  text.value = t.text || "";
  textBind(text, t.id, "text");

  const who = el.querySelector(".k-who");
  const chips = el.querySelector(".chips");
  who.value = t.assignees || "";
  renderChips(chips, who.value);
  textBind(who, t.id, "assignees", v => renderChips(chips, v));

  const url = el.querySelector(".k-url");
  const linkBox = el.querySelector(".link-box");
  url.value = t.resultUrl || "";
  renderLink(linkBox, url.value);
  textBind(url, t.id, "resultUrl", v => renderLink(linkBox, v));

  const actions = el.querySelector(".actions");
  const btn = (label, cls, fn) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "abtn " + cls; b.textContent = label;
    b.addEventListener("click", fn);
    actions.appendChild(b);
  };
  const i = COLS.indexOf(t.status);
  if (i > 0) btn(`← ${COL_NAME[COLS[i - 1]]}`, "", () => move(t, COLS[i - 1]));
  if (i < 2) btn(`${COL_NAME[COLS[i + 1]]} →`, "", () => move(t, COLS[i + 1]));
  if (t.status !== "done") {
    if (!t.dueOriginal) btn("Postpone deadline (once)", "warn", () => toggleForm(t.id, "postpone"));
    btn(t.blocked ? "Unblock" : "Mark blocked", "", () => t.blocked
      ? write(t.id, { blocked: null, blockReason: null })
      : toggleForm(t.id, "block"));
  }
  btn("Delete", "danger", () => {
    if (confirm("Delete this task? This cannot be undone.")) {
      G.db.remove(`${base()}/${t.id}`).catch(err => { status.error("Unable to delete"); console.error(err); });
    }
  });

  if (G.readOnly) el.querySelectorAll("input,select,textarea").forEach(x => { x.disabled = true; });
  const formHost = el.querySelector(".form-host");
  if (openForm.get(t.id) === "postpone") formHost.appendChild(postponeForm(t));
  if (openForm.get(t.id) === "block") formHost.appendChild(blockForm(t));
  return el;
}

function toggleForm(id, kind) {
  openForm.get(id) === kind ? openForm.delete(id) : openForm.set(id, kind);
  render();
}

function postponeForm(t) {
  const f = document.createElement("div");
  f.className = "inline-form";
  const min = t.due && t.due >= todayISO() ? nextDay(t.due) : nextDay(todayISO());
  f.innerHTML = `
    <p>A deadline can be postponed only once. The original date stays visible on the card.</p>
    <div class="row">
      <label><span class="field-label">New deadline</span><input type="date" class="p-date" min="${min}"></label>
      <label><span class="field-label">Reason (required)</span><input type="text" class="p-reason" maxlength="300" placeholder="e.g. Client rescheduled the meeting"></label>
    </div>
    <div class="err"></div>
    <div class="actions"><button type="button" class="abtn warn p-ok">Confirm new deadline</button><button type="button" class="abtn p-cancel">Cancel</button></div>`;
  f.querySelector(".p-cancel").addEventListener("click", () => toggleForm(t.id, "postpone"));
  f.querySelector(".p-ok").addEventListener("click", async () => {
    const date = f.querySelector(".p-date").value;
    const reason = f.querySelector(".p-reason").value.trim();
    const err = f.querySelector(".err");
    if (!date) return void (err.textContent = "Choose the new deadline.");
    if (date < min) return void (err.textContent = `The new deadline must be on or after ${formatDate(min)}.`);
    if (!reason) return void (err.textContent = "Give a reason for the postponement.");
    if (tasks[t.id]?.dueOriginal) return void (err.textContent = "This deadline has already been postponed.");
    openForm.delete(t.id);
    await write(t.id, { dueOriginal: t.due, due: date, postponedOn: todayISO(), postponeReason: reason });
  });
  return f;
}

function blockForm(t) {
  const f = document.createElement("div");
  f.className = "inline-form block";
  f.innerHTML = `
    <p>A blocked task cannot move forward until something outside the team changes, for example a document or approval from the client.</p>
    <label><span class="field-label">What is blocking the task?</span><input type="text" class="b-reason" maxlength="300"></label>
    <div class="err"></div>
    <div class="actions"><button type="button" class="abtn b-ok">Mark blocked</button><button type="button" class="abtn b-cancel">Cancel</button></div>`;
  f.querySelector(".b-cancel").addEventListener("click", () => toggleForm(t.id, "block"));
  f.querySelector(".b-ok").addEventListener("click", async () => {
    const reason = f.querySelector(".b-reason").value.trim();
    if (!reason) return void (f.querySelector(".err").textContent = "Describe what is blocking the task.");
    openForm.delete(t.id);
    await write(t.id, { blocked: true, blockReason: reason });
  });
  return f;
}

function nextDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

async function move(t, to) {
  const patch = { status: to };
  if (to === "done") patch.actualDate = todayISO();
  else patch.actualDate = null;
  patch.reviewSince = to === "review" ? todayISO() : (to === "done" ? (t.reviewSince || null) : null);
  if (to === "done") { patch.blocked = null; patch.blockReason = null; }
  openForm.delete(t.id);
  await write(t.id, patch);
}

/* ---------------- board ---------------- */

function render() {
  const all = Object.entries(tasks || {})
    .filter(([, v]) => v && typeof v === "object")
    .map(([id, v]) => ({ id, o: v.o || 0, status: COLS.includes(v.status) ? v.status : "backlog", cls: v.cls || "standard", ...v, id }));

  const seen = new Set();
  COLS.forEach(col => {
    const listEl = document.getElementById("list-" + col);
    const items = sortTasks(all.filter(t => t.status === col && (!typeFilter || t.type === typeFilter)), col);
    document.getElementById("count-" + col).textContent = items.length;

    const desired = items.map(t => {
      seen.add(t.id);
      const sig = cardSignature(t);
      let entry = cards.get(t.id);
      if (!entry || entry.sig !== sig) {
        const active = document.activeElement;
        const keep = entry && active && entry.el.contains(active) && active.dataset.field
          ? { field: active.dataset.field, sel: [active.selectionStart, active.selectionEnd] } : null;
        const el = buildCard(t);
        if (entry) entry.el.replaceWith(el);
        entry = { el, sig };
        cards.set(t.id, entry);
        if (keep) {
          const target = el.querySelector(`[data-field="${keep.field}"]`);
          if (target) { target.focus(); try { target.setSelectionRange(...keep.sel); } catch (e) {} }
        }
      } else {
        // only free-text fields may have changed remotely
        const pairs = [[".k-text", t.text], [".k-who", t.assignees], [".k-url", t.resultUrl]];
        pairs.forEach(([sel, v]) => {
          const inp = entry.el.querySelector(sel);
          if (inp && document.activeElement !== inp && !inp.dataset.dirty && inp.value !== (v || "")) {
            inp.value = v || "";
            if (sel === ".k-who") renderChips(entry.el.querySelector(".chips"), inp.value);
            if (sel === ".k-url") renderLink(entry.el.querySelector(".link-box"), inp.value);
          }
        });
      }
      return entry.el;
    });

    // order children without recreating them
    desired.forEach((el, idx) => {
      if (listEl.children[idx] !== el) listEl.insertBefore(el, listEl.children[idx] || null);
    });
    [...listEl.children].slice(desired.length).forEach(c => c.remove());
    if (!desired.length) listEl.innerHTML = `<div class="col-empty">No tasks</div>`;
  });

  for (const id of [...cards.keys()]) if (!seen.has(id)) { cards.get(id).el.remove(); cards.delete(id); }
  renderLoad(all);
  renderFilter(all);
}

function renderFilter(all) {
  const box = document.getElementById("typeFilter");
  const count = type => all.filter(t => !type || t.type === type).length;
  box.innerHTML = [["", "All types"], ...TYPES.map(x => [x, x])].map(([v, label]) =>
    `<button type="button" class="filter-btn${v === typeFilter ? " active" : ""}" data-type="${esc(v)}">${esc(label)} <span>${count(v)}</span></button>`).join("");
}
document.getElementById("typeFilter").addEventListener("click", e => {
  const b = e.target.closest("[data-type]");
  if (!b) return;
  typeFilter = b.dataset.type;
  render();
});

function renderLoad(all) {
  const box = document.getElementById("memberLoad");
  const counts = {};
  G.memberNames().forEach(n => { counts[n] = { active: 0, overdue: 0 }; });
  all.filter(t => t.status !== "done").forEach(t => {
    const st = deadlineState(t);
    list(t.assignees).forEach(n => {
      counts[n] ||= { active: 0, overdue: 0 };
      counts[n].active++;
      if (st.overdue) counts[n].overdue++;
    });
  });
  const entries = Object.entries(counts).sort((a, b) => b[1].active - a[1].active);
  box.innerHTML = entries.length ? entries.map(([n, c]) =>
    `<span class="${c.overdue ? "warn" : ""}"><b>${esc(n)}</b> – ${c.active} active task${c.active === 1 ? "" : "s"}${c.overdue ? `, ${c.overdue} overdue` : ""}</span>`).join("")
    : `<span>No assignees yet.</span>`;
}

function subscribe() {
  if (unsub) unsub();
  tasks = {};
  cards.forEach(c => c.el.remove());
  cards.clear();
  openForm.clear();
  render();
  unsub = G.db.sub(base(), val => { tasks = val || {}; render(); },
    err => { status.error("Unable to read the board"); console.error(err); });
}

/* ---------------- add form ---------------- */

const fDue = document.getElementById("fDue");
fDue.min = todayISO();
document.getElementById("addForm").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("formMsg");
  const text = document.getElementById("fText").value.trim();
  const due = fDue.value;
  if (!text) return void (msg.textContent = "Describe the task.");
  if (!document.getElementById("fType").value) return void (msg.textContent = "Choose the task type.");
  if (!due) return void (msg.textContent = "Set a deadline. Every task must have one.");
  if (due < todayISO()) return void (msg.textContent = "The deadline cannot be in the past.");
  msg.textContent = "";
  const id = uid();
  await write(id, {
    o: Date.now(), text, cls: document.getElementById("fClass").value, type: document.getElementById("fType").value || null, status: "backlog",
    createdAt: todayISO(), due, assignees: document.getElementById("fWho").value.trim() || null
  });
  e.target.reset();
});

/* ---------------- start ---------------- */

G = await initGroup({ profile: false, share: "kanban", onChange: () => { if (G) subscribe(); } });
G.onMembers(() => {
  document.getElementById("memberList").innerHTML = G.memberNames().map(n => `<option value="${esc(n)}">`).join("");
  render();
});
document.getElementById("fType").innerHTML = `<option value="">Choose type</option>` + TYPES.map(x => `<option>${esc(x)}</option>`).join("");
subscribe();
// refresh deadline badges after midnight
setInterval(render, 60 * 60 * 1000);
