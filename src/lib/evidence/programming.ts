import type { Finding } from "./types";

/**
 * How training is arranged: sets, reps, load, frequency, effort, rest.
 * The best-evidenced area in the whole library, and the one that governs what
 * the plan generator actually does.
 */
export const PROGRAMMING: Finding[] = [
  {
    id: "volume-dose-response",
    topic: "programming",
    claim: "More hard sets per muscle per week produce more growth, across the range most people train in.",
    practical:
      "If growth has stalled and you're recovering fine, adding a set or two per muscle per week is the first lever to pull — before changing exercises or chasing a new programme.",
    strength: "strong",
    limits:
      "The relationship is graded, not unlimited: gains per extra set shrink as volume climbs, and more sets cost more time and more fatigue. Most of the underlying studies are short and run on younger men.",
    tags: ["volume", "sets", "growth", "hypertrophy", "plateau", "stalled", "muscle"],
    sources: [
      {
        authors: "Schoenfeld BJ, Ogborn D, Krieger JW",
        year: 2017,
        title:
          "Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis",
        journal: "Journal of Sports Sciences",
        locator: "35(11):1073–1082",
        doi: "10.1080/02640414.2016.1210197",
      },
      {
        authors: "Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC",
        year: 2026,
        title:
          "The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains",
        journal: "Sports Medicine",
        locator: "56(2):481–505",
        doi: "10.1007/s40279-025-02344-w",
      },
    ],
  },
  {
    id: "count-indirect-sets-as-half",
    topic: "programming",
    claim:
      "When adding up a muscle's weekly sets, work that hits it indirectly is best counted as half a set.",
    practical:
      "A bench press is real work for your triceps, but not the same as a triceps exercise. Counting it as a full triceps set overstates what they're getting; ignoring it understates it. Half is the count that best matched real results across the research, and it's how this app adds up your week.",
    strength: "moderate",
    limits:
      "This is the counting method that best predicted outcomes across 67 studies, not a direct test of any one exercise or muscle. The participants averaged 25 years old and were mostly men.",
    tags: ["indirect sets", "counting sets", "weekly sets", "indirect", "compound lifts", "triceps", "biceps"],
    sources: [
      {
        authors: "Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC",
        year: 2026,
        title:
          "The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains",
        journal: "Sports Medicine",
        locator: "56(2):481–505",
        doi: "10.1007/s40279-025-02344-w",
      },
    ],
  },
  {
    id: "beginners-start-small",
    topic: "programming",
    claim:
      "People new to lifting make real gains from very little, though more volume produces more, even at the start.",
    practical:
      "A new lifter's first weeks don't need to be long to work — around four hard sets a muscle a week is enough to make progress. That's why the app starts beginners on less: it's easier to recover from and to keep turning up for. It's a starting point, not a ceiling. More volume still pays off early, and the plan grows as you do.",
    strength: "limited",
    limits:
      "The comparison of one set against three comes from a single eight-week trial of 34 sedentary young men, where three sets did better. The four-set minimum is a practical recommendation from a narrative review, not a trial designed to find a beginner's ideal dose. Starting beginners lower is partly a judgement about recovery and sticking with it, not a finding that less is better.",
    tags: ["beginner", "novice", "new to lifting", "starting out", "first weeks", "never lifted"],
    sources: [
      {
        authors: "Iversen VM, Norum M, Schoenfeld BJ, Fimland MS",
        year: 2021,
        title:
          "No time to lift? Designing time-efficient training programs for strength and hypertrophy: a narrative review",
        journal: "Sports Medicine",
        locator: "51(10):2079–2095",
        doi: "10.1007/s40279-021-01490-1",
      },
      {
        authors: "Coskun IA, Kafkas ME",
        year: 2026,
        title:
          "Comparative effects of single vs. multiple-set resistance training on neuromuscular performance and muscle morphology in sedentary men",
        journal: "BMC Sports Science, Medicine and Rehabilitation",
        doi: "10.1186/s13102-026-01874-8",
      },
    ],
  },
  {
    id: "frequency-follows-volume",
    topic: "programming",
    claim:
      "Once weekly volume is matched, splitting it across more sessions doesn't add growth.",
    practical:
      "Train each muscle as often as your week allows. Three sessions or six makes little difference to growth if the total number of hard sets is the same — so pick the split you'll actually turn up for.",
    strength: "strong",
    limits:
      "Higher frequency can still help indirectly: more sessions make a large weekly volume easier to fit and easier to recover between. This is about frequency itself, not about what frequency lets you do.",
    tags: ["frequency", "split", "days", "schedule", "how often", "twice a week"],
    sources: [
      {
        authors: "Schoenfeld BJ, Grgic J, Krieger J",
        year: 2019,
        title:
          "How many times per week should a muscle be trained to maximize muscle hypertrophy? A systematic review and meta-analysis of studies examining the effects of resistance training frequency",
        journal: "Journal of Sports Sciences",
        locator: "37(11):1286–1295",
        doi: "10.1080/02640414.2018.1555906",
      },
    ],
  },
  {
    id: "load-range-hypertrophy",
    topic: "programming",
    claim:
      "Light and heavy loads build similar amounts of muscle when sets are taken close to failure.",
    practical:
      "You don't need heavy weight to grow. Sets of 20 with something light build muscle much like sets of 6 with something heavy, provided you push both near your limit. That matters most when your equipment is limited or a joint won't tolerate load.",
    strength: "strong",
    limits:
      "The equivalence holds for muscle size, not for strength — and light sets have to be genuinely hard, which most people find far less pleasant than lifting heavy.",
    tags: ["reps", "load", "light weights", "heavy", "rep range", "bands", "bodyweight", "home"],
    sources: [
      {
        authors: "Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW",
        year: 2017,
        title:
          "Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis",
        journal: "Journal of Strength and Conditioning Research",
        locator: "31(12):3508–3523",
        doi: "10.1519/JSC.0000000000002200",
      },
    ],
  },
  {
    id: "load-for-strength",
    topic: "programming",
    claim: "Strength, unlike size, does depend on training with heavy loads.",
    practical:
      "If the goal is a bigger one-rep max, some of your work has to be heavy and low-rep. Sets of fifteen build the muscle but not the skill of expressing force against a heavy bar.",
    strength: "strong",
    tags: ["strength", "heavy", "1rm", "max", "powerlifting", "low reps"],
    sources: [
      {
        authors: "Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW",
        year: 2017,
        title:
          "Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis",
        journal: "Journal of Strength and Conditioning Research",
        locator: "31(12):3508–3523",
        doi: "10.1519/JSC.0000000000002200",
      },
      {
        authors:
          "Currier BS, McLeod JC, Banfield L, Beyene J, Welton NJ, D'Souza AC, Keogh JAJ, Lin L, Coletta G, Yang A, Colenso-Semple LM, Lau KJ, Verboom A, Phillips SM",
        year: 2023,
        title:
          "Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis",
        journal: "British Journal of Sports Medicine",
        locator: "57:1211–1220",
        doi: "10.1136/bjsports-2023-106807",
      },
    ],
  },
  {
    id: "goal-changes-prescription",
    topic: "programming",
    claim:
      "Strength and size respond to different things: strength to intensity, size to volume.",
    practical:
      "This is why the same exercise gets different numbers depending on your goal. Chasing strength means fewer reps and heavier weight; chasing size means more total hard sets, and the weight matters less.",
    strength: "moderate",
    limits:
      "The two overlap enormously — almost any sensible programme moves both. This shapes emphasis, not category.",
    tags: ["goal", "sets", "reps", "prescription", "why these numbers", "strength", "hypertrophy"],
    sources: [
      {
        authors:
          "Currier BS, McLeod JC, Banfield L, Beyene J, Welton NJ, D'Souza AC, Keogh JAJ, Lin L, Coletta G, Yang A, Colenso-Semple LM, Lau KJ, Verboom A, Phillips SM",
        year: 2023,
        title:
          "Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis",
        journal: "British Journal of Sports Medicine",
        locator: "57:1211–1220",
        doi: "10.1136/bjsports-2023-106807",
      },
    ],
  },
  {
    id: "failure-not-required",
    topic: "programming",
    claim:
      "Training to absolute failure isn't necessary, and for strength it may be counterproductive.",
    practical:
      "Stopping one to three reps short of failure gets you almost all of the growth and leaves you far fresher for the rest of the session and the week. For strength work specifically, grinding to failure appears to offer no advantage.",
    strength: "moderate",
    limits:
      "Proximity to failure is estimated in most of these studies rather than measured, and people are unreliable judges of how many reps they had left — beginners especially tend to stop well short of where they think they are.",
    tags: ["failure", "rir", "rpe", "effort", "how hard", "last rep", "grinding"],
    sources: [
      {
        authors: "Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC",
        year: 2024,
        title:
          "Exploring the dose-response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy: a series of meta-regressions",
        journal: "Sports Medicine",
        locator: "54(9):2209–2231",
        doi: "10.1007/s40279-024-02069-2",
      },
      {
        authors: "Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ",
        year: 2023,
        title:
          "Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis",
        journal: "Sports Medicine",
        locator: "53(3):649–665",
        doi: "10.1007/s40279-022-01784-y",
      },
    ],
  },
  {
    id: "effort-gauged-by-reps-left",
    topic: "programming",
    claim:
      "Rating a set by how many reps you had left is a usable way to gauge effort, and gets more accurate as you get more experienced.",
    practical:
      "This is what the effort rating after each exercise is for. It's how the app knows the difference between 'made the reps comfortably' and 'barely survived' — two sessions that look identical in the numbers but mean opposite things for next week.",
    strength: "moderate",
    limits:
      "Accuracy is best close to failure and with heavier loads. On light, high-rep sets, and among untrained lifters, estimates drift a long way from reality.",
    tags: ["rpe", "rir", "effort", "rating", "how hard was that", "reps in reserve"],
    sources: [
      {
        authors:
          "Zourdos MC, Klemp A, Dolan C, Quiles JM, Schau KA, Jo E, Helms E, Esgro B, Duncan S, Garcia Merino S, Blanco R",
        year: 2016,
        title:
          "Novel resistance training-specific rating of perceived exertion scale measuring repetitions in reserve",
        journal: "Journal of Strength and Conditioning Research",
        locator: "30(1):267–275",
        doi: "10.1519/JSC.0000000000001049",
      },
    ],
  },
  {
    id: "minimum-effective-dose",
    topic: "programming",
    claim:
      "A single hard set per exercise, once to three times a week, is enough to increase strength in trained men.",
    practical:
      "On a week where everything is going wrong, one working set is not a wasted session — it's most of the maintenance benefit. Doing something small beats skipping.",
    strength: "moderate",
    limits:
      "This is the minimum to keep gaining strength, not the amount that maximises anything, and the studies were in resistance-trained men. Size responds to volume far more than strength does.",
    tags: [
      "minimum",
      "busy",
      "short on time",
      "no time",
      "only have minutes",
      "quick session",
      "short session",
      "rushed",
      "maintenance",
      "one set",
    ],
    sources: [
      {
        authors: "Androulakis-Korakakis P, Fisher JP, Steele J",
        year: 2020,
        title:
          "The minimum effective training dose required to increase 1RM strength in resistance-trained men: a systematic review and meta-analysis",
        journal: "Sports Medicine",
        locator: "50:751–765",
        doi: "10.1007/s40279-019-01236-0",
      },
    ],
  },
  {
    id: "rest-between-sets",
    topic: "programming",
    claim:
      "Longer rests between sets support greater strength gains, particularly in trained lifters.",
    practical:
      "Rushing the rest on a heavy compound costs you reps on the next set, and those reps are the training. Two to three minutes on main lifts is not wasted time. Short rests are fine on isolation work, where the limiting factor isn't systemic fatigue.",
    strength: "moderate",
    tags: ["rest", "between sets", "timer", "how long", "recovery between sets"],
    sources: [
      {
        authors: "Grgic J, Schoenfeld BJ, Skrepnik M, Davies TB, Mikulic P",
        year: 2018,
        title:
          "Effects of rest interval duration in resistance training on measures of muscular strength: a systematic review",
        journal: "Sports Medicine",
        locator: "48:137–151",
        doi: "10.1007/s40279-017-0788-x",
      },
    ],
  },
  {
    id: "full-range-of-motion",
    topic: "programming",
    claim: "Training through a full range of motion generally beats cutting it short.",
    practical:
      "Take the squat to depth and let the dumbbell down all the way. Half reps with more weight on the bar look better and work less — and the stretched part of the movement seems to be where much of the benefit lives.",
    strength: "moderate",
    limits:
      "Range should be the range you can control and tolerate. A joint that hurts at the bottom is a reason to shorten the range for now, not to force it.",
    tags: ["range of motion", "rom", "depth", "partial reps", "half reps", "form", "technique"],
    sources: [
      {
        authors: "Wolf M, Androulakis-Korakakis P, Fisher J, Schoenfeld B, Steele J",
        year: 2023,
        title: "Partial vs full range of motion resistance training: a systematic review and meta-analysis",
        journal: "International Journal of Strength and Conditioning",
        locator: "3(1)",
        doi: "10.47206/ijsc.v3i1.182",
      },
    ],
  },
  {
    id: "periodisation-small-edge",
    topic: "programming",
    claim:
      "Structured variation in training over time gives a small strength advantage over keeping everything constant.",
    practical:
      "Worth something, but far less than showing up and adding weight when you earn it. Elaborate periodisation is not what stands between most people and progress.",
    strength: "moderate",
    limits:
      "The comparison is contested — critics argue the periodised groups often did more total work, which would explain the difference without periodisation itself doing anything.",
    tags: ["periodisation", "programme", "block", "variation", "structure", "deload"],
    sources: [
      {
        authors: "Williams TD, Tolusso DV, Fedewa MV, Esco MR",
        year: 2017,
        title:
          "Comparison of periodized and non-periodized resistance training on maximal strength: a meta-analysis",
        journal: "Sports Medicine",
        locator: "47(10):2083–2100",
        doi: "10.1007/s40279-017-0734-y",
      },
    ],
  },
  {
    id: "cardio-does-not-kill-gains",
    topic: "programming",
    claim:
      "Doing cardio alongside lifting doesn't compromise muscle size or maximal strength.",
    practical:
      "You can train for your heart and your legs in the same week. Explosive, jumping-type strength is the one quality that may suffer, so if that's what you're training for, keep hard cardio away from those sessions.",
    strength: "moderate",
    limits:
      "This is about compatibility, not free lunch — a very large amount of hard endurance work still competes for the recovery your lifting needs.",
    tags: ["cardio", "running", "interference", "concurrent", "conditioning", "endurance", "steps"],
    sources: [
      {
        authors: "Schumann M, Feuerbacher JF, Sünkeler M, Freitag N, Rønnestad BR, Doma K, Lundberg TR",
        year: 2022,
        title:
          "Compatibility of concurrent aerobic and strength training for skeletal muscle size and function: an updated systematic review and meta-analysis",
        journal: "Sports Medicine",
        locator: "52(3):601–612",
        doi: "10.1007/s40279-021-01587-7",
      },
    ],
  },
  {
    id: "older-adults-adapt",
    topic: "programming",
    claim:
      "Older adults gain muscle and strength from resistance training, and should train with meaningful load rather than token weights.",
    practical:
      "Age changes the starting point and the rate of progress, not the method. Progressive resistance training is recommended for older adults specifically to preserve strength, function and independence.",
    strength: "strong",
    limits:
      "Existing conditions and medications matter, and anyone starting later in life with a medical history should get individual clearance first.",
    tags: [
      "older",
      "age",
      "elderly",
      "senior",
      "retired",
      "sarcopenia",
      "too old",
      "too late",
      "late to start",
      "start lifting",
      "never lifted",
    ],
    sources: [
      {
        authors: "Fragala MS, Cadore EL, Dorgo S, Izquierdo M, Kraemer WJ, Peterson MD, Ryan ED",
        year: 2019,
        title:
          "Resistance training for older adults: position statement from the National Strength and Conditioning Association",
        journal: "Journal of Strength and Conditioning Research",
        locator: "33(8):2019–2052",
        doi: "10.1519/JSC.0000000000003230",
      },
    ],
  },
  {
    id: "balance-exercise-prevents-falls",
    topic: "programming",
    claim:
      "In older adults, balance and functional exercise reduces the rate of falls by about a quarter.",
    practical:
      "A few minutes of standing balance work — one foot, or heel to toe, with something to hold nearby — belongs in every session from your mid-sixties on, alongside the lifting rather than instead of it.",
    strength: "strong",
    limits:
      "The trials are mostly in people living at home, averaging mid-seventies. Whether it prevents fall-related fractures is less certain than whether it prevents falls.",
    tags: ["falls", "fall", "balance", "unsteady", "wobbly", "older", "osteoporosis", "fracture"],
    sources: [
      {
        authors:
          "Sherrington C, Fairhall NJ, Wallbank GK, Tiedemann A, Michaleff ZA, Howard K, Clemson L, Hopewell S, Lamb SE",
        year: 2019,
        title: "Exercise for preventing falls in older people living in the community",
        journal: "Cochrane Database of Systematic Reviews",
        locator: "1(1):CD012424",
        doi: "10.1002/14651858.CD012424.pub2",
      },
      {
        authors: "Bull FC, Al-Ansari SS, Biddle S, Borodulin K, Buman MP, Cardon G, et al.",
        year: 2020,
        title: "World Health Organization 2020 guidelines on physical activity and sedentary behaviour",
        journal: "British Journal of Sports Medicine",
        locator: "54(24):1451–1462",
        doi: "10.1136/bjsports-2020-102955",
      },
    ],
  },
  {
    id: "menstrual-cycle-no-special-programming",
    topic: "programming",
    claim:
      "Current evidence shows no consistent effect of menstrual cycle phase on strength performance or on gains from resistance training.",
    practical:
      "There's no good basis for restructuring a training week around cycle phase. Symptoms are real and worth adjusting a session for on the day — but that's autoregulation, the same as adjusting for a bad night's sleep, not a different programme.",
    strength: "moderate",
    limits:
      "The underlying studies are mostly small and methodologically weak, which is exactly why strong phase-based claims aren't supportable in either direction.",
    tags: ["menstrual", "cycle", "period", "women", "female", "hormones", "training around"],
    sources: [
      {
        authors: "Colenso-Semple LM, D'Souza AC, Elliott-Sale KJ, Phillips SM",
        year: 2023,
        title:
          "Current evidence shows no influence of women's menstrual cycle phase on acute strength performance or adaptations to resistance exercise training",
        journal: "Frontiers in Sports and Active Living",
        locator: "5:1054542",
        doi: "10.3389/fspor.2023.1054542",
      },
    ],
  },
  {
    id: "activity-guidelines",
    topic: "programming",
    claim:
      "The WHO recommends 150–300 minutes of moderate aerobic activity a week, plus muscle-strengthening work on two or more days.",
    practical:
      "Two full-body sessions a week already meets the strength half of the international guideline. That's the floor for health, not the ceiling for progress — but it's a much lower bar than most people assume.",
    strength: "strong",
    tags: ["guidelines", "how much", "minimum", "health", "beginner", "recommended", "who"],
    sources: [
      {
        authors: "Bull FC, Al-Ansari SS, Biddle S, Borodulin K, Buman MP, Cardon G, et al.",
        year: 2020,
        title: "World Health Organization 2020 guidelines on physical activity and sedentary behaviour",
        journal: "British Journal of Sports Medicine",
        locator: "54(24):1451–1462",
        doi: "10.1136/bjsports-2020-102955",
      },
    ],
  },
  {
    id: "strength-training-and-mortality",
    topic: "programming",
    claim:
      "Muscle-strengthening activity is associated with lower all-cause mortality and lower risk of major chronic disease.",
    practical:
      "Around 30–60 minutes a week of strengthening work is associated with most of the observed benefit. Lifting is not only cosmetic, and the dose that matters for health is small.",
    strength: "moderate",
    limits:
      "These are observational cohorts, so they show association rather than proof of cause, and people who lift differ from people who don't in many other ways.",
    tags: ["health", "longevity", "mortality", "disease", "why lift", "benefits", "heart"],
    sources: [
      {
        authors: "Momma H, Kawakami R, Honda T, Sawada SS",
        year: 2022,
        title:
          "Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases: a systematic review and meta-analysis of cohort studies",
        journal: "British Journal of Sports Medicine",
        locator: "56(13):755–763",
        doi: "10.1136/bjsports-2021-105061",
      },
    ],
  },
  {
    id: "multiple-sets-beat-one-for-strength",
    topic: "programming",
    claim: "Doing several sets per exercise produces greater strength gains than doing one.",
    practical:
      "One set is enough to keep progressing, but it isn't the amount that maximises it. Where time allows, multiple working sets on the main lifts are the better trade.",
    strength: "moderate",
    limits:
      "The advantage of more sets flattens off, and the studies vary widely in how they counted volume in the first place.",
    tags: ["sets", "how many sets", "volume", "strength", "one set", "3 sets"],
    sources: [
      {
        authors: "Ralston GW, Kilgore L, Wyatt FB, Baker JS",
        year: 2017,
        title: "The effect of weekly set volume on strength gain: a meta-analysis",
        journal: "Sports Medicine",
        locator: "47(12):2585–2601",
        doi: "10.1007/s40279-017-0762-7",
      },
    ],
  },
  {
    id: "warm-up-helps",
    topic: "programming",
    claim: "Warming up improves performance in the large majority of studies that measured it.",
    practical:
      "A few progressively heavier sets before your working weight isn't a formality — it's a measurable performance gain and it costs five minutes.",
    strength: "moderate",
    limits:
      "The review found most warm-ups helped and few hurt, but warm-up protocols vary so much that no single recipe is established.",
    tags: ["warm up", "warmup", "before", "first set", "preparation", "ramp up"],
    sources: [
      {
        authors: "Fradkin AJ, Zazryn TR, Smoliga JM",
        year: 2010,
        title: "Effects of warming-up on physical performance: a systematic review with meta-analysis",
        journal: "Journal of Strength and Conditioning Research",
        locator: "24(1):140–148",
        doi: "10.1519/JSC.0b013e3181c643a0",
      },
    ],
  },
  {
    id: "lifting-tempo-is-flexible",
    topic: "programming",
    claim:
      "Rep speeds anywhere from about half a second to eight seconds per rep produce similar muscle growth.",
    practical:
      "Control the weight rather than counting seconds. Prescribed tempos aren't doing much beyond keeping you honest about not throwing the weight around.",
    strength: "moderate",
    limits: "Very slow reps — beyond roughly ten seconds — do appear to be worse for growth.",
    tags: ["tempo", "speed", "slow reps", "eccentric", "control", "3 seconds down"],
    sources: [
      {
        authors: "Schoenfeld BJ, Ogborn DI, Krieger JW",
        year: 2015,
        title:
          "Effect of repetition duration during resistance training on muscle hypertrophy: a systematic review and meta-analysis",
        journal: "Sports Medicine",
        locator: "45(4):577–585",
        doi: "10.1007/s40279-015-0304-0",
      },
    ],
  },
  {
    id: "machines-and-free-weights-both-work",
    topic: "programming",
    claim: "Machines and free weights build muscle equally well.",
    practical:
      "Use whichever you'll do consistently and can load safely. A machine is not a lesser exercise, and it's often the better choice when balance, a sore joint, or training alone is the constraint.",
    strength: "moderate",
    limits:
      "Strength gains are somewhat specific to how you train — test yourself on a barbell and barbell training will look better. Free weights may also carry advantages for balance and sport transfer.",
    tags: ["machine", "free weights", "barbell", "dumbbell", "smith machine", "cable", "equipment"],
    sources: [
      {
        authors: "Haugen ME, Vårvik FT, Larsen S, Haugen AS, van den Tillaar R, Bjørnsen T",
        year: 2023,
        title:
          "Effect of free-weight vs. machine-based strength training on maximal strength, hypertrophy and jump performance — a systematic review and meta-analysis",
        journal: "BMC Sports Science, Medicine and Rehabilitation",
        doi: "10.1186/s13102-023-00713-4",
      },
    ],
  },
  {
    id: "resistance-training-and-bone",
    topic: "programming",
    claim: "Resistance training improves bone mineral density in postmenopausal women.",
    practical:
      "Loading bone is one of the few things that maintains it. This is a strong argument for lifting meaningful weight rather than very light weights, particularly around and after menopause.",
    strength: "moderate",
    limits:
      "Protocols vary widely across studies and the best one isn't settled. Anyone with diagnosed osteoporosis needs individual guidance before loading heavily.",
    tags: ["bone", "osteoporosis", "menopause", "bone density", "women", "older", "fracture"],
    sources: [
      {
        authors: "Wang et al.",
        year: 2023,
        title:
          "Comparative efficacy different resistance training protocols on bone mineral density in postmenopausal women: a systematic review and network meta-analysis",
        journal: "Frontiers in Physiology",
        locator: "14:1105303",
        doi: "10.3389/fphys.2023.1105303",
      },
    ],
  },
  {
    id: "detraining-is-slow",
    topic: "programming",
    claim: "Strength is lost much more slowly than people fear when training stops.",
    practical:
      "A missed week is nothing. A missed month costs you less than you think and comes back faster than it took to build. Don't restart from zero after a break — pick up near where you left off and let the effort rating tell you if it's too much.",
    strength: "moderate",
    limits:
      "Rates of loss differ by age, training history and what exactly is measured; power tends to fade faster than maximal strength.",
    tags: ["detraining", "break", "missed", "holiday", "time off", "illness", "starting again", "layoff"],
    sources: [
      {
        authors: "Bosquet L, Berryman N, Dupuy O, Mekary S, Arvisais D, Bherer L, Mujika I",
        year: 2013,
        title: "Effect of training cessation on muscular performance: a meta-analysis",
        journal: "Scandinavian Journal of Medicine & Science in Sports",
        locator: "23(3):e140–e149",
        doi: "10.1111/sms.12047",
      },
    ],
  },
];
