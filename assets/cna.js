// Comprehensive Needs Analysis – schema for the shared team workspace engine
import { initGroup } from "./group.js";
import { createWorkspace, sectionNav, STAGES, ROLES, T, S } from "./workspace.js";

const REG = { rows: "t3/reg", min: 10 };

const COMPONENTS = {
  "1.1": "Component 1.1: Conduct needs assessment",
  "1.2": "Component 1.2: Conduct needs research",
  "1.3": "Component 1.3: Conduct needs limitations",
  "1.4": "Component 1.4: Conduct needs analysis"
};

const DIMENSIONS = ["Background", "Prior knowledge", "Motivation", "Goals", "Digital competence", "Learning behaviour",
  "Typical difficulties", "Barriers", "Assessment experience", "Language proficiency (CEFR)", "Target language situations"];
const CEFR = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2", "Unknown"];


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
    { key: "assess", type: "assess", source: REG, stage: true, title: "B. Stakeholder assessment",
      hint: "Rate each stakeholder for the selected project stage. Scores 1–2 = low, 3 = borderline (explain why in the rationale), 4–5 = high. Support: –2 actively opposed … +2 champion." },
    { key: "plots", type: "plots", source: REG, from: "assess", title: "C. Influence and Impact Grid · Influence and Interest Matrix",
      hint: "Built automatically from your ratings. Numbers refer to the stakeholder register." },
    { key: "raci", type: "raci", source: REG, stages: true, min: 5, title: "D. RACI matrix by project stage",
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


sectionNav();
let ws = null;
const G = await initGroup({ share: "cna", onChange: () => ws && ws.onGroupChange() });
ws = createWorkspace({ G, root: "cna", title: "Comprehensive Needs Analysis", components: COMPONENTS, tasks: TASKS });
