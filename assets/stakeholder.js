// Stakeholder Analysis – team workspace schema (cases 1–5 and the integrated case)
import { initGroup } from "./group.js";
import { createWorkspace, sectionNav, ROLES, T, S, I } from "./workspace.js";

const COMPONENTS = {
  s1: "Case 1 – AI Writing Assistant",
  s2: "Case 2 – Digital Assessment Reform",
  s3: "Influence and Impact Grid – AI Writing Assistant",
  s4: "Case 3 – Learning Analytics System",
  s5: "Case 4 – Mandatory LMS Transition",
  s6: "Case 5 – Blended Master's Course (RACI)",
  s7: "Integrated case – AI Supported Online Master's Programme",
  all: "Stakeholder Analysis – all cases"
};

const IO = ["Internal", "External"];
const REG7 = { rows: "s7/reg", min: 12 };

const TASKS = {
  s1: { c: "s1", title: COMPONENTS.s1, parts: [
    { key: "reg", type: "rows", min: 10, title: "Stakeholders",
      cols: [I("Stakeholder", { width: "24%" }), S("Internal / external", IO), T("How the stakeholder can affect the project or be affected by it")] },
    { key: "disc", type: "fields", title: "Discussion", fields: [
      { key: "overlook", label: "Which stakeholder is easiest to overlook?" },
      { key: "risk", label: "Which stakeholder can create the greatest implementation risk?" },
      { key: "users", label: "Is every user automatically a key stakeholder?" }] }] },

  s2: { c: "s2", title: COMPONENTS.s2, parts: [
    { key: "reg", type: "rows", min: 12, title: "Stakeholders by role",
      cols: [I("Stakeholder", { width: "26%" }), S("Role group", ROLES), T("Why this stakeholder matters")] },
    { key: "f", type: "fields", fields: [
      { key: "missed", label: "Which stakeholder might another group have missed?" },
      { key: "oppose", label: "Which stakeholder might oppose the change even if the expected learning outcomes improve?" },
      { key: "info", label: "Which stakeholder has information that the project team cannot easily obtain elsewhere?" },
      { key: "later", label: "Which stakeholder becomes more important during implementation than during planning?" }] }] },

  s3: { c: "s3", title: COMPONENTS.s3, parts: [
    { key: "assess", type: "assess", dims: ["inf", "imp"],
      source: { list: ["Students", "Teachers", "Programme director", "IT department", "AI provider", "Legal department", "Instructional designers", "Academic integrity committee"] },
      title: "Rate influence and impact", hint: "1–2 = low, 3 = borderline (explain in the rationale), 4–5 = high. The grid below is drawn from your ratings." },
    { key: "plots", type: "plots", from: "assess", charts: ["impact"], summary: false,
      source: { list: ["Students", "Teachers", "Programme director", "IT department", "AI provider", "Legal department", "Instructional designers", "Academic integrity committee"] } },
    { key: "f", type: "fields", fields: [
      { key: "q1", label: "Who has high influence but relatively low direct impact?" },
      { key: "q2", label: "Who experiences high impact but has limited formal influence?" },
      { key: "q3", label: "Which group needs special communication and consultation?" },
      { key: "q4", label: "What risk appears if the team communicates only with high influence stakeholders?" }] }] },

  s4: { c: "s4", title: COMPONENTS.s4, parts: [
    { key: "assess", type: "assess", dims: ["inf", "int"], source: { list: L3() },
      title: "Rate influence and interest", hint: "The matrix and the engagement strategy for each stakeholder are produced automatically." },
    { key: "plots", type: "plots", from: "assess", charts: ["interest"], source: { list: L3() } },
    { key: "f", type: "fields", fields: [
      { key: "justify", label: "Justify two placements that another group could reasonably challenge." }] }] },

  s5: { c: "s5", title: COMPONENTS.s5, parts: [
    { key: "assess", type: "assess", dims: ["inf", "int", "cur", "des"], source: { list: L4() },
      title: "Influence, interest and support", hint: "Support: –2 actively opposed, –1 resistant, 0 neutral, +1 supportive, +2 champion. Desired support = the level needed for successful implementation." },
    { key: "plots", type: "plots", from: "assess", charts: [], source: { list: L4() } },
    { key: "f", type: "fields", fields: [
      { key: "risk", label: "Which stakeholder represents the greatest implementation risk, and how would you start working with them?" }] }] },

  s6: { c: "s6", title: COMPONENTS.s6, parts: [
    { key: "raci", type: "raci", source: { list: L5() },
      tasks: ["Analyse learner requirements", "Design course structure", "Create learning materials", "Configure Moodle", "Conduct usability testing", "Approve the course", "Launch the course"],
      title: "RACI matrix", hint: "Choose R, A, C or I for each role. Each task should have exactly one A and at least one R." },
    { key: "f", type: "fields", fields: [
      { key: "gaps", label: "Identify at least two places where unclear responsibility could cause delay, conflict or duplicated work." },
      { key: "consult", label: "When does consultation become excessive and slow down decisions?" },
      { key: "ci", label: "What is the practical difference between being Consulted and being Informed?" }] }] },

  s7: { c: "s7", title: COMPONENTS.s7, parts: [
    { key: "reg", type: "rows", min: 12, title: "Stages 1–2. Identification and mapping",
      cols: [I("Stakeholder", { width: "26%" }), S("Internal / external", IO), S("Role group", ROLES)] },
    { key: "assess", type: "assess", source: REG7, title: "Stages 3–5. Influence, impact, interest and support",
      hint: "Rate at least eight stakeholders on influence and impact, all of them on interest, and six key stakeholders on support. Leave the rest blank." },
    { key: "plots", type: "plots", from: "assess", source: REG7, title: "Matrices and engagement strategies", hint: "Built automatically from your ratings." },
    { key: "raci", type: "raci", source: REG7, title: "Stage 6. RACI",
      tasks: ["Course design", "LMS implementation", "AI integration", "Pilot testing", "Final launch approval"] },
    { key: "comms", type: "rows", min: 3, title: "Stage 7. Communication decisions for three difficult stakeholder groups",
      cols: [I("Stakeholder group"), T("What do they need to know?"), T("What does the team need from them?"), T("Channel"), T("Frequency"), T("Who communicates?")] }] }
};

function L3() { return ["Students", "Teachers", "Programme director", "University administration", "IT department", "Data protection officer", "Instructional designers", "LMS provider", "Student support service", "Parents", "Accreditation agency"]; }
function L4() { return ["University administration", "Teachers", "Students", "Instructional designers", "IT department"]; }
function L5() { return ["Programme director", "Teacher", "Instructional designer", "Media designer", "LMS administrator", "IT support", "Students", "Quality assurance specialist"]; }

// "Show analysis prompt" buttons
document.querySelectorAll("button.check").forEach(btn => btn.addEventListener("click", () => {
  const el = document.getElementById(btn.dataset.target);
  const open = el.style.display === "block";
  el.style.display = open ? "none" : "block";
  btn.textContent = open ? "Show analysis prompt" : "Hide analysis prompt";
}));

sectionNav();
let ws = null;
const G = await initGroup({ profile: false, share: "stakeholder", onChange: () => ws && ws.onGroupChange() });
ws = createWorkspace({ G, root: "stakeholder", title: "Stakeholder Analysis", components: COMPONENTS, tasks: TASKS });
