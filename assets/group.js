// Session layer shared by all pages: sign-in gate, course code, waiting for team assignment,
// assignment, group bar, connection status and the group profile.
import { connect, authMessage, todayISO } from "./db.js";

export const GROUPS = ["1", "2", "3", "4", "5"];
// university addresses only: name@misis.ru and subdomains such as name@edu.misis.ru
const MISIS_EMAIL = /@([a-z0-9-]+\.)*misis\.ru$/i;
const STORE_KEY = "stakeholdersAdminGroup";

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// names of group members: accepts the members object {uid: name}
export function memberList(members) {
  return Object.values(members || {}).map(v => String(v || "").trim()).filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

/* ---------------- status pill ---------------- */

export const status = {
  el: null,
  set(mode, text) {
    if (!this.el) return;
    this.el.className = "sync-pill " + mode;
    this.el.querySelector("span:last-child").textContent = text;
  },
  online() { this.set("online", "Connected · changes save automatically"); },
  saving() { this.set("online", "Saving…"); },
  saved() { this.set("online", "All changes saved"); },
  offline() { this.set("error", "Offline · changes will sync when the connection returns"); },
  error(t) { this.set("error", t); }
};

/* ---------------- sign-in gate ---------------- */

const gate = {
  el: null,
  mount() {
    document.body.classList.add("locked");
    this.el = document.createElement("div");
    this.el.id = "authGate";
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-modal", "true");
    document.body.appendChild(this.el);
  },
  show(html) {
    this.el.innerHTML = `<div class="gate-card"><div class="gate-brand">Stakeholder Communication</div>${html}</div>`;
    const first = this.el.querySelector("input,button");
    if (first) first.focus();
  },
  close() {
    this.el.remove();
    document.body.classList.remove("locked");
  },
  msg(text, ok = false) {
    const m = this.el.querySelector(".gate-msg");
    if (m) { m.textContent = text; m.classList.toggle("ok", ok); }
  },
  busy(on) {
    this.el.querySelectorAll("button,input").forEach(b => { b.disabled = on; });
  }
};

function field(name, label, type = "text", extra = "") {
  return `<label class="gate-field"><span class="field-label">${label}</span><input name="${name}" type="${type}" ${extra}></label>`;
}

function form(el) {
  return Object.fromEntries([...el.querySelectorAll("input")].map(i => [i.name, i.type === "radio" ? undefined : i.value.trim()]).filter(([, v]) => v !== undefined));
}

/* ---------------- session ---------------- */

export async function initGroup({ onChange, profile = true } = {}) {
  gate.mount();

  if (location.protocol === "file:") {
    gate.show(`<h2>Open the site through its web address</h2>
      <p>This page was opened directly from a file on the computer, so sign-in and the group workspace cannot work.
      Open the published website, or in Visual Studio Code use <b>Go Live</b> (Live Server extension).</p>`);
    return new Promise(() => {});
  }

  let db;
  try { db = await connect(); }
  catch (err) {
    console.error(err);
    gate.show(`<h2>No connection</h2><p>The site could not connect to the database. Check your internet connection and reload the page.</p>`);
    return new Promise(() => {});
  }

  const ctx = await new Promise(resolve => runGate(db, resolve));
  gate.close();
  return startSession(db, ctx, { onChange, profile });
}

function runGate(db, resolve) {
  let pending = null;       // {name, code} typed during sign-up
  let current = null;
  let finished = false;

  const views = {
    signin() {
      gate.show(`<h2>Sign in</h2>
        <form class="gate-form" novalidate>
          ${field("email", "Email", "email", 'autocomplete="email" required')}
          ${field("password", "Password", "password", 'autocomplete="current-password" required')}
          <button class="gate-btn" type="submit">Sign in</button>
          <div class="gate-msg" role="alert"></div>
        </form>
        <div class="gate-links"><button type="button" data-go="signup">Create an account</button><button type="button" data-go="reset">Forgot password?</button></div>`);
      onSubmit(async f => {
        const v = form(f);
        if (!v.email || !v.password) return gate.msg("Enter your email and password.");
        await db.auth.signIn(v.email, v.password);
      });
    },
    signup() {
      gate.show(`<h2>Create an account</h2>
        <p>You need the course code from your teacher.</p>
        <form class="gate-form" novalidate>
          ${field("name", "First and last name", "text", 'autocomplete="name" maxlength="80" required')}
          ${field("email", "University email (@misis.ru)", "email", 'autocomplete="email" required')}
          ${field("password", "Password (at least 6 characters)", "password", 'autocomplete="new-password" required')}
          ${field("code", "Course code", "text", 'autocomplete="off" required')}
          <button class="gate-btn" type="submit">Create account</button>
          <div class="gate-msg" role="alert"></div>
        </form>
        <div class="gate-links"><button type="button" data-go="signin">I already have an account</button></div>`);
      onSubmit(async f => {
        const v = form(f);
        if (!v.name || !v.email || !v.password || !v.code) return gate.msg("Fill in all fields.");
        if (!MISIS_EMAIL.test(v.email)) return gate.msg("Use your university email ending in @misis.ru.");
        if (v.password.length < 6) return gate.msg("The password must contain at least 6 characters.");
        pending = { name: v.name, code: v.code };
        await db.auth.signUp(v.email, v.password);
      });
    },
    reset() {
      gate.show(`<h2>Reset your password</h2>
        <p>We will send a link to reset your password to this email.</p>
        <form class="gate-form" novalidate>
          ${field("email", "Email", "email", 'autocomplete="email" required')}
          <button class="gate-btn" type="submit">Send link</button>
          <div class="gate-msg" role="alert"></div>
        </form>
        <div class="gate-links"><button type="button" data-go="signin">Back to sign in</button></div>`);
      onSubmit(async f => {
        const v = form(f);
        if (!v.email) return gate.msg("Enter your email.");
        await db.auth.reset(v.email);
        gate.msg("If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.", true);
      });
    },
    code(user, rec, error) {
      gate.show(`<h2>Enter the course code</h2>
        <p>Your account is created, but it is not yet connected to the course.</p>
        <form class="gate-form" novalidate>
          ${field("name", "First and last name", "text", `maxlength="80" value="${esc(rec?.name || "")}"`)}
          ${field("code", "Course code", "text", 'autocomplete="off"')}
          <button class="gate-btn" type="submit">Continue</button>
          <div class="gate-msg" role="alert">${esc(error || "")}</div>
        </form>
        <p class="gate-note gate-id">Signed in as ${esc(user.email)}<br>Account ID (UID): <code>${esc(user.uid)}</code></p>
        <div class="gate-links"><button type="button" data-act="signout">Sign out</button></div>`);
      onSubmit(async f => {
        const v = form(f);
        if (!v.name || !v.code) return gate.msg("Fill in both fields.");
        await registerUser(user, v.name, v.code);
        await route(user);
      });
    },
    waiting(user, rec) {
      gate.show(`<h2>Waiting for your team</h2>
        <p>Your account is ready, ${esc(rec?.name || "")}. Your teacher will now add you to a project team.</p>
        <p class="gate-note">This page opens automatically as soon as you are assigned. You can also close it and sign in later.</p>
        <div class="gate-links"><button type="button" data-act="reload">Check again</button><button type="button" data-act="signout">Sign out</button></div>`);
      // open the site as soon as the teacher assigns a team
      const stop = db.sub(`users/${user.uid}/group`, g => {
        if (g) { stop && stop(); route(user); }
      }, () => {});
    }
  };

  function onSubmit(fn) {
    const f = gate.el.querySelector("form");
    f.addEventListener("submit", async e => {
      e.preventDefault();
      gate.msg("");
      gate.busy(true);
      try { await fn(f); }
      catch (err) { console.error(err); gate.msg(err.userMessage || authMessage(err)); }
      finally { if (gate.el.isConnected) gate.busy(false); }
    });
  }

  gate.el.addEventListener("click", async e => {
    const go = e.target.closest("[data-go]");
    if (go) return views[go.dataset.go]();
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "signout") { await db.auth.signOut(); location.reload(); }
    if (act === "reload") location.reload();
  });

  async function registerUser(user, name, code) {
    await db.update(`users/${user.uid}`, { name, email: user.email, createdAt: todayISO() });
    try { await db.set(`users/${user.uid}/joinCode`, code); }
    catch (err) {
      const e = new Error("bad code");
      e.userMessage = MISIS_EMAIL.test(user.email || "")
        ? "The course code is incorrect. Check it with your teacher."
        : "Registration is open only for university email addresses ending in @misis.ru. Sign out and create an account with your university email.";
      throw e;
    }
  }

  async function route(user) {
    if (finished) return;
    const isAdmin = (await db.get(`admins/${user.uid}`)) != null;
    let rec = (await db.get(`users/${user.uid}`)) || {};
    if (!isAdmin && !rec.joinCode) {
      if (pending) {
        const p = pending;
        pending = null;
        try { await registerUser(user, p.name, p.code); rec = (await db.get(`users/${user.uid}`)) || {}; }
        catch (err) { return views.code(user, { name: p.name }, err.userMessage || authMessage(err)); }
      } else {
        return views.code(user, rec);
      }
    }
    if (!isAdmin && !rec.group) return views.waiting(user, rec);
    // self-heal: make sure the member entry exists
    if (!isAdmin && rec.group) {
      const m = await db.get(`members/${rec.group}/${user.uid}`);
      if (!m) await db.set(`members/${rec.group}/${user.uid}`, rec.name || user.email);
    }
    finished = true;
    resolve({ user, rec, isAdmin });
  }

  db.auth.onChange(async user => {
    if (finished) { if (!user) location.reload(); return; }
    current = user;
    if (!user) return views.signin();
    gate.show(`<h2>Signing in…</h2>`);
    try { await route(user); }
    catch (err) {
      console.error(err);
      gate.show(`<h2>Access problem</h2><p>${esc(authMessage(err))}</p>
        <div class="gate-links"><button type="button" data-act="reload">Try again</button><button type="button" data-act="signout">Sign out</button></div>`);
    }
  });
}

