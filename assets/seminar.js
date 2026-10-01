// Stakeholder Analysis page: section navigation, hint buttons and the live seminar workspace
import { initGroup, status } from "./group.js";

const links = [...document.querySelectorAll("#topnav a")];
const sections = links.map(a => document.querySelector(a.getAttribute("href")));
function updateActive() {
  let index = 0;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= 110) index = i; });
  links.forEach((a, i) => a.classList.toggle("active", i === index));
}
document.addEventListener("scroll", updateActive, { passive: true });
updateActive();

document.querySelectorAll("button.check").forEach(btn => {
  btn.addEventListener("click", () => {
    const el = document.getElementById(btn.dataset.target);
    const open = el.style.display === "block";
    el.style.display = open ? "none" : "block";
    btn.textContent = open ? "Show analysis prompt" : "Hide analysis prompt";
  });
});

const G = await initGroup({ profile: false });
const fields = [...document.querySelectorAll(".group-textarea")];

fields.forEach(field => {
  const key = field.dataset.group;              // group1 … group5
  const no = key.replace("group", "");
  const card = field.closest(".group-card");
  const state = document.getElementById(`state-${key}`);
  const mine = G.isAdmin || G.group === no;

  if (G.group === no && !G.isAdmin) {
    card.classList.add("mine");
    card.querySelector("h3").insertAdjacentHTML("beforeend", `<span class="mine-tag">Your group</span>`);
  }
  if (!mine) {
    field.readOnly = true;
    field.placeholder = "This group has not written anything yet.";
  }

  let timer;
  G.db.sub(`seminarWorkspace/${key}/text`, val => {
    const remote = val ?? "";
    if (document.activeElement !== field && !field.dataset.dirty && field.value !== remote) field.value = remote;
    state.textContent = mine ? "Live" : "Read only";
  }, err => { state.textContent = "Unable to read"; console.error(err); });

  if (!mine) return;
  field.addEventListener("input", () => {
    field.dataset.dirty = "1";
    state.textContent = "Saving…";
    status.saving();
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await G.db.update(`seminarWorkspace/${key}`, { text: field.value, updatedAt: Date.now() });
        state.textContent = "Saved and live";
        status.saved();
      } catch (err) {
        state.textContent = "Save failed";
        status.error("Unable to save");
        console.error(err);
      }
      delete field.dataset.dirty;
    }, 400);
  });
});
