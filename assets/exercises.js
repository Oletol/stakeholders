// Interactive exercises and self-assessment for the Working with Experts page.
// Hosts: <div class="ex" data-exercise="bias|questions|jargon|sjt|formats|calib"></div>
// Results are saved per student under results/<uid> (first attempt only) and calib/<uid>;
// the teacher sees a summary by group in the Teacher panel. Exported data is reused there.

export const BIAS_KEYS = {
  curse: "Curse of knowledge",
  illusion: "Illusion of others' competence",
  under: "Underestimation of learners",
  exceptions: "Focus on exceptions",
  redundancy: "Redundancy effect",
  status: "Status quo and resistance to change",
  instrument: "Law of the instrument",
  authorship: "Authorship effect",
  effort: "Effort justification"
};
const BIASES = Object.values(BIAS_KEYS);

/* =============================== check-type exercises =============================== */
export const SETS = {
  bias: {
    title: "Identification of expert biases",
    mode: "select",
    order: [0, 1, 3, 6, 4, 2, 9, 5, 8, 11, 7, 10],
    prompt: "Which bias does this behaviour show most clearly?",
    options: BIASES,
    items: [
      { text: "In a meeting about an exam writing course, the examiner says the planning stage “takes no time at all, you just see the structure” and moves straight on to the marking criteria.",
        answer: "Curse of knowledge",
        why: "Planning has become automatic for the expert, so the steps are invisible to them. Ask the expert to plan an answer aloud or to describe how a weak candidate plans." },
      { text: "The head of an engineering department wants the course to open with negotiation role plays, because “all our graduates have B2 anyway”. Your CNA questionnaire shows that most learners assess themselves at A2 or B1.",
        answer: "Illusion of others' competence",
        why: "The expert overestimates what learners already know. Your best argument is evidence from the CNA, not opinion." },
      { text: "For a B1 group, the expert proposes a two-hour theoretical introduction to the whole tense system “because otherwise they will not understand anything”, and asks you to replace authentic emails with short invented sentences.",
        answer: "Underestimation of learners",
        why: "This is the mirror image of the illusion of others’ competence. The expert thinks the material is too hard, so over-explains theory and oversimplifies practice. Pilot one authentic task with real learners and show the expert the result." },
      { text: "Asked about typical problems in technical meetings, the expert spends twenty minutes on a single incident when a contractor misread a safety instruction and the site was closed for a week.",
        answer: "Focus on exceptions",
        why: "A dramatic rare case is memorable, but it is not typical. Ask “How often does this happen?” and “What happens in an ordinary meeting?”" },
      { text: "The expert sends a 90-page document with the history of the standard, all amendments and commentaries, and asks you to put it into Module 1 “so that nothing is lost”.",
        answer: "Redundancy effect",
        why: "Everything is relevant for the expert, but extra information overloads learners. Offer a place for it in reference materials and agree on what is core." },
      { text: "After seeing a mock-up of a short interactive scenario, the expert says the weekly face-to-face lectures have received good feedback for ten years, so there is no reason to change the format.",
        answer: "Status quo and resistance to change",
        why: "The expert defends the current way of doing things rather than a specific method. A small pilot or a comparable case usually works better than argument." },
      { text: "The expert has accepted the move online with enthusiasm. However, every module they propose turns out to be a webinar, whether the goal is listening, small talk or report writing, “because webinars are what works”.",
        answer: "Law of the instrument",
        why: "This is not resistance to change: the expert accepted the new format. The problem is that one familiar tool is applied to every goal. Start from the target action and ask which method fits it." },
      { text: "Whatever the learning goal, the expert suggests the same sequence: translate a text, learn a word list, write a vocabulary test. “It has always worked with my students.”",
        answer: "Law of the instrument",
        why: "The same method is used for very different goals. Compare with the status quo bias: here the expert is not defending a particular course, but a universal tool." },
      { text: "You suggest splitting the expert’s long explanation into three short screens with a practice task in between. The expert agrees that learners need practice, but refuses to cut “a single paragraph of what I wrote”.",
        answer: "Authorship effect",
        why: "The expert accepts the design logic but is attached to their own text. Keep the full text in reference materials and show how the short version serves the learning goal." },
      { text: "The expert objects to a glossary with ready-made collocations. “I collected my vocabulary from original contracts for years. They should read the originals and build their own lists, otherwise nothing will stick.”",
        answer: "Effort justification",
        why: "The expert values the path because it cost them a lot of effort and believes learners must repeat it. Separate the goal from the path, then show a shorter route to the same result." },
      { text: "“I spent two years learning the Latin terminology by heart, and that is what made me a professional. Let’s put it into the first week.”",
        answer: "Effort justification",
        why: "This may look like redundancy, but the argument is about the value of effort, not about completeness. Ask which tasks require this terminology, and when." },
      { text: "The expert writes the instructions for a speaking task: “Discuss the case using the standard framework and the usual register.” They are surprised when your pilot learners ask which framework and which register.",
        answer: "Curse of knowledge",
        why: "Terms that are obvious to the expert are not obvious to learners. The pilot made the problem visible. Ask the expert to give an example of a good answer." }
    ]
  },

  questions: {
    title: "Interview questions",
    mode: "select",
    prompt: "What, if anything, is wrong with this question for an interview with an expert?",
    options: ["Too broad", "Asks about knowledge, not action", "Designer jargon", "Yes or no question",
      "Leading question", "Two questions in one", "No problem, this question works"],
    reveal: "A possible improvement",
    items: [
      { text: "Could you tell us everything about technical meetings in English?", answer: "Too broad",
        why: "The expert will give a lecture, not data you can use.",
        fix: "Think of the last meeting where a junior engineer struggled in English. What exactly happened?" },
      { text: "What should learners know about formal letters?", answer: "Asks about knowledge, not action",
        why: "You will get a list of rules, not a picture of competent performance.",
        fix: "What must a learner be able to write after the course, and how will you see that the letter is good enough?" },
      { text: "Which learning outcomes should we align with the formative assessment?", answer: "Designer jargon",
        why: "The expert has to guess what you mean, or pretends to understand.",
        fix: "How do you usually check during the course that a student is on the right track?" },
      { text: "Is grammar important for this exam?", answer: "Yes or no question",
        why: "The answer “yes” tells you nothing that helps the design.",
        fix: "Which grammar mistakes lower the score, and which ones do examiners usually tolerate?" },
      { text: "Don’t you think short videos would work better for your trainees than long lectures?", answer: "Leading question",
        why: "The question pushes the expert towards your answer and may sound like criticism of their work.",
        fix: "When your trainees need to review a complex topic on their own, what do they actually do?" },
      { text: "How do your trainees prepare their reports and present them to the board?", answer: "Two questions in one",
        why: "Writing a report and presenting it are different tasks. The expert will answer one of them.",
        fix: "Ask separately. First, how do trainees prepare a report? Then, what happens when they present it to the board?" },
      { text: "Think of the last time a new colleague had to brief foreign partners in English. What did they do that you would not do?",
        answer: "No problem, this question works",
        why: "This is the “employee with an error” technique combined with a real case. It brings out criteria the expert cannot formulate directly.",
        fix: "No change needed. Follow up with “Why would you not do that?”" },
      { text: "Which mistakes in a client email would make you rewrite it before it is sent?", answer: "No problem, this question works",
        why: "It asks for critical errors through a concrete action of the expert. The answer goes straight into your assessment criteria.",
        fix: "No change needed. You can add “And which mistakes would you let pass?”" }
    ]
  },

  jargon: {
    title: "Jargon translation",
    mode: "choice",
    items: [
      { term: "Formative assessment", choices: [
        { t: "Assessment for learning that is carried out during the course and integrated into the instructional process.", ok: false, why: "Accurate, but it explains one term with others. The expert still does not see what will actually happen." },
        { t: "Regular tests during the course, so that every learner gets a grade for each unit we report to the client.", ok: false, why: "Plain and convincing, but the purpose has changed. This describes grading and reporting. Formative checks exist to decide what to practise next." },
        { t: "Short checks during the course that show us and the learner what needs more practice next.", ok: true, why: "Plain language that keeps the function. The expert can immediately suggest what to check." }] },
      { term: "Scaffolding", choices: [
        { t: "Making tasks easier for learners at the start, so that nobody feels lost or fails the first assignments.", ok: false, why: "It sounds like lowering the standard, which may alarm the expert. Support is temporary and the standard stays the same." },
        { t: "Temporary support, such as hints, examples or templates, that we remove step by step as learners grow.", ok: true, why: "Concrete and accurate. It also invites the expert to provide examples and templates." },
        { t: "Structured instructional support provided within the learner’s zone of proximal development and gradually faded.", ok: false, why: "Correct for colleagues, but it is exactly the jargon the expert cannot use." }] },
      { term: "Learning outcome", choices: [
        { t: "A measurable objective formulated with action verbs according to the levels of Bloom’s taxonomy.", ok: false, why: "True, but it puts the expert in the role of a student of pedagogy." },
        { t: "What a learner will be able to do after the course, and how we will see that they can.", ok: true, why: "It directs the expert to actions and evidence, which is exactly what you need from the interview." },
        { t: "The list of topics and key information that learners will study and remember by the end of the course.", ok: false, why: "This describes content, not a result. The expert will answer with a list of topics." }] },
      { term: "Microlearning", choices: [
        { t: "Short units of five to ten minutes, each built around one practical task learners can do between meetings.", ok: true, why: "It explains the length, the focus and the reason, so the expert can help choose the tasks." },
        { t: "Your lectures recorded in short parts of five to ten minutes, so learners can watch them on their phones.", ok: false, why: "Very clear for the expert, and that is the danger. It suggests cutting a lecture into pieces. The idea of one practical task per unit is lost." },
        { t: "Content chunked into granular learning objects for just-in-time delivery on mobile devices at the point of need.", ok: false, why: "Several new terms instead of one." }] },
      { term: "Blended format", choices: [
        { t: "A hybrid combination of synchronous and asynchronous modalities within one integrated learning experience.", ok: false, why: "Jargon. Even many teachers would ask what it means." },
        { t: "Learners study the materials online on their own, and from time to time we meet to answer their questions.", ok: false, why: "Plain and friendly, but the face-to-face part becomes an optional question session. In a blended course each part has a planned job." },
        { t: "Part of the course is online and part is face-to-face, and each part has its own job in the plan.", ok: true, why: "It shows the logic of the format, so the expert can say which content needs live contact." }] },
      { term: "Rubric", choices: [
        { t: "A checklist of the elements that must be present in the learner’s work for the task to be accepted.", ok: false, why: "A checklist says whether something is present, not how good it is. The levels of quality are lost." },
        { t: "A list of criteria describing strong, acceptable and weak performance, which we would like to write with you.", ok: true, why: "Clear, and it turns the expert into a co-author of the criteria, which is their real strength." },
        { t: "The marking criteria and band descriptors that examiners use to score written and spoken performance.", ok: false, why: "Acceptable with an examiner, who uses these terms every day. With an engineer or a lawyer, it says little. Always ask yourself who the expert is." }] }
    ]
  }
};