/* ---------------- after sign-in ---------------- */

export const PROFILE_FIELDS = [
  { key: "name", label: "Group name", placeholder: "e.g. LXD Studio" },
  { key: "clientOrg", label: "Client organisation (internship site)", placeholder: "Organisation or unit" },
  { key: "clientContact", label: "Client contact", placeholder: "Name and position of the client representative" }
];

async function startSession(db, { user, rec, isAdmin }, { onChange, profile }) {
  const bar = document.getElementById("groupBar");
  const configGroups = (await db.get("config/groups")) || {};
  let current = isAdmin ? adminGroup() : rec.group.slice(1);

  bar.innerHTML = `
    <div class="group-bar-inner">
      <span class="group-bar-label">${isAdmin ? "Teacher view" : "Your team"}</span>
      ${isAdmin
        ? `<div class="group-switch" role="tablist">${GROUPS.map(g => `<button type="button" role="tab" data-g="${g}">Group ${g}</button>`).join("")}</div>`
        : `<span class="team-name" id="teamName"></span>`}
      <span class="team-members" id="teamMembers"></span>
      <span class="sync-pill" id="syncPill"><span class="sync-dot"></span><span>Connecting…</span></span>
      <span class="user-box">${esc(rec.name || user.email)}${isAdmin ? ` · <a href="admin.html">Admin</a>` : ""} · <button type="button" id="signOutBtn">Sign out</button></span>
    </div>`;
  status.el = bar.querySelector("#syncPill");
  bar.querySelector("#signOutBtn").addEventListener("click", async () => { await db.auth.signOut(); location.reload(); });
  db.onConnection && db.onConnection(ok => ok ? status.online() : status.offline());

  const profileBox = profile ? document.getElementById("groupProfile") : null;
  const inputs = {};
  if (profileBox) {
    profileBox.innerHTML = `
      <div class="profile-head">
        <h2>Group <span class="pg-no"></span> profile</h2>
        <p>Fill this in once. It appears in the header of every PDF your group exports.</p>
      </div>
      <div class="profile-grid">
        ${PROFILE_FIELDS.map(f => `
          <label class="pf"><span class="field-label">${f.label}</span>
          <input type="text" data-key="${f.key}" placeholder="${esc(f.placeholder)}" maxlength="300"></label>`).join("")}
        <div class="pf wide"><span class="field-label">Group members</span><div class="pf-members"></div></div>
      </div>`;
    profileBox.querySelectorAll("input").forEach(i => { inputs[i.dataset.key] = i; });
    Object.entries(inputs).forEach(([k, inp]) => {
      inp.addEventListener("input", () => {
        clearTimeout(inp._t);
        inp.dataset.dirty = "1";
        status.saving();
        inp._t = setTimeout(async () => {
          try { await db.set(`groups/g${current}/profile/${k}`, inp.value.trim() ? inp.value : null); status.saved(); }
          catch (err) { status.error("Unable to save"); console.error(err); }
          delete inp.dataset.dirty;
        }, 400);
      });
    });
  }

  const api = {
    db, user, isAdmin,
    name: rec.name || user.email,
    get group() { return current; },
    get company() { return String(configGroups["g" + current]?.company || ""); },
    profile: {},
    members: {},
    memberNames() { return memberList(this.members); },
    _p: [], _m: [],
    onProfile(cb) { this._p.push(cb); },
    onMembers(cb) { this._m.push(cb); }
  };

  let unsubs = [];
  function select(g) {
    current = g;
    if (isAdmin) {
      try { localStorage.setItem(STORE_KEY, g); } catch (e) {}
      const url = new URL(location.href);
      url.searchParams.set("group", g);
      history.replaceState(null, "", url);
      bar.querySelectorAll("[data-g]").forEach(b => b.classList.toggle("active", b.dataset.g === g));
    } else {
      bar.querySelector("#teamName").textContent = `Group ${g}${api.company ? " · " + api.company : ""}`;
    }
    unsubs.forEach(u => u && u());
    api.profile = {};
    api.members = {};
    if (profileBox) {
      profileBox.querySelector(".pg-no").textContent = g;
      Object.values(inputs).forEach(i => { i.value = ""; });
      inputs.clientOrg.placeholder = api.company || "Organisation or unit";
    }
    unsubs = [
      db.sub(`groups/g${g}/profile`, val => {
        api.profile = val || {};
        Object.entries(inputs).forEach(([k, inp]) => {
          if (document.activeElement !== inp && !inp.dataset.dirty) inp.value = api.profile[k] ?? "";
        });
        api._p.forEach(cb => cb(api.profile));
      }, err => { status.error("Unable to read group data"); console.error(err); }),
      db.sub(`members/g${g}`, val => {
        api.members = val || {};
        const names = memberList(api.members);
        bar.querySelector("#teamMembers").textContent = names.length ? names.join(", ") : "";
        if (profileBox) profileBox.querySelector(".pf-members").innerHTML =
          names.length ? names.map(n => `<span class="chip">${esc(n)}</span>`).join(" ") : `<span class="muted">No members yet</span>`;
        api._m.forEach(cb => cb(api.members));
      }, err => console.error(err))
    ];
    onChange && onChange(g);
  }

  if (isAdmin) bar.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.g !== current) select(b.dataset.g);
  }));
  select(current);
  return api;
}

function adminGroup() {
  const fromUrl = new URLSearchParams(location.search).get("group");
  if (GROUPS.includes(fromUrl)) return fromUrl;
  try { const v = localStorage.getItem(STORE_KEY); if (GROUPS.includes(v)) return v; } catch (e) {}
  return "1";
}
