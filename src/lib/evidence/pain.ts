import type { Finding } from "./types";

/**
 * Training when something hurts. Strictly about how to load a body that is
 * complaining — never about identifying what is wrong with it. Nothing in here
 * is a diagnosis, and none of it replaces a clinician who can examine someone.
 */
export const PAIN: Finding[] = [
  {
    id: "strength-training-reduces-injury",
    topic: "pain",
    claim:
      "Strength training substantially reduces the rate of both acute and overuse injuries, and the effect increases with the dose.",
    practical:
      "Lifting is one of the better-evidenced protective things you can do. If you're training around a history of injury, more strength work is usually part of the answer rather than something to be careful of.",
    strength: "strong",
    limits:
      "The evidence is from sports injury prevention trials, and it says nothing about how to load an area that is currently injured.",
    tags: ["injury", "prevention", "prehab", "protect", "reduce risk", "safe"],
    sources: [
      {
        authors: "Lauersen JB, Andersen TE, Andersen LB",
        year: 2018,
        title:
          "Strength training as superior, dose-dependent and safe prevention of acute and overuse sports injuries: a systematic review, qualitative analysis and meta-analysis",
        journal: "British Journal of Sports Medicine",
        locator: "52(24):1557–1563",
        doi: "10.1136/bjsports-2018-099078",
      },
    ],
  },
  {
    id: "exercise-helps-back-pain",
    topic: "pain",
    claim: "Exercise reduces pain and improves function in chronic low back pain.",
    practical:
      "A sore back is usually a reason to modify training, not to stop moving. Resting until it feels perfect is the approach with the worst evidence behind it.",
    strength: "strong",
    limits:
      "This is chronic, non-specific back pain. New, severe or unexplained back pain — and anything with numbness, weakness, or changes to bladder or bowel function — needs urgent medical assessment, not exercise.",
    tags: ["back", "back pain", "lower back", "spine", "lumbar", "sore back", "disc"],
    sources: [
      {
        authors: "Hayden JA, Ellis J, Ogilvie R, Malmivaara A, van Tulder MW",
        year: 2021,
        title: "Exercise therapy for chronic low back pain",
        journal: "Cochrane Database of Systematic Reviews",
        locator: "Issue 9, CD009790",
        doi: "10.1002/14651858.CD009790.pub2",
      },
    ],
  },
  {
    id: "scan-findings-are-common-in-pain-free-people",
    topic: "pain",
    claim:
      "Disc degeneration, bulges and similar imaging findings are common in people who have no pain at all, and become more common with age.",
    practical:
      "A frightening-sounding scan report is not a sentence, and it doesn't by itself mean an exercise is dangerous. What your body does under load tells you more than what a picture of it looks like.",
    strength: "strong",
    limits:
      "Common findings are not the same as irrelevant findings. This is context for a worrying report, not a reason to ignore one — your clinician interprets your scan, not this app.",
    tags: ["mri", "scan", "disc", "degeneration", "bulge", "diagnosis", "x-ray", "arthritis"],
    sources: [
      {
        authors:
          "Brinjikji W, Luetmer PH, Comstock B, Bresnahan BW, Chen LE, Deyo RA, Halabi S, Turner JA, Avins AL, James K, Wald JT, Kallmes DF, Jarvik JG",
        year: 2015,
        title:
          "Systematic literature review of imaging features of spinal degeneration in asymptomatic populations",
        journal: "American Journal of Neuroradiology",
        locator: "36(4):811–816",
        doi: "10.3174/ajnr.A4173",
      },
    ],
  },
  {
    id: "some-pain-during-exercise-can-be-acceptable",
    topic: "pain",
    claim:
      "In chronic musculoskeletal pain, exercise that provokes some pain offers a small short-term benefit over strictly pain-free exercise.",
    practical:
      "Mild discomfort that settles isn't automatically a signal to stop. It doesn't follow that pushing through worse pain is better — the advantage was small and short-term, and the safe reading is that a bit of discomfort needn't derail you.",
    strength: "moderate",
    limits:
      "This is chronic pain under clinical supervision, not new pain, not sharp pain, and not pain during a heavy lift. Applying it to an acute injury would be a serious misreading.",
    tags: ["pain", "hurts", "discomfort", "should i stop", "push through", "training with pain"],
    sources: [
      {
        authors: "Smith BE, Hendrick P, Smith TO, Bateman M, Moffatt F, Rathleff MS, Selfe J, Logan P",
        year: 2017,
        title:
          "Should exercises be painful in the management of chronic musculoskeletal pain? A systematic review and meta-analysis",
        journal: "British Journal of Sports Medicine",
        locator: "51(23):1679–1687",
        doi: "10.1136/bjsports-2016-097383",
      },
    ],
  },
  {
    id: "pain-monitoring-model",
    topic: "pain",
    claim:
      "Continuing to train while keeping pain within an agreed limit produced outcomes as good as resting from activity, in Achilles tendinopathy.",
    practical:
      "The practical shape of this is a rule agreed in advance: keep pain during and after the session under a set level, and stop if it's still elevated the next morning. That's a far better tool than 'listen to your body', which means nothing.",
    strength: "moderate",
    limits:
      "One randomised trial, in one tendon, with clinician supervision. The principle travels better than the specifics do — the right limit for you is one to set with a clinician.",
    tags: ["tendon", "tendinopathy", "achilles", "pain rules", "how much pain", "keep training"],
    sources: [
      {
        authors: "Silbernagel KG, Thomeé R, Eriksson BI, Karlsson J",
        year: 2007,
        title:
          "Continued sports activity, using a pain-monitoring model, during rehabilitation in patients with Achilles tendinopathy: a randomized controlled study",
        journal: "The American Journal of Sports Medicine",
        locator: "35(6):897–906",
        doi: "10.1177/0363546506298279",
      },
    ],
  },
  {
    id: "exercise-helps-knee-osteoarthritis",
    topic: "pain",
    claim: "Exercise reduces pain and improves physical function in knee osteoarthritis.",
    practical:
      "Arthritic knees are not a reason to stop loading the legs. Strengthening the muscles around the joint is standard care, and the movements can be adjusted for range and load rather than abandoned.",
    strength: "strong",
    limits:
      "Benefits are modest on average and shrink over the long term. Someone with diagnosed osteoarthritis should be guided by their clinician on which movements and what range.",
    tags: ["knee", "arthritis", "osteoarthritis", "joint pain", "creaky", "older", "squat hurts"],
    sources: [
      {
        authors: "Lawford BJ, et al.",
        year: 2024,
        title: "Exercise for osteoarthritis of the knee",
        journal: "Cochrane Database of Systematic Reviews",
        locator: "CD004376",
        doi: "10.1002/14651858.CD004376.pub4",
      },
    ],
  },
  {
    id: "workload-ratios-are-not-a-formula",
    topic: "pain",
    claim:
      "The popular acute-to-chronic workload ratio has serious conceptual and statistical problems, and shouldn't be treated as a rule for safe progression.",
    practical:
      "Be sceptical of anything claiming a precise safe percentage to increase by. Sensible progression means small increases, watching how you respond, and backing off when something complains — not a number that guarantees safety.",
    strength: "moderate",
    tags: ["load management", "progression", "too fast", "10 percent rule", "increase", "safe"],
    sources: [
      {
        authors: "Impellizzeri FM, Tenan MS, Kempton T, Novak A, Coutts AJ",
        year: 2020,
        title: "Acute:chronic workload ratio: conceptual issues and fundamental pitfalls",
        journal: "International Journal of Sports Physiology and Performance",
        locator: "15(6):907–913",
        doi: "10.1123/ijspp.2019-0864",
      },
    ],
  },
];