/* =============================== situational judgement =============================== */
// Each option: [bias key or "ok", text]. Options are shown in a fixed shuffled order.
export const SJT = [
  { s: "At the kick-off meeting, the client’s HR director asks you to explain how the course will be built.", o: [
    ["curse", "Walk through the design stages, from needs analysis and outcomes to blended structure, formative checks and the pilot."],
    ["ok", "Show one sample week from a learner’s view and explain the plan through it, asking what the client wants to know."],
    ["redundancy", "Prepare a detailed document on every stage, model and tool, so the client has the complete picture before deciding."],
    ["under", "Keep the explanation very general and avoid details of the design, because the client is not an educator."]] },
  { s: "You are writing instructions for the first online task for adult learners at A2–B1.", o: [
    ["curse", "Use the wording from your design document, since it is precise, consistent and has already been approved."],
    ["under", "Explain every step in great detail and add a glossary, because learners at this level will be lost otherwise."],
    ["ok", "Write short instructions with one example, then ask two learners from the target group to try the task."],
    ["illusion", "Keep the instructions to one line, because adults who use English at work will understand what to do."]] },
  { s: "The expert recalls a dramatic case: a translation error in a contract cost the company a large sum. You decide how to use it.", o: [
    ["exceptions", "Build the first module around this case, since it shows learners clearly what is at stake in their work."],
    ["ok", "Ask how often similar errors happen and use the case as a short opening for a unit on typical contract wording."],
    ["redundancy", "Include the full case with all documents and correspondence, so that learners can analyse it in every detail."],
    ["effort", "Let learners reconstruct the case from the original documents on their own, since understanding comes from hard work."]] },
  { s: "You need a format for practising small talk with foreign partners.", o: [
    ["instrument", "Use a short video with a quiz, as in the previous units, since learners already know this format well."],
    ["ok", "Plan short live conversations in pairs with a checklist, because small talk needs real-time interaction."],
    ["status", "Keep the dialogue reading and translation from the client’s current course, since everyone is used to it."],
    ["under", "Give learners ready-made phrases to memorise, because spontaneous conversation would be too stressful."]] },
  { s: "In the pilot, learners finish a task planned for 20 minutes in 8 minutes.", o: [
    ["illusion", "Make the remaining tasks more advanced, since the group is clearly stronger than the questionnaire suggested."],
    ["ok", "Look at the quality of their answers and ask a few learners what was easy before changing the other tasks."],
    ["status", "Keep the plan as it is, because one pilot session with a few learners cannot tell you very much."],
    ["redundancy", "Add extra reading and two more exercises to the task, so that learners have enough material to work with."]] },
  { s: "The client wants the course in the LMS they already use, which offers only pages, files and quizzes.", o: [
    ["instrument", "Turn every unit into a reading page followed by a quiz, since this is what the platform does best."],
    ["ok", "Find which goals need interaction and add live sessions or other tools only for those, within the client’s rules."],
    ["curse", "Explain to the client in learning experience design terms why the platform is outdated, and propose a new one."],
    ["status", "Copy the structure of the client’s existing courses on the platform, because staff already know how to use them."]] },
  { s: "You have collected 40 pages of material from the expert for a four-week course.", o: [
    ["redundancy", "Keep all of it, but split the text into short screens so that learners can move through it at their own pace."],
    ["ok", "Sort the material with the expert into core, practice later and reference, starting from what learners must do."],
    ["effort", "Keep it all as reading, since working through authentic professional texts is the most valuable experience."],
    ["under", "Rewrite all of it in very simple language and short sentences, so that no learner has difficulty with the texts."]] },
  { s: "The expert says your scenario-based module is “a game, not a course”.", o: [
    ["ok", "Ask what the expert expects learners to be able to do, and show how each scenario step leads to that result."],
    ["instrument", "Explain that scenarios are the most effective method in digital learning and should be used in every module."],
    ["curse", "Explain the design in terms of situated learning and cognitive load, so the expert sees that it is research-based."],
    ["status", "Replace the scenarios with the expert’s usual lecture and test, since the expert’s support matters most."]] },
  { s: "You are preparing a vocabulary unit for engineers.", o: [
    ["effort", "Ask learners to build their own glossary from technical manuals, because words found independently are remembered."],
    ["ok", "Select the terms that appear in the learners’ real tasks and practise them in short tasks from those situations."],
    ["redundancy", "Include the full industry glossary of 600 terms, so that learners have every word they might ever need."],
    ["exceptions", "Focus on terms from rare emergency situations, since mistakes there have the most serious consequences."]] },
  { s: "A team member suggests running the whole course as weekly webinars, as the team did last semester.", o: [
    ["instrument", "Agree, because webinars worked well last semester and the team already knows how to run them smoothly."],
    ["status", "Agree, but keep the client’s current timetable and materials, so that nothing changes for the learners."],
    ["ok", "Ask which goals webinars served well last semester, and which goals of this course need a different format."],
    ["illusion", "Agree, since adult professionals can manage live sessions and independent work without much support."]] },
  { s: "In the feedback survey, learners ask for more grammar explanations.", o: [
    ["under", "Add a detailed grammar reference to every unit, since learners clearly cannot cope without the full rules."],
    ["ok", "Find out which mistakes cause the requests, add short explanations linked to those tasks and check the effect."],
    ["status", "Keep the course as designed, because the communicative approach was agreed with the client at the start."],
    ["effort", "Recommend a grammar book for independent study, because grammar is mastered through personal effort."]] },
  { s: "You need to describe the learners for the course map, but only 9 of 60 learners answered your questionnaire.", o: [
    ["exceptions", "Build the profile around the two detailed answers that described very specific problems, as they are most informative."],
    ["ok", "Describe the profile as provisional, combine it with literature and client data, and plan to check it in the pilot."],
    ["illusion", "Assume the others are similar to the most active respondents, who are probably typical motivated professionals."],
    ["redundancy", "Add every answer in full to the course map, so that no information about the learners is lost on the way."]] }
];

