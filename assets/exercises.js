// Interactive exercises for the Working with Experts page.
// Self-contained: no sign-in and no database, answers are not saved.
// A host element <div class="ex" data-exercise="bias|questions|jargon"></div> is filled from the data below.

const BIASES = [
  "Curse of knowledge",
  "Illusion of others' competence",
  "Underestimation of learners",
  "Focus on exceptions",
  "Redundancy effect",
  "Status quo and resistance to change",
  "Law of the instrument",
  "Authorship effect",
  "Effort justification"
];

const SETS = {
  /* ---------------- Bias detective ---------------- */
  bias: {
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

  /* ---------------- Weak and better questions ---------------- */
  questions: {
    mode: "select",
    prompt: "What, if anything, is wrong with this question for an interview with an expert?",
    options: ["Too broad", "Asks about knowledge, not action", "Designer jargon", "Yes or no question",
      "Leading question", "Two questions in one", "No problem, this question works"],
    reveal: "A possible improvement",
    items: [
      { text: "Could you tell us everything about technical meetings in English?",
        answer: "Too broad",
        why: "The expert will give a lecture, not data you can use.",
        fix: "Think of the last meeting where a junior engineer struggled in English. What exactly happened?" },
      { text: "What should learners know about formal letters?",
        answer: "Asks about knowledge, not action",
        why: "You will get a list of rules, not a picture of competent performance.",
        fix: "What must a learner be able to write after the course, and how will you see that the letter is good enough?" },
      { text: "Which learning outcomes should we align with the formative assessment?",
        answer: "Designer jargon",
        why: "The expert has to guess what you mean, or pretends to understand.",
        fix: "How do you usually check during the course that a student is on the right track?" },
      { text: "Is grammar important for this exam?",
        answer: "Yes or no question",
        why: "The answer “yes” tells you nothing that helps the design.",
        fix: "Which grammar mistakes lower the score, and which ones do examiners usually tolerate?" },
      { text: "Don’t you think short videos would work better for your trainees than long lectures?",
        answer: "Leading question",
        why: "The question pushes the expert towards your answer and may sound like criticism of their work.",
        fix: "When your trainees need to review a complex topic on their own, what do they actually do?" },
      { text: "How do your trainees prepare their reports and present them to the board?",
        answer: "Two questions in one",
        why: "Writing a report and presenting it are different tasks. The expert will answer one of them.",
        fix: "Ask separately. First, how do trainees prepare a report? Then, what happens when they present it to the board?" },
      { text: "Think of the last time a new colleague had to brief foreign partners in English. What did they do that you would not do?",
        answer: "No problem, this question works",
        why: "This is the “employee with an error” technique combined with a real case. It brings out criteria the expert cannot formulate directly.",
        fix: "No change needed. Follow up with “Why would you not do that?”" },
      { text: "Which mistakes in a client email would make you rewrite it before it is sent?",
        answer: "No problem, this question works",
        why: "It asks for critical errors through a concrete action of the expert. The answer goes straight into your assessment criteria.",
        fix: "No change needed. You can add “And which mistakes would you let pass?”" }
    ]
  },

  /* ---------------- Jargon translation ---------------- */
  jargon: {
    mode: "choice",
    prompt: "Which explanation would you use with the expert? Discuss in your team before you check.",
    items: [
      { term: "Formative assessment",
        choices: [
          { t: "Assessment for learning that takes place during the course.", ok: false, why: "Accurate, but it explains one term with another. The expert still does not see what will actually happen." },
          { t: "Regular tests during the course, so that every learner gets a grade for each unit and we can report progress to the client.", ok: false, why: "Plain and convincing, but the purpose has changed. This describes grading and reporting. Formative checks exist to decide what to practise next." },
          { t: "Short checks during the course that show us and the learner what needs more practice.", ok: true, why: "Plain language that keeps the function. The expert can immediately suggest what to check." }
        ] },
      { term: "Scaffolding",
        choices: [
          { t: "Making tasks easier for learners.", ok: false, why: "It sounds like lowering the standard, which may alarm the expert. Support is temporary and the standard stays the same." },
          { t: "Temporary support, such as hints, examples or templates, that we remove step by step as learners become more confident.", ok: true, why: "Concrete and accurate. It also invites the expert to provide examples and templates." },
          { t: "Structured instructional support within the learner’s zone of proximal development.", ok: false, why: "Correct for colleagues, but it is exactly the jargon the expert cannot use." }
        ] },
      { term: "Learning outcome",
        choices: [
          { t: "A measurable objective formulated with action verbs according to Bloom’s taxonomy.", ok: false, why: "True, but it puts the expert in the role of a student of pedagogy." },
          { t: "What a learner will be able to do after the course, and how we will see it.", ok: true, why: "It directs the expert to actions and evidence, which is exactly what you need from the interview." },
          { t: "What the course is about.", ok: false, why: "This describes a topic, not a result. The expert will answer with a list of contents." }
        ] },
      { term: "Microlearning",
        choices: [
          { t: "Short units of five to ten minutes, each focused on one practical task, that learners can complete between work tasks.", ok: true, why: "It explains the length, the focus and the reason, so the expert can help choose the tasks." },
          { t: "Your lectures recorded in short parts of five to ten minutes, so that learners can watch them on their phones at any time.", ok: false, why: "Very clear for the expert, and that is the danger. It suggests cutting a lecture into pieces. The idea of one practical task per unit is lost." },
          { t: "Content chunking for just-in-time delivery.", ok: false, why: "Three terms instead of one." }
        ] },
      { term: "Blended format",
        choices: [
          { t: "Hybrid synchronous and asynchronous modalities.", ok: false, why: "Jargon. Even many teachers would ask what it means." },
          { t: "Learners study the materials online on their own, and from time to time we meet to answer any questions they have.", ok: false, why: "Plain and friendly, but the face-to-face part becomes an optional question session. In a blended course each part has a planned job." },
          { t: "Part of the course is online and part is face-to-face, and each part has its own job, for example practice online and discussion in class.", ok: true, why: "It shows the logic of the format, so the expert can say which content needs live contact." }
        ] },
      { term: "Rubric",
        choices: [
          { t: "A checklist.", ok: false, why: "A checklist says whether something is present, not how good it is. The levels of quality are lost." },
          { t: "A list of criteria that describes what a strong, an acceptable and a weak performance looks like. We would like to write it with you.", ok: true, why: "Clear, and it turns the expert into a co-author of the criteria, which is their real strength." },
          { t: "Marking criteria.", ok: false, why: "Acceptable with an examiner, who uses this term every day. With an engineer or a lawyer, it says little. Always ask yourself who the expert is." }
        ] }
    ]
  }
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function render(host) {
  const set = SETS[host.dataset.exercise];
  if (!set) return;
  const items = set.order ? set.order.map(k => set.items[k]) : set.items;
  const total = items.length;
  const done = new Map();

  const score = document.createElement("div");
  score.className = "ex-score";
  const updateScore = () => {
    const right = [...done.values()].filter(Boolean).length;
    score.innerHTML = `<span>Answered <b>${done.size}</b> of ${total} · correct <b>${right}</b></span>`;
    if (done.size) {
      const again = document.createElement("button");
      again.type = "button"; again.className = "ws-btn"; again.textContent = "Start again";
      again.addEventListener("click", () => { host.innerHTML = ""; render(host); });
      score.appendChild(again);
    }
  };

  items.forEach((it, i) => {
    const box = document.createElement("div");
    box.className = "ex-item";
    const feedback = document.createElement("div");
    feedback.className = "ex-feedback";
    feedback.hidden = true;

    if (set.mode === "select") {
      box.innerHTML = `<div class="ex-num">${i + 1}</div><div class="ex-body"><p class="ex-text">${esc(it.text)}</p>
        <div class="ex-row"><select aria-label="${esc(set.prompt)}"><option value="">${esc(set.prompt)}</option>${set.options.map(o => `<option>${esc(o)}</option>`).join("")}</select>
        <button type="button" class="ws-btn ex-check">Check</button></div></div>`;
      const body = box.querySelector(".ex-body");
      body.appendChild(feedback);
      const sel = box.querySelector("select");
      box.querySelector(".ex-check").addEventListener("click", () => {
        if (!sel.value) { sel.focus(); return; }
        const ok = sel.value === it.answer;
        if (!done.has(i)) done.set(i, ok);
        feedback.hidden = false;
        feedback.className = "ex-feedback " + (ok ? "ok" : "no");
        feedback.innerHTML = (ok ? `<b>Correct.</b> ` : `<b>Not quite.</b> The answer is <b>${esc(it.answer)}</b>. `) + esc(it.why) +
          (it.fix ? `<div class="ex-fix"><span>${esc(set.reveal)}</span>${esc(it.fix)}</div>` : "");
        updateScore();
      });
    } else {
      box.innerHTML = `<div class="ex-num">${i + 1}</div><div class="ex-body"><p class="ex-term">${esc(it.term)}</p>
        <div class="ex-choices">${it.choices.map((c, k) => `<label class="ex-choice"><input type="radio" name="${host.dataset.exercise}-${i}" value="${k}"><span>${esc(c.t)}</span></label>`).join("")}</div>
        <button type="button" class="ws-btn ex-check">Check</button></div>`;
      const body = box.querySelector(".ex-body");
      body.appendChild(feedback);
      box.querySelector(".ex-check").addEventListener("click", () => {
        const picked = box.querySelector("input:checked");
        if (!picked) return;
        const k = +picked.value, c = it.choices[k];
        if (!done.has(i)) done.set(i, c.ok);
        box.querySelectorAll(".ex-choice").forEach((l, j) => {
          l.classList.toggle("is-best", it.choices[j].ok);
          l.classList.toggle("is-wrong", j === k && !c.ok);
          const note = l.querySelector(".ex-why") || l.appendChild(Object.assign(document.createElement("em"), { className: "ex-why" }));
          note.textContent = it.choices[j].why;
        });
        feedback.hidden = false;
        feedback.className = "ex-feedback " + (c.ok ? "ok" : "no");
        feedback.innerHTML = c.ok ? "<b>Agreed.</b> Now compare why the other two do not work as well." : "<b>Look again.</b> The strongest option is marked in green. Read why each version works or does not.";
        updateScore();
      });
    }
    host.appendChild(box);
  });
  updateScore();
  host.appendChild(score);
}

document.querySelectorAll(".ex[data-exercise]").forEach(render);
