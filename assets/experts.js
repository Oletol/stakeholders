// Working with Subject Matter Experts – schema for the shared team workspace engine
import { initGroup, esc } from "./group.js";
import { createWorkspace, sectionNav, T, S, I } from "./workspace.js";
import { initExercises } from "./exercises.js";

const COMPONENTS = {
  "1": "Stage 1 – Know your expert",
  "2": "Stage 2 – Prepare the interview",
  "3": "Stage 3 – Conduct the interview",
  "4": "Stage 4 – Turn expertise into learning content",
  "5": "Stage 5 – Handle difficult situations"
};

const PARTS = ["Introduction", "Tasks", "Process", "Mistakes", "Assessment", "Examples", "Closing"];
// question types = the seven groups of the question bank; techniques = the four techniques on the page
const TECHNIQUES = ["Open-ended question", "Action question", "Clarifying question", "Diagnostic question",
  "Case and context question", "Essentials question", "Assessment criteria question",
  "Real case", "Employee with an error", "Before and after", "Playing the newcomer"];

const MISTAKES = [
  "Taking the task literally, without clarifying details",
  "Not defining success criteria",
  "Speaking in designer jargon",
  "Agreeing on everything verbally",
  "Giving the expert too much freedom",
  "Letting the expert dictate the methodology",
  "Doing everything turnkey, without distributing roles"
];

const STATEMENTS = [
  "Students should understand the structure of a business email.",
  "Engineers must know the vocabulary of safety procedures.",
  "They need to be familiar with the main types of contracts.",
  "Learners should have a good grasp of the Present Perfect.",
  "It is important that they know the rules of meeting etiquette.",
  "They must be aware of cultural differences in negotiations.",
  "Students should understand how the exam is marked.",
  "They need a solid theoretical basis in phonetics before any speaking practice."
];

// Task keys are kept from the first version of the page so that saved answers are not lost.
const TASKS = {
  t1: { c: "1", title: "Task 1 – Expert register", parts: [
    { key: "rows", type: "rows", min: 2, cols: [
      I("Expert (name, position)", { width: "18%" }), T("Area of expertise"),
      S("Role in the project", ["Content source", "Reviewer", "Approver", "Content source and reviewer"]),
      T("Availability and preferred channel"), T("What exactly we need from this expert")] }] },

  t3: { c: "1", title: "Task 2 – Working agreement with the expert", parts: [
    { key: "p", type: "fixed", cols: ["Agreement element", "What you will propose"],
      rows: ["Purpose and scope of the expert's participation", "Time commitment (number and length of meetings)",
        "Review rounds and turnaround time", "Who approves the final content",
        "What the expert is not expected to do", "Communication channel and format of meeting summaries"] }] },

  t12: { c: "1", title: "Task 3 – Typical designer mistakes", parts: [
    { key: "p", type: "fixed", cols: ["Mistake", "Why is it a mistake?", "How would you fix it?"],
      rows: MISTAKES, fields: [{ kind: "textarea" }, { kind: "textarea" }] }] },

  t4: { c: "2", title: "Task 4 – Interview guide", parts: [
    { key: "rows", type: "rows", min: 10, cols: [S("Interview part", PARTS), T("Question", { width: "32%" }),
      S("Question type or technique", TECHNIQUES), T("What you want to learn"), S("Priority", ["Must ask", "Ask if time allows"])] }] },

  t5: { c: "2", title: "Task 5 – Jargon translation list", parts: [
    { key: "rows", type: "rows", min: 5, cols: [T("Our professional term"), T("Plain language for the expert")] }] },

  t7: { c: "3", title: "Task 6 – Follow-up summary and action plan", parts: [
    { key: "f", type: "fields", fields: [
      { key: "meeting", label: "Date, participants and purpose of the meeting" },
      { key: "agreed", label: "Points agreed with the expert" },
      { key: "open", label: "Questions that remain open" }] },
    { key: "actions", type: "rows", min: 3, title: "Action plan", cols: [T("Action"), I("Responsible"), I("Deadline")] },
    { key: "confirm", type: "fields", fields: [
      { key: "status", label: "When was the summary sent, and when did the expert confirm or correct it?" }] }] },

  t8: { c: "4", title: "Task 7 – Expert statements reformulated as learner actions", parts: [
    { key: "re", type: "fixed", cols: ["What the expert said", "Reformulation for the design team"], rows: STATEMENTS }] },

  t11: { c: "5", title: "Task 8 – Review request for the expert", parts: [
    { key: "p", type: "fixed", cols: ["Element of the request", "Your text"],
      rows: ["What is sent for review and in which form", "What is outside the scope of this review",
        "Specific questions the expert must answer", "Deadline and format of comments",
        "How comments will be documented and resolved"] }] }
};

/* Teacher notes: stored in the database under teacherNotes/experts, readable only by the teacher.
   Loaded through the Teacher panel from a JSON file that is not published on the website. */
function noteHTML(text) {
  let html = "", list = false;
  String(text).split("\n").forEach(l => {
    const t = l.trim();
    if (t.startsWith("- ")) { if (!list) { html += "<ul>"; list = true; } html += `<li>${esc(t.slice(2))}</li>`; return; }
    if (list) { html += "</ul>"; list = false; }
    if (t) html += `<p>${esc(t)}</p>`;
  });
  return html + (list ? "</ul>" : "");
}
async function showTeacherNotes(G) {
  if (!G.isAdmin) return;
  let notes = null;
  try { notes = await G.db.get("teacherNotes/experts"); } catch (e) { console.warn(e); }
  if (!notes) {
    const first = document.querySelector("#overview .callout");
    first && first.insertAdjacentHTML("afterend", `<div class="teacher-note"><b>Teacher notes</b><p>No teacher notes are loaded yet. Load the file teacher_notes.json in the Teacher panel.</p></div>`);
    return;
  }
  document.querySelectorAll(".ws[data-task], .ex[data-exercise]").forEach(h => {
    const key = h.dataset.task || h.dataset.exercise;
    if (notes[key]) h.insertAdjacentHTML("afterend", `<div class="teacher-note"><b>Teacher notes · not visible to students</b>${noteHTML(notes[key])}</div>`);
  });
}

sectionNav();
let ws = null;
const G = await initGroup({ share: "experts", onChange: () => ws && ws.onGroupChange() });
ws = createWorkspace({ G, root: "experts", title: "Working with Experts", components: COMPONENTS, tasks: TASKS });
initExercises(G);
showTeacherNotes(G);