/* =============================== format choice =============================== */
export const FORMATS = ["Short video with a quiz", "Live webinar", "Interactive branching scenario",
  "Audio model with recording and feedback", "Writing task with a template and feedback", "Role play in pairs",
  "Guided reading with questions", "Collaborative project in a shared document"];
export const GOALS = [
  { g: "Learners pronounce 30 key technical terms correctly in meetings.", fit: "Audio model with recording and feedback. Learners need to hear a model, produce the sound themselves and get feedback." },
  { g: "Learners write a formal complaint email that follows the company template.", fit: "Writing task with a template and feedback. The product is a written text with a fixed structure." },
  { g: "Learners answer unexpected questions from foreign visitors at a trade fair stand.", fit: "Role play in pairs, or an interactive branching scenario. Learners need practice in reacting to the unexpected." },
  { g: "Learners understand the main requirements of a new 15-page safety regulation.", fit: "Guided reading with questions. The goal is comprehension of one specific document." },
  { g: "Learners agree on a joint project plan with colleagues from another country.", fit: "Collaborative project in a shared document, possibly with a live session. The goal is negotiation and joint work on a shared product." }
];

/* =============================== calibration =============================== */
export const CALIB = ["RACI matrix", "Power and interest grid", "Mediation (CEFR)", "SCORM package",
  "Scaffolding", "Formative assessment", "Cognitive load", "Learning outcome"];
