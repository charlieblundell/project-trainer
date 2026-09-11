import type { Finding } from "./types";

/**
 * What happens between sessions. Less studied than programming, and far more
 * cluttered with things people sell, so several of these findings exist mainly
 * to say that something popular does less than advertised.
 */
export const RECOVERY: Finding[] = [
  {
    id: "sleep-loss-hurts-performance",
    topic: "recovery",
    claim: "Acute sleep loss measurably impairs physical performance.",
    practical:
      "A bad night doesn't mean skipping the session — it means expecting less from it. Keep the movements, drop a set, don't chase a personal best, and rate the effort honestly so next week's targets aren't set off a bad day.",
    strength: "strong",
    limits:
      "Effects vary by task and by how much sleep was lost. This is about acute loss, not the long-term consequences of chronic short sleep.",
    tags: [
      "sleep",
      "slept badly",
      "slept",
      "bad night",
      "bad sleep",
      "still train",
      "tired",
      "fatigue",
      "exhausted",
      "insomnia",
      "shift work",
    ],
    sources: [
      {
        authors: "Craven J, McCartney D, Desbrow B, Sabapathy S, Bellinger P, Roberts L, Irwin C",
        year: 2022,
        title:
          "Effects of acute sleep loss on physical performance: a systematic and meta-analytical review",
        journal: "Sports Medicine",
        locator: "52:2669–2690",
        doi: "10.1007/s40279-022-01706-y",
      },
    ],
  },
  {
    id: "more-sleep-helps",
    topic: "recovery",
    claim: "Extending sleep improves athletic performance in people who were under-slept.",
    practical:
      "The highest-yield recovery intervention is boring: go to bed earlier. It beats anything you can buy, and it's the first thing to fix before blaming your programme.",
    strength: "moderate",
    limits:
      "The best-known study is small, uncontrolled and in collegiate athletes. The direction is well supported; the size of the effect for an ordinary person isn't.",
    tags: ["sleep", "recovery", "rest", "more sleep", "performance", "tired"],
    sources: [
      {
        authors: "Mah CD, Mah KE, Kezirian EJ, Dement WC",
        year: 2011,
        title: "The effects of sleep extension on the athletic performance of collegiate basketball players",
        journal: "Sleep",
        locator: "34(7):943–950",
        doi: "10.5665/SLEEP.1132",
      },
    ],
  },
  {
    id: "soreness-is-not-a-scorecard",
    topic: "recovery",
    claim: "Muscle soreness is not a valid indicator of how well a session worked.",
    practical:
      "Soreness mostly tracks novelty — a new exercise, a long eccentric, a layoff. A session that leaves you fine can be a better session than one that leaves you wrecked. Judge training by whether the numbers move, not by how you feel two days later.",
    strength: "moderate",
    limits:
      "Soreness isn't meaningless either: a sudden jump in it usually means you added too much too fast.",
    tags: ["doms", "sore", "soreness", "aching", "not sore", "good workout", "next day"],
    sources: [
      {
        authors: "Schoenfeld BJ, Contreras B",
        year: 2013,
        title: "Is postexercise muscle soreness a valid indicator of muscular adaptations?",
        journal: "Strength & Conditioning Journal",
        locator: "35(5):16–21",
        doi: "10.1519/SSC.0b013e3182a61820",
      },
    ],
  },
  {
    id: "ice-baths-blunt-adaptation",
    topic: "recovery",
    claim:
      "Regular cold water immersion after lifting reduces the long-term muscle gains from that training.",
    practical:
      "Ice baths make you feel better and leave you with less to show for the work. If you're lifting to build muscle, save the cold for competition days or don't bother — an ice bath after every session is actively working against you.",
    strength: "moderate",
    limits:
      "This applies to strength and hypertrophy training. Cold immersion for acute recovery between same-day events is a different question with different answers.",
    tags: ["ice bath", "cold", "cold plunge", "cryotherapy", "recovery", "cold water"],
    sources: [
      {
        authors:
          "Roberts LA, Raastad T, Markworth JF, Figueiredo VC, Egner IM, Shield A, Cameron-Smith D, Coombes JS, Peake JM",
        year: 2015,
        title:
          "Post-exercise cold water immersion attenuates acute anabolic signalling and long-term adaptations in muscle to strength training",
        journal: "The Journal of Physiology",
        locator: "593(18):4285–4301",
        doi: "10.1113/JP270570",
      },
    ],
  },
  {
    id: "foam-rolling-is-minor",
    topic: "recovery",
    claim:
      "Foam rolling has small effects on performance and recovery — real, but modest.",
    practical:
      "Fine as a warm-up habit or if it makes you feel ready. It isn't fixing anything structural, and it isn't a substitute for sleep, food or sensible loading.",
    strength: "moderate",
    tags: ["foam roll", "rolling", "release", "massage", "warm up", "recovery tools"],
    sources: [
      {
        authors:
          "Wiewelhove T, Döweling A, Schneider C, Hottenrott L, Meyer T, Kellmann M, Pfeiffer M, Ferrauti A",
        year: 2019,
        title: "A meta-analysis of the effects of foam rolling on performance and recovery",
        journal: "Frontiers in Physiology",
        locator: "10:376",
        doi: "10.3389/fphys.2019.00376",
      },
    ],
  },
  {
    id: "long-static-stretching-before-lifting",
    topic: "recovery",
    claim:
      "Long static stretches immediately before training reduce strength and power output.",
    practical:
      "Keep pre-session stretching brief and moving. Save the long holds for after the session or a separate day — and if you stretch first anyway, do some warm-up sets afterwards so the effect washes out before your working sets.",
    strength: "strong",
    limits:
      "The impairment comes from long holds. Short stretches inside a proper warm-up, or mobility work between sets, aren't the same thing.",
    tags: ["stretch", "stretching", "warm up", "before training", "mobility", "flexibility"],
    sources: [
      {
        authors: "Behm DG, Blazevich AJ, Kay AD, McHugh M",
        year: 2016,
        title:
          "Acute effects of muscle stretching on physical performance, range of motion, and injury incidence in healthy active individuals: a systematic review",
        journal: "Applied Physiology, Nutrition, and Metabolism",
        locator: "41(1):1–11",
        doi: "10.1139/apnm-2015-0235",
      },
    ],
  },
  {
    id: "overtraining-is-real-but-rare",
    topic: "recovery",
    claim:
      "True overtraining syndrome is uncommon and takes weeks to months of recovery; short-term overreaching is far more usual.",
    practical:
      "Feeling flat for a week is not overtraining. It's usually accumulated fatigue, poor sleep, or under-eating, and an easier week fixes it. Persistent, unexplained performance loss lasting months with mood and sleep disturbance is a different matter and warrants medical input.",
    strength: "moderate",
    limits:
      "There is no diagnostic test — the consensus definition is one of exclusion, which is exactly why the label gets over-applied.",
    tags: ["overtraining", "burnt out", "flat", "exhausted", "too much", "fatigue", "run down"],
    sources: [
      {
        authors:
          "Meeusen R, Duclos M, Foster C, Fry A, Gleeson M, Nieman D, Raglin J, Rietjens G, Steinacker J, Urhausen A",
        year: 2013,
        title:
          "Prevention, diagnosis, and treatment of the overtraining syndrome: joint consensus statement of the European College of Sport Science and the American College of Sports Medicine",
        journal: "Medicine & Science in Sports & Exercise",
        locator: "45(1):186–205",
        doi: "10.1249/MSS.0b013e318279a10a",
      },
    ],
  },
  {
    id: "deloads-are-under-studied",
    topic: "recovery",
    claim:
      "Planned easy weeks are near-universal practice in strength sport but thinly evidenced.",
    practical:
      "Backing off when performance stalls or fatigue piles up is sensible and costs almost nothing. Just don't treat a fixed deload schedule as a proven necessity — it's convention, and this app reduces load in response to your logged sessions rather than to the calendar.",
    strength: "limited",
    limits:
      "A scoping review found the research base on overreaching and recovery in resistance training to be small and inconsistent. Absence of evidence here is genuinely absence of evidence, not evidence of absence.",
    tags: ["deload", "easy week", "back off", "rest week", "recovery week", "stalled", "plateau"],
    sources: [
      {
        authors: "Bell L, Ruddock A, Maden-Wilkinson T, Rogerson D",
        year: 2020,
        title:
          "Overreaching and overtraining in strength sports and resistance training: a scoping review",
        journal: "Journal of Sports Sciences",
        locator: "38(16)",
        doi: "10.1080/02640414.2020.1763077",
      },
    ],
  },
  {
    id: "exercise-and-mental-health",
    topic: "recovery",
    claim:
      "Physical activity meaningfully reduces symptoms of depression, anxiety and psychological distress.",
    practical:
      "Some of what training does for you won't show up in any of the numbers on the progress screen. On weeks where the lifting is going badly, that benefit is still being paid out.",
    strength: "strong",
    limits:
      "Exercise is a supportive intervention, not a replacement for treatment. Anyone struggling with their mental health should speak to a professional rather than train harder.",
    tags: ["mental health", "mood", "depression", "anxiety", "stress", "motivation", "wellbeing"],
    sources: [
      {
        authors:
          "Singh B, Olds T, Curtis R, Dumuid D, Virgara R, Watson A, Szeto K, O'Connor E, Ferguson T, Eglitis E, Miatke A, Simpson CEM, Maher C",
        year: 2023,
        title:
          "Effectiveness of physical activity interventions for improving depression, anxiety and distress: an overview of systematic reviews",
        journal: "British Journal of Sports Medicine",
        locator: "57(18):1203–1209",
        doi: "10.1136/bjsports-2022-106195",
      },
    ],
  },
];
