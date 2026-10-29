import type { Finding } from "./types";

/**
 * General nutrition principles for people who train. Deliberately general:
 * these describe what the research says about populations, and none of it is
 * personalised dietary advice. Anyone with a medical condition, an eating
 * disorder history, or who is pregnant needs a qualified professional, not an
 * app.
 */
export const NUTRITION: Finding[] = [
  {
    id: "protein-target",
    topic: "nutrition",
    claim:
      "Protein intakes beyond roughly 1.6 g per kg of bodyweight per day don't add further to training-induced gains in lean mass.",
    practical:
      "For an 80 kg person that's about 130 g a day. Getting there matters far more than what you eat it as or when. Beyond it, more protein is not doing what the tub says it is.",
    strength: "strong",
    agreement: "consistent",
    limits:
      "It's a population average with wide individual variation, derived largely from supplementation trials in healthy adults. Older adults may need more, and the benefit of supplementing at all shrinks if you already eat enough.",
    tags: ["protein", "how much protein", "grams", "diet", "shake", "whey", "muscle"],
    sources: [
      {
        authors: "Morton RW, Murphy KT, McKellar SR, Schoenfeld BJ, Henselmans M, Helms E, Aragon AA, Devries MC, Banfield L, Krieger JW, Phillips SM",
        year: 2018,
        title:
          "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults",
        journal: "British Journal of Sports Medicine",
        locator: "52(6):376–384",
        doi: "10.1136/bjsports-2017-097608",
        design: "meta-analysis",
      },
    ],
  },
  {
    id: "protein-distribution",
    topic: "nutrition",
    claim:
      "Spreading protein across the day in reasonably sized meals is a sensible default for muscle building.",
    practical:
      "Roughly four meals, each with a decent portion of protein, is easier than agonising over any single one. Hitting the daily total is the part that matters; distribution is a refinement on top.",
    strength: "moderate",
    agreement: "mostly",
    limits:
      "The per-meal ceilings often quoted come from short studies, not long-term training. A 2023 trial found a 100 g dose kept building muscle protein for longer than a 25 g dose, so there is no hard limit on what one meal can use. Spreading meals out is a convenient default, not a requirement.",
    tags: ["protein", "meals", "timing", "distribution", "per meal", "breakfast", "how often"],
    sources: [
      {
        authors: "Schoenfeld BJ, Aragon AA",
        year: 2018,
        title:
          "How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution",
        journal: "Journal of the International Society of Sports Nutrition",
        locator: "15:10",
        doi: "10.1186/s12970-018-0215-1",
        design: "review",
      },
      {
        authors: "Trommelen J, van Lieshout GAA, Nyakayiru J, Holwerda AM, Smeets JSJ, Hendriks FK, van Kranenburg JMX, Zorenc AH, et al.",
        year: 2023,
        title:
          "The anabolic response to protein ingestion during recovery from exercise has no upper limit in magnitude and duration in vivo in humans",
        journal: "Cell Reports Medicine",
        locator: "4(12):101324",
        doi: "10.1016/j.xcrm.2023.101324",
        design: "trial",
      },
    ],
  },
  {
    id: "anabolic-window-overstated",
    topic: "nutrition",
    claim:
      "The narrow post-workout 'anabolic window' is far less important than total daily intake.",
    practical:
      "You do not need a shake within thirty minutes. Eat properly across the day and the timing looks after itself.",
    strength: "moderate",
    agreement: "mostly",
    tags: ["timing", "post workout", "shake", "anabolic window", "after training", "protein"],
    sources: [
      {
        authors: "Aragon AA, Schoenfeld BJ",
        year: 2013,
        title: "Nutrient timing revisited: is there a post-exercise anabolic window?",
        journal: "Journal of the International Society of Sports Nutrition",
        locator: "10:5",
        doi: "10.1186/1550-2783-10-5",
        design: "review",
        olderBecause:
          "The original review. The 2017 ISSN position stand on nutrient timing (Kerksick et al.) reaches the same conclusion.",
      },
      {
        authors: "Kerksick CM, Arent S, Schoenfeld BJ, Stout JR, Campbell B, Wilborn CD, Taylor L, Kalman D, et al.",
        year: 2017,
        title:
          "International Society of Sports Nutrition position stand: nutrient timing",
        journal: "Journal of the International Society of Sports Nutrition",
        locator: "14:33",
        doi: "10.1186/s12970-017-0189-4",
        design: "consensus",
      },
    ],
  },
  {
    id: "slow-fat-loss-protects-muscle",
    topic: "nutrition",
    claim:
      "Losing weight slowly, with adequate protein and continued resistance training, preserves lean mass and performance better than losing it fast.",
    practical:
      "An aggressive deficit costs you muscle and strength alongside the fat, and the strength loss shows up in your logged sessions. Slower is not just kinder, it's a better result.",
    strength: "moderate",
    agreement: "mostly",
    limits:
      "The direct comparison of slow and fast loss is one trial in elite athletes. A 2022 meta-analysis found that an energy deficit of around 500 calories a day was enough to stop lean mass gains from training, though strength still improved. The direction is well supported; the exact rate that suits an individual isn't something a study can set.",
    tags: ["fat loss", "cutting", "deficit", "diet", "weight loss", "losing muscle", "calories"],
    sources: [
      {
        authors: "Garthe I, Raastad T, Refsnes PE, Koivisto A, Sundgot-Borgen J",
        year: 2011,
        title:
          "Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes",
        journal: "International Journal of Sport Nutrition and Exercise Metabolism",
        locator: "21(2):97–104",
        doi: "10.1123/ijsnem.21.2.97",
        design: "trial",
        olderBecause:
          "The only controlled trial of weight-loss rate in trained athletes. A 2022 meta-analysis (Murphy & Koehler) found larger daily deficits cost more lean mass, which points the same way.",
      },
      {
        authors: "Murphy C, Koehler K",
        year: 2022,
        title:
          "Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression",
        journal: "Scandinavian Journal of Medicine & Science in Sports",
        locator: "32(1):125–137",
        doi: "10.1111/sms.14075",
        design: "meta-analysis",
      },
    ],
  },
  {
    id: "under-fuelling-is-a-real-risk",
    topic: "nutrition",
    claim:
      "Persistently eating too little for the training you do harms bone, hormonal and metabolic health, not just performance.",
    practical:
      "If training is going backwards while you're eating less and less, that's a signal to eat more, not to train harder. This affects men as well as women, and recreational trainees as well as athletes.",
    strength: "strong",
    agreement: "consistent",
    limits:
      "Recognising this pattern is a clinical matter. If it sounds familiar, that's a conversation with a doctor or a registered dietitian, not with an app.",
    tags: [
      "under eating",
      "energy availability",
      "reds",
      "periods stopped",
      "bone",
      "fatigue",
      "not eating enough",
    ],
    sources: [
      {
        authors:
          "Mountjoy M, Ackerman KE, Bailey DM, Burke LM, Constantini N, Hackney AC, Heikura IA, Melin A, Pensgaard AM, Stellingwerff T, Sundgot-Borgen JK, Torstveit MK, Jacobsen AU, Verhagen E, Budgett R, Engebretsen L, Erdener U",
        year: 2023,
        title:
          "2023 International Olympic Committee's (IOC) consensus statement on Relative Energy Deficiency in Sport (REDs)",
        journal: "British Journal of Sports Medicine",
        locator: "57(17):1073–1097",
        doi: "10.1136/bjsports-2023-106994",
        design: "consensus",
      },
    ],
  },
  {
    id: "creatine-works",
    topic: "nutrition",
    claim:
      "Creatine monohydrate is effective for increasing muscle mass and strength alongside training, and is safe in healthy people at recommended doses.",
    practical:
      "One of very few supplements with a genuine evidence base. Monohydrate is the studied form; the expensive variants have nothing extra behind them.",
    strength: "strong",
    agreement: "consistent",
    limits:
      "The position stand is from a body with industry links, which is worth knowing — though the underlying literature on monohydrate is large and consistent. Anyone with kidney disease should ask a doctor first.",
    tags: ["creatine", "supplement", "monohydrate", "worth taking", "safe"],
    sources: [
      {
        authors:
          "Kreider RB, Kalman DS, Antonio J, Ziegenfuss TN, Wildman R, Collins R, Candow DG, Kleiner SM, Almada AL, Lopez HL",
        year: 2017,
        title:
          "International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine",
        journal: "Journal of the International Society of Sports Nutrition",
        locator: "14:18",
        doi: "10.1186/s12970-017-0173-z",
        design: "consensus",
      },
    ],
  },
  {
    id: "caffeine-works",
    topic: "nutrition",
    claim: "Caffeine improves several aspects of exercise performance.",
    practical:
      "Coffee before training is a legitimate performance aid, not a placebo. Its downside is what it does to sleep — and sleep is doing more for your training than the caffeine is.",
    strength: "strong",
    agreement: "consistent",
    limits:
      "Individual response varies a lot, and tolerance builds. Anyone with a heart condition, high blood pressure, or who is pregnant should take medical advice on intake.",
    tags: ["caffeine", "coffee", "pre workout", "energy", "supplement", "stimulant"],
    sources: [
      {
        authors: "Grgic J, Grgic I, Pickering C, Schoenfeld BJ, Bishop DJ, Pedisic Z",
        year: 2020,
        title:
          "Wake up and smell the coffee: caffeine supplementation and exercise performance — an umbrella review of 21 published meta-analyses",
        journal: "British Journal of Sports Medicine",
        locator: "54(11):681–688",
        doi: "10.1136/bjsports-2018-100278",
        design: "umbrella-review",
      },
    ],
  },
  {
    id: "carbohydrate-fuels-hard-work",
    topic: "nutrition",
    claim:
      "Carbohydrate availability is a determinant of performance in prolonged and high-intensity training.",
    practical:
      "If sessions are falling apart late on, being under-fuelled is a likelier explanation than being under-trained. Eat properly before hard or long sessions.",
    strength: "strong",
    agreement: "consistent",
    tags: ["carbs", "carbohydrate", "fuel", "energy", "before training", "bonking", "flat"],
    sources: [
      {
        authors: "Thomas DT, Erdman KA, Burke LM",
        year: 2016,
        title: "Nutrition and athletic performance",
        journal: "Medicine & Science in Sports & Exercise",
        locator: "48(3):543–568",
        doi: "10.1249/MSS.0000000000000852",
        design: "consensus",
      },
    ],
  },
  {
    id: "most-supplements-do-little",
    topic: "nutrition",
    claim:
      "Only a small number of supplements have credible performance evidence behind them.",
    practical:
      "Creatine and caffeine have real support. Most of the rest of the shelf does not, and supplements also carry a contamination risk that matters if you're ever tested. Food, sleep and consistency are where the returns are.",
    strength: "strong",
    agreement: "consistent",
    tags: ["supplements", "bcaa", "pre workout", "worth it", "pills", "powder", "fat burner"],
    sources: [
      {
        authors: "Thomas DT, Erdman KA, Burke LM",
        year: 2016,
        title: "Nutrition and athletic performance",
        journal: "Medicine & Science in Sports & Exercise",
        locator: "48(3):543–568",
        doi: "10.1249/MSS.0000000000000852",
        design: "consensus",
      },
    ],
  },
];