const CAN = ["Yes", "Not sure", "No"];
const PCT = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const MIN_N = 5;

/* =============================== rendering =============================== */
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function perm(n, seed) {          // deterministic shuffle, the same for every student
  const a = [...Array(n).keys()];
  let x = seed * 9301 + 49297;
  for (let i = n - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor(x / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

let G = null, saved = {};
const canSave = () => G && !G.isAdmin && G.user;
async function save(path, value) {
  if (!canSave()) return;
  try {
    await G.db.update(`results/${G.user.uid}`, { group: G.ownGroup ? "g" + G.ownGroup : null });
    await G.db.set(`results/${G.user.uid}/${path}`, value);
  } catch (e) { console.warn("Result not saved", e); }
}

function scoreBar(host, total, done, restart) {
  const right = [...done.values()].filter(Boolean).length;
  host.innerHTML = `<span>Answered <b>${done.size}</b> of ${total} · correct <b>${right}</b></span>`;
  if (done.size) {
    const again = document.createElement("button");
    again.type = "button"; again.className = "ws-btn"; again.textContent = "Start again";
    again.addEventListener("click", restart);
    host.appendChild(again);
  }
}

function renderCheck(host, key) {
  const set = SETS[key];
  const order = set.order || set.items.map((_, i) => i);
  const total = order.length;
  const done = new Map();
  const first = saved[key] || {};
  host.innerHTML = "";
  const score = document.createElement("div");
  score.className = "ex-score";
  const update = () => scoreBar(score, total, done, () => renderCheck(host, key));
  const record = (k, pick, ok) => {
    if (first[k] !== undefined) return;
    first[k] = { p: pick, ok };
    saved[key] = first;
    save(`${key}/${k}`, { p: pick, ok });
  };

  order.forEach((k, i) => {
    const it = set.items[k];
    const box = document.createElement("div");
    box.className = "ex-item";
    const feedback = document.createElement("div");
    feedback.className = "ex-feedback"; feedback.hidden = true;

    if (set.mode === "select") {
      box.innerHTML = `<div class="ex-num">${i + 1}</div><div class="ex-body"><p class="ex-text">${esc(it.text)}</p>
        <div class="ex-row"><select aria-label="${esc(set.prompt)}"><option value="">${esc(set.prompt)}</option>${set.options.map(o => `<option>${esc(o)}</option>`).join("")}</select>
        <button type="button" class="ws-btn ex-check">Check</button></div></div>`;
      box.querySelector(".ex-body").appendChild(feedback);
      const sel = box.querySelector("select");
      box.querySelector(".ex-check").addEventListener("click", () => {
        if (!sel.value) { sel.focus(); return; }
        const ok = sel.value === it.answer;
        if (!done.has(i)) { done.set(i, ok); record(k, sel.value, ok); }
        feedback.hidden = false;
        feedback.className = "ex-feedback " + (ok ? "ok" : "no");
        feedback.innerHTML = (ok ? `<b>Correct.</b> ` : `<b>Not quite.</b> The answer is <b>${esc(it.answer)}</b>. `) + esc(it.why) +
          (it.fix ? `<div class="ex-fix"><span>${esc(set.reveal)}</span>${esc(it.fix)}</div>` : "");
        update();
      });
    } else {
      box.innerHTML = `<div class="ex-num">${i + 1}</div><div class="ex-body"><p class="ex-term">${esc(it.term)}</p>
        <div class="ex-choices">${it.choices.map((c, j) => `<label class="ex-choice"><input type="radio" name="${key}-${k}" value="${j}"><span>${esc(c.t)}</span></label>`).join("")}</div>
        <button type="button" class="ws-btn ex-check">Check</button></div>`;
      box.querySelector(".ex-body").appendChild(feedback);
      box.querySelector(".ex-check").addEventListener("click", () => {
        const picked = box.querySelector("input:checked");
        if (!picked) return;
        const j = +picked.value, c = it.choices[j];
        if (!done.has(i)) { done.set(i, c.ok); record(k, j, c.ok); }
        box.querySelectorAll(".ex-choice").forEach((l, m) => {
          l.classList.toggle("is-best", it.choices[m].ok);
          l.classList.toggle("is-wrong", m === j && !c.ok);
          const note = l.querySelector(".ex-why") || l.appendChild(Object.assign(document.createElement("em"), { className: "ex-why" }));
          note.textContent = it.choices[m].why;
        });
        feedback.hidden = false;
        feedback.className = "ex-feedback " + (c.ok ? "ok" : "no");
        feedback.innerHTML = c.ok ? "<b>Agreed.</b> Now compare why the other two do not work as well."
          : "<b>Look again.</b> The strongest option is marked in green. Read why each version works or does not.";
        update();
      });
    }
    host.appendChild(box);
  });
  update();
  host.appendChild(score);
}

/* ---------- situational judgement ---------- */
export function sjtProfile(picks) {
  const offered = {}, chosen = {};
  let balanced = 0, answered = 0;
  SJT.forEach((q, i) => {
    q.o.forEach(([k]) => { if (k !== "ok") offered[k] = (offered[k] || 0) + 1; });
    const p = picks?.[i];
    if (p == null) return;
    answered++;
    if (p === "ok") balanced++; else chosen[p] = (chosen[p] || 0) + 1;
  });
  return { offered, chosen, balanced, answered };
}

function profileHTML(picks) {
  const { offered, chosen, balanced } = sjtProfile(picks);
  const rows = Object.keys(offered).map(k => ({ k, n: chosen[k] || 0, of: offered[k] }))
    .sort((a, b) => b.n / b.of - a.n / a.of);
  return `<div class="sj-profile">
    <p><b>Balanced decisions: ${balanced} of ${SJT.length}.</b> The bars show how often you chose the option linked with each bias, out of the number of times it was offered.</p>
    ${rows.map(r => `<div class="sj-bar"><span class="sj-label">${esc(BIAS_KEYS[r.k])}</span>
      <span class="sj-track"><span style="width:${Math.round(r.n / r.of * 100)}%"></span></span><span class="sj-n">${r.n} of ${r.of}</span></div>`).join("")}
    <p class="ws-hint">This is not a diagnosis. Twelve situations show tendencies in these particular cases, not stable traits. Look at the biases you chose more than once and ask yourself where they could appear in your internship project.</p>
  </div>`;
}

function renderSJT(host) {
  const prev = saved.sjt;
  const picks = {};
  host.innerHTML = "";
  if (prev) host.insertAdjacentHTML("beforeend", `<div class="ex-feedback ok">You have already completed the test. Your first result is shown below and saved for the teacher. You can take the test again for yourself; a new attempt is not saved.</div>`);
  const form = document.createElement("div");
  form.className = "ex";
  SJT.forEach((q, i) => {
    const order = perm(q.o.length, i + 3);
    const box = document.createElement("div");
    box.className = "ex-item";
    box.innerHTML = `<div class="ex-num">${i + 1}</div><div class="ex-body"><p class="ex-text">${esc(q.s)} <b>What do you do?</b></p>
      <div class="ex-choices">${order.map(j => `<label class="ex-choice"><input type="radio" name="sjt-${i}" value="${esc(q.o[j][0])}"><span>${esc(q.o[j][1])}</span></label>`).join("")}</div></div>`;
    box.querySelectorAll("input").forEach(r => r.addEventListener("change", () => { picks[i] = r.value; status(); }));
    form.appendChild(box);
  });
  host.appendChild(form);
  const bar = document.createElement("div");
  bar.className = "ex-score";
  const out = document.createElement("div");
  const status = () => {
    const n = Object.keys(picks).length;
    bar.innerHTML = `<span>Answered <b>${n}</b> of ${SJT.length}</span>`;
    const b = document.createElement("button");
    b.type = "button"; b.className = "ws-btn"; b.textContent = "Show my profile";
    b.disabled = n < SJT.length;
    b.addEventListener("click", () => {
      out.innerHTML = profileHTML(picks) + keyHTML(picks);
      if (!prev) { saved.sjt = { ...picks }; save("sjt", { ...picks }); }
      out.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    bar.appendChild(b);
  };
  status();
  host.appendChild(bar);
  host.appendChild(out);
  if (prev) out.innerHTML = `<h4>Your saved result</h4>` + profileHTML(prev) + keyHTML(prev);
}

function keyHTML(picks) {
  return `<details class="sj-key"><summary>What each option reflected</summary><div class="details-body">${SJT.map((q, i) =>
    `<p class="sj-q"><b>${i + 1}.</b> ${esc(q.s)}</p><ul>${q.o.map(([k, t]) =>
      `<li class="${picks?.[i] === k ? "mine" : ""}">${esc(t)} <span class="sj-tag ${k === "ok" ? "ok" : ""}">${k === "ok" ? "Balanced decision" : esc(BIAS_KEYS[k])}</span></li>`).join("")}</ul>`).join("")}</div></details>`;
}

/* ---------- format choice ---------- */
function renderFormats(host) {
  const prev = saved.formats;
  host.innerHTML = "";
  const box = document.createElement("div");
  box.className = "ex";
  GOALS.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "ex-item";
    row.innerHTML = `<div class="ex-num">${i + 1}</div><div class="ex-body"><p class="ex-text">${esc(g.g)}</p>
      <div class="ex-row"><select aria-label="Format for goal ${i + 1}"><option value="">Choose the main format</option>${FORMATS.map(f => `<option>${esc(f)}</option>`).join("")}</select></div>
      <div class="ex-feedback" hidden></div></div>`;
    if (prev && prev[i]) row.querySelector("select").value = prev[i];
    box.appendChild(row);
  });
  host.appendChild(box);
  const bar = document.createElement("div");
  bar.className = "ex-score";
  bar.innerHTML = `<span>Choose one main format for each goal, then look at the pattern.</span>`;
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "ws-btn"; btn.textContent = "Show the pattern";
  bar.appendChild(btn);
  host.appendChild(bar);
  const out = document.createElement("div");
  host.appendChild(out);
  const show = () => {
    const picks = [...box.querySelectorAll("select")].map(s => s.value);
    if (picks.some(p => !p)) { out.innerHTML = `<div class="ex-feedback no">Choose a format for all five goals first.</div>`; return; }
    const count = {};
    picks.forEach(p => { count[p] = (count[p] || 0) + 1; });
    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    const distinct = Object.keys(count).length;
    box.querySelectorAll(".ex-item").forEach((row, i) => {
      const fb = row.querySelector(".ex-feedback");
      fb.hidden = false; fb.className = "ex-feedback ok";
      fb.innerHTML = `<b>One possible fit.</b> ${esc(GOALS[i].fit)}`;
    });
    const msg = top[1] >= 3
      ? `You used <b>${esc(top[0])}</b> for ${top[1]} of 5 very different goals. This is the pattern behind the law of the instrument: a familiar tool starts to look right for everything. Check whether this format really fits each goal.`
      : top[1] === 2
        ? `You used ${distinct} different formats, and <b>${esc(top[0])}</b> twice. Check whether the two goals really need the same format.`
        : `You used five different formats for five different goals. Your choices follow the goals rather than one favourite tool.`;
    out.innerHTML = `<div class="ex-feedback ${top[1] >= 3 ? "no" : "ok"}">${msg} Several formats can work for the same goal; the suggestions above are one option, not the only correct answer.</div>`;
    if (!saved.formats) { saved.formats = picks; save("formats", picks); }
  };
  btn.addEventListener("click", show);
  if (prev) show();
}

/* ---------- calibration ---------- */
function renderCalib(host) {
  host.innerHTML = "";
  const uid = G?.user?.uid;
  const mine = saved.calib;
  const table = document.createElement("div");
  table.className = "ws-scroll";
  table.innerHTML = `<table class="cal-table"><thead><tr><th>Term</th><th>Could you explain it to a client in two sentences right now?</th><th>What share of the students on this course could do it?</th></tr></thead>
    <tbody>${CALIB.map((t, i) => `<tr><td class="row-label">${esc(t)}</td>
      <td><select data-c="${i}"><option value="">–</option>${CAN.map((c, k) => `<option value="${2 - k}">${c}</option>`).join("")}</select></td>
      <td><select data-e="${i}"><option value="">–</option>${PCT.map(p => `<option value="${p}">${p}%</option>`).join("")}</select></td></tr>`).join("")}</tbody></table>`;
  host.appendChild(table);
  if (mine) CALIB.forEach((_, i) => {
    table.querySelector(`[data-c="${i}"]`).value = mine.t?.[i]?.c ?? "";
    table.querySelector(`[data-e="${i}"]`).value = mine.t?.[i]?.e ?? "";
  });
  const bar = document.createElement("div");
  bar.className = "ex-score";
  bar.innerHTML = `<span>${mine ? "Your answers are saved. The comparison updates as more students answer." : "Answer both columns for every term, then compare with the course."}</span>`;
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "ws-btn"; btn.textContent = mine ? "Update comparison" : "Save and compare";
  bar.appendChild(btn);
  host.appendChild(bar);
  const out = document.createElement("div");
  host.appendChild(out);

  async function compare(myT) {
    let all = {};
    try { all = (await G.db.get("calib")) || {}; } catch (e) { out.innerHTML = `<div class="ex-feedback no">The comparison is not available yet.</div>`; return; }
    const resp = Object.values(all).filter(r => r && r.t);
    const n = resp.length;
    if (n < MIN_N) { out.innerHTML = `<div class="ex-feedback ok">${n} of at least ${MIN_N} answers so far. The comparison appears when at least ${MIN_N} students on the course have answered. Come back later.</div>`; return; }
    const rows = CALIB.map((t, i) => {
      const can = resp.filter(r => +r.t?.[i]?.c === 2).length;
      const actual = Math.round(can / n * 100);
      const ests = resp.map(r => r.t?.[i]?.e).filter(v => v != null).map(Number);
      const mean = ests.length ? Math.round(ests.reduce((a, b) => a + b, 0) / ests.length) : null;
      const my = myT?.[i];
      let note = "";
      if (my && my.e != null) {
        const d = Number(my.e) - actual;
        note = d >= 20 ? (+my.c === 2 ? "You know it and overestimated others" : "You overestimated others")
          : d <= -20 ? "You underestimated others" : "Close estimate";
      }
      return `<tr><td class="row-label">${esc(t)}</td><td>${actual}%</td><td>${mean ?? "–"}%</td><td>${my?.e != null ? my.e + "%" : "–"}</td><td>${esc(note)}</td></tr>`;
    }).join("");
    out.innerHTML = `<div class="ws-scroll"><table><thead><tr><th>Term</th><th>Students who said “Yes”</th><th>Average estimate</th><th>Your estimate</th><th>Your calibration</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="ws-hint">Based on ${n} answers. People who know a term well tend to overestimate how many others know it too. This is the mechanism behind the curse of knowledge and the illusion of others’ competence. Estimates far below the real figure point the other way, to underestimation of others.</p>`;
  }

  btn.addEventListener("click", async () => {
    const t = {};
    let missing = false;
    CALIB.forEach((_, i) => {
      const c = table.querySelector(`[data-c="${i}"]`).value, e = table.querySelector(`[data-e="${i}"]`).value;
      if (c === "" || e === "") missing = true; else t[i] = { c: +c, e: +e };
    });
    if (missing) { out.innerHTML = `<div class="ex-feedback no">Answer both columns for every term.</div>`; return; }
    if (canSave() && !mine) {
      try { await G.db.set(`calib/${uid}`, { g: G.ownGroup ? "g" + G.ownGroup : null, t }); saved.calib = { t }; }
      catch (e) { console.warn(e); }
    }
    compare(mine ? mine.t : t);
  });
  if (mine) compare(mine.t);
}

/* ---------- entry ---------- */
export async function initExercises(session) {
  G = session;
  saved = {};
  if (canSave()) {
    try {
      saved = (await G.db.get(`results/${G.user.uid}`)) || {};
      const c = await G.db.get(`calib/${G.user.uid}`);
      if (c) saved.calib = c;
    } catch (e) { console.warn("Saved results not available", e); }
  }
  document.querySelectorAll(".ex[data-exercise]").forEach(host => {
    const k = host.dataset.exercise;
    if (SETS[k]) renderCheck(host, k);
    else if (k === "sjt") renderSJT(host);
    else if (k === "formats") renderFormats(host);
    else if (k === "calib") renderCalib(host);
  });
}
