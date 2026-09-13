// Validates the exercise library: resolves cross-file id references and
// reports coverage per equipment profile. Run with: npm run check:exercises
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src/lib/exercises");
const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "types.ts" && f !== "index.ts");

const exercises = [];
for (const file of files) {
  // Normalised because git on Windows checks these out with CRLF endings,
  // and the block split below matches on bare newlines.
  const src = readFileSync(join(dir, file), "utf8").replace(/\r\n/g, "\n");
  // Each entry is an object literal with an `id:` field; pull the fields we check.
  const blocks = src.split(/\n  \{\n/).slice(1);
  for (const block of blocks) {
    const id = block.match(/id: "([^"]+)"/)?.[1];
    if (!id) continue;
    exercises.push({
      id,
      file,
      level: Number(block.match(/level: (\d)/)?.[1] ?? 0),
      pattern: block.match(/pattern: "([^"]+)"/)?.[1],
      equipment: [...block.matchAll(/equipment: \[([^\]]*)\]/g)][0]?.[1]
        ?.split(",")
        .map((s) => s.trim().replace(/"/g, ""))
        .filter(Boolean) ?? [],
      easier: block.match(/easier: "([^"]+)"/)?.[1],
      harder: block.match(/harder: "([^"]+)"/)?.[1],
      substitutes: [...block.matchAll(/substitutes: \[([^\]]*)\]/g)][0]?.[1]
        ?.split(",")
        .map((s) => s.trim().replace(/"/g, ""))
        .filter(Boolean) ?? [],
    });
  }
}

const byId = new Map(exercises.map((e) => [e.id, e]));
const problems = [];

const seen = new Set();
for (const ex of exercises) {
  if (seen.has(ex.id)) problems.push(`duplicate id "${ex.id}" (${ex.file})`);
  seen.add(ex.id);
  for (const field of ["easier", "harder"]) {
    if (ex[field] && !byId.has(ex[field])) {
      problems.push(`${ex.id}.${field} -> missing "${ex[field]}" (${ex.file})`);
    }
  }
  for (const sub of ex.substitutes) {
    if (!byId.has(sub)) problems.push(`${ex.id}.substitutes -> missing "${sub}" (${ex.file})`);
  }
}

console.log(`Loaded ${exercises.length} exercises from ${files.length} files\n`);

const profiles = {
  "Nothing at all": ["bodyweight"],
  "Bands only": ["bodyweight", "bands"],
  "Chair + bands (low impact)": ["bodyweight", "chair", "bands", "mat"],
  "Dumbbells at home": ["bodyweight", "dumbbell", "mat"],
  "Home gym": ["bodyweight", "dumbbell", "bench", "pullup_bar", "bands", "mat"],
  "Full gym": [
    "bodyweight", "barbell", "dumbbell", "kettlebell", "cable", "machine",
    "squat_rack", "bench", "pullup_bar", "cardio", "mat",
  ],
};

console.log("Coverage by equipment profile:");
for (const [label, owned] of Object.entries(profiles)) {
  const set = new Set([...owned, "bodyweight"]);
  const usable = exercises.filter((ex) => ex.equipment.every((r) => set.has(r)));
  const patterns = new Set(usable.map((e) => e.pattern));
  console.log(
    `  ${label.padEnd(28)} ${String(usable.length).padStart(3)} exercises, ${patterns.size} patterns`
  );
}

if (problems.length) {
  console.log(`\n${problems.length} broken reference(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("\nAll cross-references resolve.");
