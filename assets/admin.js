// Teacher panel
import { initGroup, status, esc, memberList, GROUPS } from "./group.js";
import { formatDate } from "./db.js";
import { SETS, SJT, sjtProfile, BIAS_KEYS, GOALS, CALIB } from "./exercises.js";

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
    <td class="links"><a href="cna.html?group=${g}">CNA</a><a href="experts.html?group=${g}">Experts</a><a href="kanban.html?group=${g}">Kanban</a></td></tr>`).join("");
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
    // possible duplicates: same address before @ (any misis.ru domain) or the same name
    const norm = v => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
    const count = {};
    list.forEach(([, u]) => {
      [`e:${norm(u.email).split("@")[0]}`, `n:${norm(u.name)}`].forEach(k => { if (k.length > 2) count[k] = (count[k] || 0) + 1; });
    });
    const dup = u => count[`e:${norm(u.email).split("@")[0]}`] > 1 ? "Same address registered twice"
      : count[`n:${norm(u.name)}`] > 1 ? "Same name registered twice" : "";
    studentRows.innerHTML = list.map(([uid, u]) => {
      const st = (dup(u) ? `<span class="tag bad">${dup(u)}</span> ` : "") +
        (!u.joinCode ? `<span class="tag bad">No course code</span>` : !u.group ? `<span class="tag warn">Waiting for team</span>` : "Active");
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
  const SHARE = [["stakeholder", "Stakeholder Analysis"], ["cna", "Comprehensive Needs Analysis"], ["experts", "Working with Experts"], ["kanban", "Kanban"]];
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
  /* teacher notes */
  const notesNote = document.getElementById("notesNote");
  const showNotesState = n => { notesNote.className = "note ok"; notesNote.textContent = n ? `Loaded: notes for ${n} tasks` : "No notes loaded yet"; };
  db.get("teacherNotes/experts").then(v => showNotesState(v ? Object.keys(v).length : 0)).catch(() => {});
  document.getElementById("notesLoad").addEventListener("click", async () => {
    const f = document.getElementById("notesFile").files[0];
    if (!f) { notesNote.className = "note err"; notesNote.textContent = "Choose the file first."; return; }
    try {
      const data = JSON.parse(await f.text());
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("format");
      await db.set("teacherNotes", data);
      showNotesState(Object.keys(data.experts || {}).length);
    } catch (err) { notesNote.className = "note err"; notesNote.textContent = "Not loaded: check the file and the database rules."; console.error(err); }
  });

  /* Working with Experts results */
  let results = {}, calib = {};
  const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "–";
  function renderExperts() {
    const box = document.getElementById("expertsSummary");
    const groupOf = uid => users[uid]?.group || results[uid]?.group || calib[uid]?.g || null;
    const rowsByGroup = GROUPS.map(g => {
      const ids = Object.keys(results).filter(uid => groupOf(uid) === "g" + g && !admins[uid]);
      const cell = key => {
        const items = SETS[key].items.length;
        const done = ids.map(id => results[id][key]).filter(Boolean);
        if (!done.length) return "–";
        const answered = done.reduce((a, r) => a + Object.keys(r).length, 0);
        const right = done.reduce((a, r) => a + Object.values(r).filter(x => x && x.ok).length, 0);
        return `${pct(right, answered)} <span class="muted">(${done.length} st.)</span>`;
      };
      const sjtN = ids.filter(id => results[id].sjt).length;
      const fmtN = ids.filter(id => results[id].formats).length;
      const calN = Object.keys(calib).filter(uid => groupOf(uid) === "g" + g).length;
      return `<tr><td><b>Group ${g}</b></td><td>${memberList(members["g" + g]).length || 0}</td><td>${cell("bias")}</td><td>${cell("questions")}</td><td>${sjtN || "–"}</td><td>${fmtN || "–"}</td><td>${calN || "–"}</td></tr>`;
    }).join("");

    // situational profile by group: share of picks per bias out of times offered
    const keys = Object.keys(BIAS_KEYS).filter(k => SJT.some(q => q.o.some(o => o[0] === k)));
    const sjtRows = GROUPS.map(g => {
      const picks = Object.keys(results).filter(uid => groupOf(uid) === "g" + g && results[uid].sjt).map(uid => results[uid].sjt);
      if (!picks.length) return `<tr><td><b>Group ${g}</b></td><td colspan="${keys.length + 1}" class="muted">No answers yet</td></tr>`;
      const prof = picks.map(p => sjtProfile(p));
      const bal = prof.reduce((a, p) => a + p.balanced, 0) / prof.length;
      return `<tr><td><b>Group ${g}</b> <span class="muted">(${picks.length})</span></td><td>${bal.toFixed(1)} of ${SJT.length}</td>${keys.map(k => {
        const share = prof.reduce((a, p) => a + (p.chosen[k] || 0) / p.offered[k], 0) / prof.length;
        return `<td${share >= .34 ? ' class="hot"' : ""}>${Math.round(share * 100)}%</td>`;
      }).join("")}</tr>`;
    }).join("");

    // items most often answered wrongly
    const itemStats = key => SETS[key].items.map((it, k) => {
      const answers = Object.values(results).map(r => r[key]?.[k]).filter(Boolean);
      return { label: it.text || it.term, n: answers.length, ok: answers.filter(a => a.ok).length };
    }).filter(x => x.n).sort((a, b) => a.ok / a.n - b.ok / b.n).slice(0, 4);
    const hard = ["bias", "questions"].map(key => {
      const st = itemStats(key);
      return st.length ? `<h3>${SETS[key].title}</h3><ul class="hard">${st.map(x => `<li><b>${pct(x.ok, x.n)}</b> correct (${x.n}) · ${esc(x.label.length > 140 ? x.label.slice(0, 140) + "…" : x.label)}</li>`).join("")}</ul>` : "";
    }).join("");

    // formats: how often one format was used for 3+ goals
    const fmts = Object.values(results).map(r => r.formats).filter(Boolean);
    const repeat = fmts.filter(p => Math.max(...Object.values(p.reduce((c, f) => (c[f] = (c[f] || 0) + 1, c), {}))) >= 3).length;

    // calibration
    const cal = Object.values(calib).filter(r => r && r.t);
    const calRows = CALIB.map((t, i) => {
      const can = cal.filter(r => +r.t?.[i]?.c === 2).length;
      const est = cal.map(r => r.t?.[i]?.e).filter(v => v != null).map(Number);
      return `<tr><td>${esc(t)}</td><td>${pct(can, cal.length)}</td><td>${est.length ? Math.round(est.reduce((a, b) => a + b, 0) / est.length) + "%" : "–"}</td></tr>`;
    }).join("");

    box.innerHTML = `
      <div class="scroll"><table><thead><tr><th>Team</th><th>Members</th><th>Bias identification</th><th>Interview questions</th><th>Situational test</th><th>Formats</th><th>Estimates</th></tr></thead><tbody>${rowsByGroup}</tbody></table></div>
      <p class="muted">Percentages show correct first answers. The last three columns show how many students completed the activity.</p>
      <h3>Situational judgement by group</h3>
      <p class="muted">Average number of balanced decisions, and how often students chose the option linked with each bias (out of the times it was offered). Values of 34% and above are highlighted.</p>
      <div class="scroll"><table><thead><tr><th>Team</th><th>Balanced</th>${keys.map(k => `<th>${esc(BIAS_KEYS[k])}</th>`).join("")}</tr></thead><tbody>${sjtRows}</tbody></table></div>
      ${hard ? `<h3 style="margin-top:18px">Items answered wrongly most often</h3>${hard}` : ""}
      <h3>Format selection</h3>
      <p>${fmts.length ? `${repeat} of ${fmts.length} students used one format for three or more of the five goals.` : `<span class="muted">No answers yet.</span>`}</p>
      <h3>Estimating what others know (whole course)</h3>
      ${cal.length ? `<div class="scroll"><table><thead><tr><th>Term</th><th>Students who can explain it</th><th>Average estimate</th></tr></thead><tbody>${calRows}</tbody></table></div><p class="muted">${cal.length} answers.</p>` : `<p class="muted">No answers yet.</p>`}`;
  }
  db.sub("results", v => { results = v || {}; renderExperts(); }, err => {
    document.getElementById("expertsSummary").innerHTML = `<p class="note err">Unable to read the results. Publish the new database rules.</p>`; console.error(err);
  });
  db.sub("calib", v => { calib = v || {}; renderExperts(); }, err => console.error(err));

  db.sub("admins", v => { admins = v || {}; renderStudents(); });
  db.sub("config/groups", v => { groups = v || {}; renderTeams(); renderStudents(); });
  db.sub("members", v => { members = v || {}; renderTeams(); renderExperts(); });
  db.sub("users", v => { users = v || {}; renderStudents(); renderExperts(); }, err => {
    studentRows.innerHTML = `<tr><td colspan="5" class="note err">Unable to read the student list. Check the database rules.</td></tr>`;
    console.error(err);
  });
}
