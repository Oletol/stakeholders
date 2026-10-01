// Teacher panel
import { initGroup, status, esc, memberList, GROUPS } from "./group.js";
import { formatDate } from "./db.js";

const G = await initGroup({ profile: false });
const main = document.getElementById("adminMain");

if (!G.isAdmin) {
  main.innerHTML = `<div class="card denied"><h1>Teacher access only</h1><p>This page is available to the course teacher.</p></div>`;
} else {
  const db = G.db;
  let groups = {}, members = {}, users = {}, admins = {};

  /* course code */
  const codeInput = document.getElementById("codeInput");
  const codeNote = document.getElementById("codeNote");
  db.sub("config/joinCode", v => { if (document.activeElement !== codeInput) codeInput.value = v || ""; });
  document.getElementById("codeSave").addEventListener("click", async () => {
    const v = codeInput.value.trim();
    if (v.length < 4) { codeNote.className = "note err"; codeNote.textContent = "Use at least 4 characters."; return; }
    try { await db.set("config/joinCode", v); codeNote.className = "note ok"; codeNote.textContent = "Saved"; }
    catch (err) { codeNote.className = "note err"; codeNote.textContent = "Not saved: no permission"; console.error(err); }
  });

  /* teams */
  const teamRows = document.getElementById("teamRows");
  teamRows.innerHTML = GROUPS.map(g => `
    <tr><td><b>Group ${g}</b></td>
    <td><input type="text" data-company="g${g}" maxlength="120" placeholder="Company name"></td>
    <td data-members="g${g}"></td>
    <td class="links"><a href="cna.html?group=${g}">CNA</a><a href="kanban.html?group=${g}">Kanban</a></td></tr>`).join("");
  teamRows.querySelectorAll("[data-company]").forEach(inp => {
    let t;
    inp.addEventListener("input", () => {
      inp.dataset.dirty = "1";
      status.saving();
      clearTimeout(t);
      t = setTimeout(async () => {
        try { await db.set(`config/groups/${inp.dataset.company}/company`, inp.value.trim() || null); status.saved(); }
        catch (err) { status.error("Unable to save"); console.error(err); }
        delete inp.dataset.dirty;
      }, 500);
    });
  });

  function renderTeams() {
    teamRows.querySelectorAll("[data-company]").forEach(inp => {
      if (document.activeElement !== inp && !inp.dataset.dirty) inp.value = groups[inp.dataset.company]?.company || "";
    });
    teamRows.querySelectorAll("[data-members]").forEach(td => {
      const names = memberList(members[td.dataset.members]);
      td.innerHTML = names.length
        ? esc(names.join(", ")) + (names.length > 3 ? ` <span class="tag warn">${names.length} members</span>` : "")
        : `<span class="muted">No members</span>`;
    });
  }

  /* students */
  const studentRows = document.getElementById("studentRows");
  function renderStudents() {
    const list = Object.entries(users).filter(([uid]) => !admins[uid]).sort((a, b) =>
      (a[1].group ? 1 : 0) - (b[1].group ? 1 : 0) || String(a[1].name || "").localeCompare(String(b[1].name || "")));
    if (!list.length) { studentRows.innerHTML = `<tr><td colspan="5" class="muted">No students have registered yet.</td></tr>`; return; }
    studentRows.innerHTML = list.map(([uid, u]) => {
      const st = !u.joinCode ? `<span class="tag bad">No course code</span>` : !u.group ? `<span class="tag warn">Waiting for team</span>` : "Active";
      const opts = [`<option value="">Choose a team…</option>`, ...GROUPS.map(g =>
        `<option value="g${g}"${u.group === "g" + g ? " selected" : ""}>Group ${g}${groups["g" + g]?.company ? " – " + esc(groups["g" + g].company) : ""}</option>`)].join("");
      return `<tr><td>${esc(u.name || "")}</td><td>${esc(u.email || "")}</td><td>${esc(formatDate(u.createdAt))}</td><td>${st}</td>
        <td><select data-uid="${uid}" ${u.joinCode ? "" : "disabled"}>${opts}</select></td></tr>`;
    }).join("");
  }
  studentRows.addEventListener("change", async e => {
    const sel = e.target.closest("select[data-uid]");
    if (!sel) return;
    const uid = sel.dataset.uid;
    const u = users[uid] || {};
    const to = sel.value || null;
    status.saving();
    try {
      if (u.group) await db.remove(`members/${u.group}/${uid}`);
      await db.set(`users/${uid}/group`, to);
      if (to) await db.set(`members/${to}/${uid}`, u.name || u.email || "Student");
      status.saved();
    } catch (err) { status.error("Unable to move the student"); console.error(err); }
  });

  /* viewing other teams' work */
  const SHARE = [["stakeholder", "Stakeholder Analysis"], ["cna", "Comprehensive Needs Analysis"], ["kanban", "Kanban"]];
  const shareRows = document.getElementById("shareRows");
  let share = {};
  function renderShare() {
    shareRows.innerHTML = SHARE.map(([k, label]) => {
      const on = share[k] === true;
      return `<div class="share-row"><b>${label}</b><span><span class="share-state ${on ? "on" : "off"}">${on ? "Open for viewing" : "Closed"}</span>
        <button type="button" class="toggle ${on ? "on" : ""}" data-share="${k}">${on ? "Close" : "Open"}</button></span></div>`;
    }).join("");
  }
  shareRows.addEventListener("click", async e => {
    const b = e.target.closest("[data-share]");
    if (!b) return;
    const k = b.dataset.share;
    status.saving();
    try { await db.set(`config/share/${k}`, share[k] === true ? null : true); status.saved(); }
    catch (err) { status.error("Unable to save"); console.error(err); }
  });
  db.sub("config/share", v => { share = v || {}; renderShare(); });

  db.sub("seminarWorkspace", v => {
    const box = document.getElementById("archiveRows");
    const items = Object.entries(v || {}).filter(([, x]) => x && x.text).sort((a, b) => a[0].localeCompare(b[0]));
    box.innerHTML = items.length ? items.map(([k, x]) =>
      `<details><summary>${esc(k.replace("group", "Group "))}</summary><pre>${esc(x.text)}</pre></details>`).join("")
      : `<p class="muted">No archived texts.</p>`;
  }, err => console.error(err));
  db.sub("admins", v => { admins = v || {}; renderStudents(); });
  db.sub("config/groups", v => { groups = v || {}; renderTeams(); renderStudents(); });
  db.sub("members", v => { members = v || {}; renderTeams(); });
  db.sub("users", v => { users = v || {}; renderStudents(); }, err => {
    studentRows.innerHTML = `<tr><td colspan="5" class="note err">Unable to read the student list. Check the database rules.</td></tr>`;
    console.error(err);
  });
}
