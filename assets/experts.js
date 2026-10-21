// Working with Subject Matter Experts – schema for the shared team workspace engine
import { initGroup } from "./group.js";
import { createWorkspace, sectionNav, T, S, I } from "./workspace.js";

const COMPONENTS = {
  "1": "Stage 1 – Know your expert",
  "2": "Stage 2 – Prepare the interview",
  "3": "Stage 3 – Conduct the interview",
  "4": "Stage 4 – Turn expertise into learning content",
  "5": "Stage 5 – Handle difficult situations"
};

const BIASES = ["Curse of knowledge", "Illusion of others' competence", "Focus on exceptions",
  "Redundancy effect", "Status quo and resistance to change", "Authorship effect"];
const PARTS = ["Introduction", "Tasks", "Process", "Mistakes", "Assessment", "Examples", "Closing"];
const TECHNIQUES = ["Open question", "Action question", "Clarifying question", "Diagnostic question",
  "Case and example question", "Essentials filter question", "Assessment criteria question",
  "Real case", "Employee with an error", "Before and after", "Playing the newcomer", "Teach-back"];
const SITUATIONS = ["Does not respond or collaborate", "Gives too much information", "Refuses to adapt or shorten",
  "Does not understand the learning goal", "Criticises everything and wants to rewrite", "Other"];

const TASKS = {
  t1: { c: "1", title: "Task 1 – Expert register", parts: [
    { key: "rows", type: "rows", min: 2, cols: [
      I("Expert (name, position)", { width: "18%" }), T("Area of expertise"),
      S("Role in the project", ["Content source", "Reviewer", "Approver", "Content source and reviewer"]),
      T("Availability and preferred channel"), T("What exactly we need from this expert")] }] },

  t2: { c: "1", title: "Task 2 – Bias forecast", parts: [
    { key: "rows", type: "rows", min: 2, cols: [S("Bias", BIASES), T("Signal you expect or observed"),
      T("How you will respond"), S("Status", ["Forecast", "Observed", "Not observed"])] }] },

  t3: { c: "1", title: "Task 3 – Working agreement with the expert", parts: [
    { key: "p", type: "fixed", cols: ["Agreement element", "What you will propose"],
      rows: ["Purpose and scope of the expert's participation", "Time commitment (number and length of meetings)",
        "Review rounds and turnaround time", "Who approves the final content",
        "What the expert is not expected to do", "Communication channel and format of meeting summaries"] }] },

  t4: { c: "2", title: "Task 4 – Interview guide", parts: [
    { key: "rows", type: "rows", min: 10, cols: [S("Interview part", PARTS), T("Question", { width: "32%" }),
      S("Technique", TECHNIQUES), T("What you want to learn"), S("Priority", ["Must ask", "Ask if time allows"])] }] },

  t5: { c: "2", title: "Task 5 – Jargon translation list", parts: [
    { key: "rows", type: "rows", min: 5, cols: [T("Our professional term"), T("Plain language for the expert")] }] },

  t6: { c: "3", title: "Task 6 – Rehearsal log", parts: [
    { key: "rows", type: "rows", min: 3, cols: [
      S("Role card", ["Card A – The examiner", "Card B – The busy engineer", "Card C – The author", "Card D – The encyclopaedist"]),
      S("Your role in this round", ["Designer", "Expert", "Observer"]),
      S("Bias spotted by the observer", [...BIASES, "None"]),
      T("What worked"), T("What to change in the interview guide")] }] },

  t7: { c: "3", title: "Task 7 – Follow-up summary and action plan", parts: [
    { key: "f", type: "fields", fields: [
      { key: "meeting", label: "Date, participants and purpose of the meeting" },
      { key: "agreed", label: "Points agreed with the expert" },
      { key: "open", label: "Questions that remain open" }] },
    { key: "actions", type: "rows", min: 3, title: "Action plan", cols: [T("Action"), I("Responsible"), I("Deadline")] },
    { key: "confirm", type: "fields", fields: [
      { key: "status", label: "When was the summary sent, and when did the expert confirm or correct it?" }] }] },

  t8: { c: "4", title: "Task 8 – Knowledge statements rewritten as actions", parts: [
    { key: "rows", type: "rows", min: 3, cols: [T("What the expert said"), T("Observable action of the learner"),
      T("How we will see that the action is performed well")] }] },

  t9: { c: "4", title: "Task 9 – Content matrix", parts: [
    { key: "rows", type: "rows", min: 3, cols: [
      T("Target action"), T("Knowledge and language needed"), T("Steps"), T("Typical mistakes"),
      T("Good versus poor result"), T("Cases, examples and materials"),
      S("Priority", ["Core", "Practice later", "Reference only"])] }] },

  t10: { c: "5", title: "Task 10 – Response plan for difficult situations", parts: [
    { key: "rows", type: "rows", min: 3, cols: [S("Situation", SITUATIONS), T("What you will say (exact phrases)"),
      T("What you will do or send")] }] },

  t11: { c: "5", title: "Task 11 – Review request for the expert", parts: [
    { key: "p", type: "fixed", cols: ["Element of the request", "Your text"],
      rows: ["What is sent for review and in which form", "What is outside the scope of this review",
        "Specific questions the expert must answer", "Deadline and format of comments",
        "How comments will be documented and resolved"] }] }
};

sectionNav();
let ws = null;
const G = await initGroup({ share: "experts", onChange: () => ws && ws.onGroupChange() });
ws = createWorkspace({ G, root: "experts", title: "Working with Experts", components: COMPONENTS, tasks: TASKS });
