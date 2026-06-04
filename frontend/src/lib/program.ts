import { mockWorkoutWeek } from "@/mock-data/workouts";

export type SplitType = "PPL" | "UPPER_LOWER";

export type ProgramStatus = "collecting_baseline_week" | "active_mesocycle";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface ProgressionSettings {
  repProgression: number; // 0 | 1 | 2
  setProgressionEnabled: boolean;
  rpeProgression: number; // 0 | 0.5 | 1
}

export interface WeeklyCycleDay {
  dayOfWeek: DayOfWeek;
  workoutType: string | null; // null = rest day
}

export interface WeeklyCycle {
  days: WeeklyCycleDay[]; // length 7, Monday..Sunday
}

export interface LoggedExercise {
  name: string;
  sets: number;
  repRangeMin: number;
  repRangeMax: number;
  weight: number;
  rpe: number;
  muscleGroups: string[];
  originalName?: string;
  warmupSets?: string;
  earlySetRpe?: string;
  lastSetRpe?: string;
  restTime?: string;
  lastSetIntensityTechnique?: string;
  notes?: string;
  substitutionReason?: string;
  substitutions?: ExerciseSubstitutionOption[];
}

export type ExerciseSubstitutionSource = "template" | "custom";

export interface ExerciseSubstitutionOption {
  name: string;
  source: ExerciseSubstitutionSource;
  reason?: string;
  frequencyUsed?: number;
}

export type SubstitutionMemory = Record<string, ExerciseSubstitutionOption[]>;

export interface HeartRateData {
  avg: number;
  max?: number;
}

export type EnrichmentStatus = "manual" | "enriched";

export interface WorkoutStravaData {
  activityId: string;
  durationMinutes: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  distanceKm?: number;
}

export interface LoggedWorkout {
  id: string;
  dayOfWeek: DayOfWeek;
  workoutType: string; // split slot, e.g. "Push" | "Pull" | "Legs" | "Upper" | "Lower"
  exercises: LoggedExercise[];
  loggedAt: string;
  templateName?: string;
  templateDescription?: string;
  templateWeek?: string;

  // Optional physiological inputs captured manually alongside the lifting data.
  heartRate?: HeartRateData;
  effort?: number; // perceived effort 1-10
  durationMinutes?: number;
  notes?: string;
  sessionType?: string; // defaults to workoutType when not set

  // Populated only after a confirmed Strava mapping (see enrichWorkout).
  stravaData?: WorkoutStravaData;
  enrichmentStatus?: EnrichmentStatus;
}

/**
 * A single activity returned by the Strava sync. Kept provider-agnostic so the
 * mock and real backend services can both produce this shape.
 */
export interface StravaActivity {
  activityId: string;
  name: string;
  durationMinutes: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  distanceKm?: number;
  startedAt: string;
}

/** A user-confirmed link between a logged workout and a Strava activity. */
export interface WorkoutMapping {
  workoutId: string;
  activityId: string;
}

export interface BaselineWeek {
  loggedWorkouts: LoggedWorkout[];
}

export interface MesocycleWeekDay {
  dayOfWeek: DayOfWeek;
  workoutType: string | null;
  workout: LoggedWorkout | null;
}

export interface MesocycleWeek {
  weekNumber: number;
  isBaseline: boolean;
  days: MesocycleWeekDay[];
  // Multi-block presets only: the training block this week belongs to and
  // whether it is a semi-deload week (lighter, RPE-capped).
  blockName?: string;
  isDeload?: boolean;
}

export interface Mesocycle {
  lengthWeeks: number;
  currentWeek: number;
  weeks: MesocycleWeek[];
}

export interface Program {
  id: string;
  name: string;
  splitType: SplitType;
  weeklyCycle: WeeklyCycle;
  mesocycleLengthWeeks: number;
  progression: ProgressionSettings;
  status: ProgramStatus;
  baselineWeek: BaselineWeek;
  substitutionMemory: SubstitutionMemory;
  mesocycle: Mesocycle | null;
  createdAt: string;
  // Present only for preset-based programs (e.g. Pure Bodybuilding). Each block
  // carries its own editable, per-user baseline workouts seeded from a template.
  // Plain custom programs leave this undefined and use the single baselineWeek.
  blocks?: ProgramBlock[];
}

/** A training block within a multi-block program (user-owned, editable copy). */
export interface ProgramBlock {
  id: string;
  name: string;
  phase: string;
  lengthWeeks: number;
  deloadWeeks: number[];
  baselineWorkouts: LoggedWorkout[];
}

export interface SplitSlotDefinition {
  slot: string;
  muscleGroups: string[];
}

export interface SplitDefinition {
  type: SplitType;
  label: string;
  slots: SplitSlotDefinition[];
}

export interface ScheduledSession {
  dayOfWeek: DayOfWeek;
  workoutType: string;
}

export interface WeeklyWorkload {
  frequencyByType: Record<string, number>;
  totalSessions: number;
  restDays: number;
}

export const SPLIT_DEFINITIONS: Record<SplitType, SplitDefinition> = {
  PPL: {
    type: "PPL",
    label: "Push / Pull / Legs",
    slots: [
      { slot: "Push", muscleGroups: ["Chest", "Shoulders", "Triceps"] },
      { slot: "Pull", muscleGroups: ["Back", "Biceps"] },
      { slot: "Legs", muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"] },
    ],
  },
  UPPER_LOWER: {
    type: "UPPER_LOWER",
    label: "Upper / Lower",
    slots: [
      { slot: "Upper #1", muscleGroups: ["Chest", "Back", "Shoulders", "Arms"] },
      { slot: "Lower #1", muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      { slot: "Upper #2", muscleGroups: ["Chest", "Back", "Shoulders", "Arms"] },
      { slot: "Lower #2", muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      { slot: "Arms & Weak Points", muscleGroups: ["Arms", "Core"] },
    ],
  },
};

export const MESOCYCLE_LENGTH_OPTIONS = [3, 4, 5, 6] as const;

export const REP_PROGRESSION_OPTIONS: { label: string; value: number }[] = [
  { label: "None", value: 0 },
  { label: "+1 Rep Weekly", value: 1 },
  { label: "+2 Reps Weekly", value: 2 },
];

export const RPE_PROGRESSION_OPTIONS: { label: string; value: number }[] = [
  { label: "None", value: 0 },
  { label: "+0.5 Weekly", value: 0.5 },
  { label: "+1 Weekly", value: 1 },
];

export const UPPER_1_TEMPLATE_NAME = "Upper #1 - Jeff Nippard Pure Bodybuilding";
export const UPPER_1_TEMPLATE_WEEK = "Week 1 (Baseline Template)";
export const UPPER_1_TEMPLATE_DESCRIPTION =
  "A hypertrophy-focused upper body workout emphasizing lateral delts, lats, chest, triceps, and upper back. This workout includes exercise-specific intensity techniques, RPE targets, rep ranges, rest periods, coaching cues, and recommended substitutions.";

const templateSubstitutions = (names: string[]): ExerciseSubstitutionOption[] =>
  names.map((name) => ({ name, source: "template" }));

const DEFAULT_UPPER_1_EXERCISES: LoggedExercise[] = [
  {
    name: "Cuffed Behind-The-Back Lateral Raise",
    originalName: "Cuffed Behind-The-Back Lateral Raise",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Myo-reps",
    notes:
      "Raise the cables up and out in a Y motion. Focus on connecting with the middle delt fibres as you sweep the weight upward and outward.",
    substitutions: templateSubstitutions(["Cross-Body Cable Y-Raise", "DB Lateral Raise"]),
    muscleGroups: ["Shoulders"],
  },
  {
    name: "Cross-Body Lat Pull-Around",
    originalName: "Cross-Body Lat Pull-Around",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    lastSetIntensityTechnique: "Long-length partials on all reps of the last set.",
    notes:
      "Keep the cable and wrist aligned in a straight line throughout the pull. Focus on a deep lat stretch at the top.",
    substitutions: templateSubstitutions(["Half-Kneeling 1-Arm Lat Pulldown", "Neutral-Grip Pullup"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Low Incline Smith Machine Press",
    originalName: "Low Incline Smith Machine Press",
    warmupSets: "2-3",
    sets: 4,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "8-9",
    lastSetRpe: "9-10",
    restTime: "2-3 minutes",
    lastSetIntensityTechnique: "Pec Static Stretch (30 second hold)",
    notes:
      "Set the bench to approximately 15 degrees. Pause on the chest for one second each rep while maintaining tension on the pecs.",
    substitutions: templateSubstitutions(["Low Incline Machine Press", "Low Incline DB Press"]),
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
  },
  {
    name: "Chest-Supported Machine Row",
    originalName: "Chest-Supported Machine Row",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    lastSetIntensityTechnique: "Long-length partials on all reps of the last set.",
    notes:
      "Flare elbows to roughly 45 degrees and squeeze shoulder blades together at the top of each repetition.",
    substitutions: templateSubstitutions(["Chest-Supported T-Bar Row", "Helms Row"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Overhead Cable Triceps Extension (Bar)",
    originalName: "Overhead Cable Triceps Extension (Bar)",
    warmupSets: "1",
    sets: 2,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    lastSetIntensityTechnique: "Dropset",
    notes:
      "Focus on achieving a deep triceps stretch throughout the negative. Pause for one second in the stretched position.",
    substitutions: templateSubstitutions(["Overhead Cable Triceps Extension (Rope)", "DB Skull Crusher"]),
    muscleGroups: ["Triceps"],
  },
  {
    name: "Straight-Bar Lat Prayer",
    originalName: "Straight-Bar Lat Prayer",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Long-length partials on all reps of the last set.",
    notes:
      "Lean forward to maximize the lat stretch at the top of the movement and stand upright while squeezing the lats at the bottom.",
    substitutions: templateSubstitutions(["Machine Lat Pullover", "DB Lat Pullover"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Pec Deck (with Integrated Partials)",
    originalName: "Pec Deck (with Integrated Partials)",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "8-9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Integrated Partials on all sets",
    notes:
      "Configure the pec deck for maximum stretch. Perform alternating full-ROM and half-ROM repetitions: 1 full ROM, 1 half ROM in the stretched position. Repeat until target reps are achieved while maintaining an RPE of 9-10.",
    substitutions: templateSubstitutions([
      "Bent-Over Cable Pec Flye (with Integrated Partials)",
      "DB Flye (with Integrated Partials)",
    ]),
    muscleGroups: ["Chest"],
  },
];

export const LOWER_1_TEMPLATE_NAME = "Lower #1 - Jeff Nippard Pure Bodybuilding";
export const LOWER_1_TEMPLATE_WEEK = "Week 2 (Baseline Template)";
export const LOWER_1_TEMPLATE_DESCRIPTION =
  "A hypertrophy-focused lower body workout emphasizing hamstrings, adductors, quads, and calves. Includes exercise-specific intensity techniques, RPE targets, rep ranges, rest periods, coaching cues, and recommended substitutions.";

const DEFAULT_LOWER_1_EXERCISES: LoggedExercise[] = [
  {
    name: "Seated Leg Curl",
    originalName: "Seated Leg Curl",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    notes: "Lean forward over the machine to get a maximum stretch in your hamstrings.",
    substitutions: templateSubstitutions(["Lying Leg Curl", "Nordic Ham Curl"]),
    muscleGroups: ["Hamstrings"],
  },
  {
    name: "Machine Hip Adduction",
    originalName: "Machine Hip Adduction",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Mind-muscle connection with your inner thighs. These are great for adding thigh mass from the front! Push them hard!",
    substitutions: templateSubstitutions(["Cable Hip Adduction", "Copenhagen Hip Adduction"]),
    muscleGroups: ["Adductors"],
  },
  {
    name: "Hack Squat",
    originalName: "Hack Squat",
    warmupSets: "2-4",
    sets: 3,
    repRangeMin: 4,
    repRangeMax: 8,
    weight: 0,
    rpe: 9,
    earlySetRpe: "9",
    lastSetRpe: "9",
    restTime: "3-5 minutes",
    notes:
      "We're using a reverse pyramid on this exercise. Warm-up as usual to your first working set for 4 reps. This first set will be your heaviest set. Then for set 2, drop the weight back ~10-15% and do 6 reps. Then for set 3, drop the weight back another 10-15% and do 8 reps.",
    substitutions: templateSubstitutions(["Machine Squat", "Front Squat"]),
    muscleGroups: ["Quads", "Glutes"],
  },
  {
    name: "Leg Extension",
    originalName: "Leg Extension",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Long-length partials on all reps of the last set.",
    notes:
      "Set the seat back as far as it will go while still feeling comfortable. Grab the handles as hard as you can to pull your butt down into the seat. Use a 2-3 second negative. Feel your quads pulling apart on the negative.",
    substitutions: templateSubstitutions(["DB Step-Up", "Reverse Nordic"]),
    muscleGroups: ["Quads"],
  },
  {
    name: "Leg Press Calf Press",
    originalName: "Leg Press Calf Press",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Calf Static Stretch (30 sec)",
    notes:
      "1-2 second pause at the bottom of each rep. Instead of just going up onto your toes, think about rolling your ankle back and forth on the balls of your feet.",
    substitutions: templateSubstitutions(["Donkey Calf Raise", "Seated Calf Raise"]),
    muscleGroups: ["Calves"],
  },
];

export const UPPER_2_TEMPLATE_NAME = "Upper #2 - Jeff Nippard Pure Bodybuilding";
export const UPPER_2_TEMPLATE_WEEK = "Week 2 (Baseline Template)";
export const UPPER_2_TEMPLATE_DESCRIPTION =
  "A hypertrophy-focused upper body workout emphasizing back thickness, chest, rear delts, lateral delts, and arms. Includes exercise-specific intensity techniques, RPE targets, rep ranges, rest periods, coaching cues, and recommended substitutions.";

const DEFAULT_UPPER_2_EXERCISES: LoggedExercise[] = [
  {
    name: "Super-ROM Overhand Cable Row",
    originalName: "Super-ROM Overhand Cable Row",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Set up a wide-grip pulldown bar on a seated cable row. Using a double overhand grip, perform rows while leaning forward on the negative and extend your torso to be upright as you finish the row.",
    substitutions: templateSubstitutions(["Overhand Machine Row", "Arm-Out Single-Arm DB Row"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Machine Shoulder Press",
    originalName: "Machine Shoulder Press",
    warmupSets: "2-3",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Dropset",
    notes:
      "Ensure that your elbows break at least 90 degrees. Mind-muscle connection with your delts. Smooth, controlled reps.",
    substitutions: templateSubstitutions(["Cable Shoulder Press", "Seated DB Shoulder Press"]),
    muscleGroups: ["Shoulders", "Triceps"],
  },
  {
    name: "Assisted Pull-Up",
    originalName: "Assisted Pull-Up",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    lastSetIntensityTechnique: "Long-length partials on all reps of the last set.",
    notes:
      "Slow 2-3 second negative. Feel your lats pulling apart on the way down. Slight 0.5-1 second pause at the bottom, then lift your chest up and drive your elbows down as you pull yourself up. Don't be afraid to use assistance. Keep the form tight and controlled.",
    substitutions: templateSubstitutions(["Lat Pulldown", "Machine Pulldown"]),
    muscleGroups: ["Back", "Biceps"],
  },
  {
    name: "Paused Assisted Dip",
    originalName: "Paused Assisted Dip",
    warmupSets: "2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "8-9",
    lastSetRpe: "10",
    restTime: "3-5 minutes",
    notes:
      "Slow 2-3 second negative. 1-2 second pause at the bottom. Explode with control on the way up. Go as deep as your shoulders comfortably allow, trying to at least break a 90 degree elbow angle.",
    substitutions: templateSubstitutions(["Decline Machine Chest Press", "Decline Barbell Press"]),
    muscleGroups: ["Chest", "Triceps", "Shoulders"],
  },
  {
    name: "Inverse DB Zottman Curl",
    originalName: "Inverse DB Zottman Curl",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Do a hammer curl on the positive, then turn your palms facing up at the top and use a palms-up grip on the negative.",
    substitutions: templateSubstitutions(["Slow-Eccentric DB Curl", "Hammer Curl"]),
    muscleGroups: ["Biceps"],
  },
  {
    name: "Super ROM DB Lateral Raise",
    originalName: "Super ROM DB Lateral Raise",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 13,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "0.5-1 minute",
    notes:
      "Perform lateral raises as normal, except going until your hands are up overhead. As you break parallel, you will use more upper traps to move the weight. Feel free to squeeze your upper traps at the top. If you feel shoulder pain when going all the way up, try pointing your thumb up or simply stop at parallel and do normal lateral raises.",
    substitutions: templateSubstitutions(["Cable Upright Row", "DB Lateral Raise"]),
    muscleGroups: ["Shoulders"],
  },
  {
    name: "Cable Reverse Flye (Mechanical Dropset)",
    originalName: "Cable Reverse Flye (Mechanical Dropset)",
    warmupSets: "0",
    sets: 3,
    repRangeMin: 3,
    repRangeMax: 5,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Mechanical Dropset (on all sets)",
    notes:
      "You'll probably want to watch the video for this one. Take ~3 big steps back from the cable machine and do your first 5 reps. After these first 5 reps, immediately (without resting) take 1 step forward and do another 4 reps. Then (without resting) take another step forward and do at least another 3 reps (or until you hit RPE 9-10).",
    substitutions: templateSubstitutions(["Reverse Pec Deck", "Bent-Over Reverse DB Flye"]),
    muscleGroups: ["Shoulders", "Back"],
  },
];

export const LOWER_2_TEMPLATE_NAME = "Lower #2 - Jeff Nippard Pure Bodybuilding";
export const LOWER_2_TEMPLATE_WEEK = "Week 2 (Baseline Template)";
export const LOWER_2_TEMPLATE_DESCRIPTION =
  "A hypertrophy-focused lower body workout emphasizing hamstrings, quads, glutes, adductors, and calves. Includes exercise-specific intensity techniques, RPE targets, rep ranges, rest periods, coaching cues, and recommended substitutions.";

const DEFAULT_LOWER_2_EXERCISES: LoggedExercise[] = [
  {
    name: "Lying Leg Curl",
    originalName: "Lying Leg Curl",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Long-length partials on all reps of the last set.",
    notes:
      "Set the machine so that you get the biggest stretch possible at the bottom. Prevent your butt from popping up as you curl. Once you can't get to the full squeeze, continue with partial reps on the last set.",
    substitutions: templateSubstitutions(["Seated Leg Curl", "Nordic Ham Curl"]),
    muscleGroups: ["Hamstrings"],
  },
  {
    name: "Leg Press",
    originalName: "Leg Press",
    warmupSets: "3-4",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 8,
    weight: 0,
    rpe: 9,
    earlySetRpe: "8-9",
    lastSetRpe: "8-9",
    restTime: "1-2 minutes",
    notes:
      "Feet lower on the platform for more quad focus. Get as deep as you can without excessive back rounding. Control the negative and do a slight pause at the bottom of each rep. Try to add a little weight each week at the same rep count.",
    substitutions: templateSubstitutions(["Belt Squat", "High-Bar Back Squat"]),
    muscleGroups: ["Quads", "Glutes"],
  },
  {
    name: "Paused Barbell RDL",
    originalName: "Paused Barbell RDL",
    warmupSets: "2-3",
    sets: 2,
    repRangeMin: 8,
    repRangeMax: 8,
    weight: 0,
    rpe: 8,
    earlySetRpe: "6-7",
    lastSetRpe: "7-8",
    restTime: "3-4 minutes",
    notes:
      "The RPE is intentionally low here because these will cause a lot of muscle damage. Don't be tempted to go too heavy. 1 second pause at the bottom of each rep. To keep tension on the hamstrings, stop about 75% of the way to full lockout on each rep (i.e. stay in the bottom 3/4 of the range of motion).",
    substitutions: templateSubstitutions(["Paused DB RDL", "Glute Ham Raise"]),
    muscleGroups: ["Hamstrings", "Glutes", "Back"],
  },
  {
    name: "A1: Machine Hip Adduction",
    originalName: "A1: Machine Hip Adduction",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "0.5-1 minute",
    notes:
      "Mind-muscle connection with your inner thighs. These are great for adding thigh mass from the front! Push them hard!",
    substitutions: templateSubstitutions(["Cable Hip Adduction", "Copenhagen Hip Adduction"]),
    muscleGroups: ["Adductors"],
  },
  {
    name: "A2: Sissy Squat",
    originalName: "A2: Sissy Squat",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 8,
    earlySetRpe: "7-8",
    lastSetRpe: "7-8",
    restTime: "0.5-1 minute",
    notes:
      "Allow yourself to come up onto your toes and push your knees forward past your toes. This is safe for the knees. If you feel knee pain doing them, though, feel free to go with a substitution. They may feel awkward at first, but they're really underrated for the quads! Don't give up on them too quickly.",
    substitutions: templateSubstitutions(["Leg Extension", "Goblet Squat"]),
    muscleGroups: ["Quads"],
  },
  {
    name: "Standing Calf Raise",
    originalName: "Standing Calf Raise",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Calf Static Stretch (30 sec held)",
    notes:
      "1-2 second pause at the bottom of each rep. Instead of just going up onto your toes, think about rolling your ankle back and forth on the balls of your feet.",
    substitutions: templateSubstitutions(["Leg Press Calf Press", "Donkey Calf Raise"]),
    muscleGroups: ["Calves"],
  },
];

export const ARMS_WEAK_POINTS_TEMPLATE_NAME = "Arms & Weak Points - Jeff Nippard Pure Bodybuilding";
export const ARMS_WEAK_POINTS_TEMPLATE_WEEK = "Week 2 (Baseline Template)";
export const ARMS_WEAK_POINTS_TEMPLATE_DESCRIPTION =
  "An arm-focused session with dedicated weak-point work. Pick weak-point exercises from your Hypertrophy Handbook, then train biceps, triceps, and core. Includes exercise-specific intensity techniques, RPE targets, rep ranges, rest periods, coaching cues, and recommended substitutions.";

const DEFAULT_ARMS_WEAK_POINTS_EXERCISES: LoggedExercise[] = [
  {
    name: "Weak Point Exercise 1",
    originalName: "Weak Point Exercise 1",
    warmupSets: "1-3",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "9-10",
    restTime: "1-3 minutes",
    notes:
      "Decide on your weak point using The Weak Point Table in your Hypertrophy Handbook. Perform ONE of the exercises listed under Exercise 1 for the sets and reps provided here.",
    substitutions: templateSubstitutions(["See The Weak Point Table for sub options"]),
    muscleGroups: [],
  },
  {
    name: "Weak Point Exercise 2 (optional)",
    originalName: "Weak Point Exercise 2 (optional)",
    warmupSets: "1-3",
    sets: 2,
    repRangeMin: 6,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "9-10",
    restTime: "1-3 minutes",
    notes:
      "If your weak point is feeling recovered (not sore or fatigued) then feel free to hit Exercise 2. If your weak point is feeling tired or sore, do not perform the second weak point exercise this week.",
    substitutions: templateSubstitutions(["See The Weak Point Table for sub options"]),
    muscleGroups: [],
  },
  {
    name: "Bayesian Cable Curl",
    originalName: "Bayesian Cable Curl",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Long-length partials on all reps of the last set.",
    notes:
      "If you have a left-right bicep size imbalance, do these 1 arm at a time, starting with the weaker arm. Take the weaker arm to an RPE of 9-10. Then match the reps with the other arm (stop once you've matched the reps, even if the RPE is lower). If you don't have a size imbalance, do these both arms at the same time.",
    substitutions: templateSubstitutions(["DB Incline Curl", "DB Scott Curl"]),
    muscleGroups: ["Biceps"],
  },
  {
    name: "Seated DB French Press",
    originalName: "Seated DB French Press",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Place both palms under the head of a dumbbell and perform overhead extensions. Feel a deep stretch on your triceps at the bottom. Avoid pausing at the top of each rep.",
    substitutions: templateSubstitutions(["EZ-bar Skull Crusher", "DB Skull Crusher"]),
    muscleGroups: ["Triceps"],
  },
  {
    name: "Bottom 2/3 Constant Tension Preacher Curl",
    originalName: "Bottom 2/3 Constant Tension Preacher Curl",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 13,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Stay in the bottom 2/3 of the curl. Don't squeeze all the way up to the top. Keep your triceps firmly pinned against the pad as you curl. No pausing at the top or bottom; constant tension on the biceps!",
    substitutions: templateSubstitutions(["Bottom-2/3 EZ-Bar Curl", "Spider Curl"]),
    muscleGroups: ["Biceps"],
  },
  {
    name: "Cable Triceps Kickback",
    originalName: "Cable Triceps Kickback",
    warmupSets: "0",
    sets: 3,
    repRangeMin: 13,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "There are two ways you can do this: upright or bent over. Choose the one that feels more comfortable for you. The main thing is that when you're in that full squeeze, your shoulder should be positioned back behind your torso.",
    substitutions: templateSubstitutions(["Bench Dip", "DB Triceps Kickback"]),
    muscleGroups: ["Triceps"],
  },
  {
    name: "Cable Crunch",
    originalName: "Cable Crunch",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Round your lower back as you crunch. Maintain a mind-muscle connection with your 6-pack.",
    substitutions: templateSubstitutions(["Machine Crunch", "Plate-Weighted Crunch"]),
    muscleGroups: ["Core"],
  },
];

interface DefaultWorkoutTemplate {
  name: string;
  week: string;
  description: string;
  exercises: LoggedExercise[];
}

const UPPER_1_TEMPLATE: DefaultWorkoutTemplate = {
  name: UPPER_1_TEMPLATE_NAME,
  week: UPPER_1_TEMPLATE_WEEK,
  description: UPPER_1_TEMPLATE_DESCRIPTION,
  exercises: DEFAULT_UPPER_1_EXERCISES,
};

const LOWER_1_TEMPLATE: DefaultWorkoutTemplate = {
  name: LOWER_1_TEMPLATE_NAME,
  week: LOWER_1_TEMPLATE_WEEK,
  description: LOWER_1_TEMPLATE_DESCRIPTION,
  exercises: DEFAULT_LOWER_1_EXERCISES,
};

const DEFAULT_WORKOUT_TEMPLATES: Record<string, DefaultWorkoutTemplate> = {
  "Upper #1": UPPER_1_TEMPLATE,
  "Lower #1": LOWER_1_TEMPLATE,
  "Upper #2": {
    name: UPPER_2_TEMPLATE_NAME,
    week: UPPER_2_TEMPLATE_WEEK,
    description: UPPER_2_TEMPLATE_DESCRIPTION,
    exercises: DEFAULT_UPPER_2_EXERCISES,
  },
  "Lower #2": {
    name: LOWER_2_TEMPLATE_NAME,
    week: LOWER_2_TEMPLATE_WEEK,
    description: LOWER_2_TEMPLATE_DESCRIPTION,
    exercises: DEFAULT_LOWER_2_EXERCISES,
  },
  "Arms & Weak Points": {
    name: ARMS_WEAK_POINTS_TEMPLATE_NAME,
    week: ARMS_WEAK_POINTS_TEMPLATE_WEEK,
    description: ARMS_WEAK_POINTS_TEMPLATE_DESCRIPTION,
    exercises: DEFAULT_ARMS_WEAK_POINTS_EXERCISES,
  },
  // Aliases for the original two-slot naming.
  Upper: UPPER_1_TEMPLATE,
  Lower: LOWER_1_TEMPLATE,
};

export function hasDefaultTemplate(workoutType: string): boolean {
  return workoutType in DEFAULT_WORKOUT_TEMPLATES;
}

// ---------------------------------------------------------------------------
// Block 2 - Novelty Phase (Jeff Nippard Pure Bodybuilding, weeks 6-10)
// ---------------------------------------------------------------------------

const BLOCK2_WEEK_LABEL = "Week 6 (Novelty Phase)";

const DEFAULT_BLOCK2_UPPER_1_EXERCISES: LoggedExercise[] = [
  {
    name: "Cuffed Behind-The-Back Lateral Raise",
    originalName: "Cuffed Behind-The-Back Lateral Raise",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Myo-reps",
    notes:
      "Raise the cables up in a \"Y\" motion. Really try to connect with the middle delt fibers as you sweep the weight up and out.",
    substitutions: templateSubstitutions(["Cross-Body Cable Y-Raise", "DB Lateral Raise"]),
    muscleGroups: ["Shoulders"],
  },
  {
    name: "Lat-Focused Cable Row",
    originalName: "Lat-Focused Cable Row",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    lastSetIntensityTechnique: "Lat Static Stretch (30 sec hold)",
    notes:
      "Keep your torso locked in a fixed position (don't lean forward on the negative). Drive your elbows down and back to engage the lats. Keep your elbows tucked in to your sides.",
    substitutions: templateSubstitutions(["Half-Kneeling 1-Arm Lat Pulldown", "Elbows-In 1-Arm DB Row"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Low Incline DB Press",
    originalName: "Low Incline DB Press",
    warmupSets: "2-3",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    notes:
      "Set the bench at a ~15° incline. Do a slight elbow tuck on the negative and then flare as you push (assuming this doesn't bother your shoulders). Nice, smooth reps here. No pausing at the top or bottom: constant tension on the pecs!",
    substitutions: templateSubstitutions(["Low Incline Machine Press", "Low Incline Barbell Press"]),
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
  },
  {
    name: "Chest-Supported T-Bar Row + Kelso Shrug",
    originalName: "Chest-Supported T-Bar Row + Kelso Shrug",
    warmupSets: "2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    notes:
      "Do 8-10 reps as a normal T-Bar row, driving your elbows back at roughly 45° and squeezing your shoulder blades together. Without resting, do another 4-6 reps as Kelso Shrugs (just squeeze your shoulder blades together without rowing all the way back with your arms).",
    substitutions: templateSubstitutions(["Machine Chest-Supported Row + Kelso Shrug", "Incline Chest-Supported DB Row + Kelso Shrug"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Bent-Over Cable Pec Flye (with Integrated Partials)",
    originalName: "Bent-Over Cable Pec Flye (with Integrated Partials)",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "8-9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Integrated Partials (on all sets)",
    notes:
      "Lean forward until your torso is parallel with the floor, flye straight out and down toward the floor. Stretch and squeeze the pecs! Stay locked in.",
    substitutions: templateSubstitutions(["Pec Deck (with Integrated Partials)", "DB Flye (with Integrated Partials)"]),
    muscleGroups: ["Chest"],
  },
  {
    name: "1-Arm Lat Pull-In",
    originalName: "1-Arm Lat Pull-In",
    warmupSets: "1",
    sets: 2,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Long-length Partials (on all reps of the last set)",
    notes:
      "Pull the cable in from the side. Keep a mind-muscle connection with your lats and try to prevent your biceps from taking over. Palpate (feel) your lats with your other hand if that helps you connect with them better.",
    substitutions: templateSubstitutions(["Wide-Grip Lat Pulldown", "Wide-Grip Band-Assisted Pull-Up"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Dual-Cable Triceps Press",
    originalName: "Dual-Cable Triceps Press",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "8-9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    notes:
      "Hold the cables without a handle and get them into position just above your shoulders (around chin level). Press the weight forward (straight out in front of you), not up overhead like in a standard overhead triceps extension.",
    substitutions: templateSubstitutions(["Overhead Cable Triceps Extension (Bar)", "DB Skull Crusher"]),
    muscleGroups: ["Triceps"],
  },
];

const DEFAULT_BLOCK2_LOWER_1_EXERCISES: LoggedExercise[] = [
  {
    name: "Seated Leg Curl",
    originalName: "Seated Leg Curl",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    notes:
      "Lean forward over the machine to get a maximum stretch in your hamstrings.",
    substitutions: templateSubstitutions(["Lying Leg Curl", "Nordic Ham Curl"]),
    muscleGroups: ["Hamstrings"],
  },
  {
    name: "Machine Hip Adduction",
    originalName: "Machine Hip Adduction",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Mind-muscle connection with your inner thighs. These are great for adding thigh mass from the front! Push them hard!",
    substitutions: templateSubstitutions(["Cable Hip Adduction", "Copenhagen Hip Adduction"]),
    muscleGroups: ["Adductors"],
  },
  {
    name: "Smith Machine Squat",
    originalName: "Smith Machine Squat",
    warmupSets: "2-4",
    sets: 3,
    repRangeMin: 4,
    repRangeMax: 8,
    weight: 0,
    rpe: 9,
    earlySetRpe: "9",
    lastSetRpe: "9",
    restTime: "3-5 minutes",
    notes:
      "We're using a reverse pyramid on this exercise. Warm-up as usual to your first working set for 4 reps. This first set will be your heaviest set. Then for set 2, drop the weight back ~10-15% and do 6 reps. Then for set 3, drop the weight back another 10-15% and do 8 reps.",
    substitutions: templateSubstitutions(["Machine Squat", "DB Bulgarian Split Squat"]),
    muscleGroups: ["Quads", "Glutes"],
  },
  {
    name: "Leg Extension",
    originalName: "Leg Extension",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Long-length Partials (on all reps of the last set)",
    notes:
      "Set the seat back as far as it will go while still feeling comfortable. Grab the handles as hard as you can to pull your butt down into the seat. Use a 2-3 second negative. Feel your quads pulling apart on the negative.",
    substitutions: templateSubstitutions(["DB Step-Up", "Reverse Nordic"]),
    muscleGroups: ["Quads"],
  },
  {
    name: "DB Calf Jumps",
    originalName: "DB Calf Jumps",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Hold a dumbbell and perform a jumping motion without actually leaving the floor, using a slight knee bend, but mostly relying on your calves/ankles to drive the \"jump\". I believe I built a lot of calf mass by doing jump rope; these are meant to provide a similar stimulus, but with more tension.",
    substitutions: templateSubstitutions(["Leg Press Calf Jumps", "Standing Calf Raise"]),
    muscleGroups: ["Calves"],
  },
];

const DEFAULT_BLOCK2_UPPER_2_EXERCISES: LoggedExercise[] = [
  {
    name: "Dual-Handle Lat Pulldown (Mid-Back + Lats)",
    originalName: "Dual-Handle Lat Pulldown (Mid-Back + Lats)",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    notes:
      "Lean back by ~15° and drive your elbows down as you squeeze your shoulder blades together. This should feel like a mix of lats and mid-traps.",
    substitutions: templateSubstitutions(["Overhand Lat Pulldown", "Pull-Up"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Seated DB Shoulder Press",
    originalName: "Seated DB Shoulder Press",
    warmupSets: "2-3",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Slightly rotate the dumbbells in on the negative and flare your elbows out as you push.",
    substitutions: templateSubstitutions(["Seated Barbell Shoulder Press", "Standing DB Arnold Press"]),
    muscleGroups: ["Shoulders", "Triceps"],
  },
  {
    name: "Chest-Supported Machine Row",
    originalName: "Chest-Supported Machine Row",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    lastSetIntensityTechnique: "Long-length Partials (on all reps of the last set)",
    notes:
      "Flare elbows out at roughly 45° and squeeze your shoulder blades together hard at the top of each rep.",
    substitutions: templateSubstitutions(["Chest-Supported T-Bar Row", "Helms Row"]),
    muscleGroups: ["Back"],
  },
  {
    name: "Decline Machine Chest Press",
    originalName: "Decline Machine Chest Press",
    warmupSets: "2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "8-9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    notes:
      "Feel your pecs stretching apart on the negative. Mind-muscle connection with lower pecs.",
    substitutions: templateSubstitutions(["Decline Smith Machine Press", "Decline Barbell Press"]),
    muscleGroups: ["Chest", "Triceps"],
  },
  {
    name: "Concentration Cable Curl",
    originalName: "Concentration Cable Curl",
    warmupSets: "1",
    sets: 2,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Place your working elbow against your knee and perform strict form curls.",
    substitutions: templateSubstitutions(["DB Concentration Curl", "DB Preacher Curl"]),
    muscleGroups: ["Biceps"],
  },
  {
    name: "Cross-Body Cable Y-Raise",
    originalName: "Cross-Body Cable Y-Raise",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "2-3 minutes",
    notes:
      "Think about \"drawing a sword\" as you do the positive. Sweep your arm up, out and across your body. It may take a few weeks to get used to these if you haven't done them before, but once they click, they really click.",
    substitutions: templateSubstitutions(["Machine Lateral Raise", "DB Lateral Raise"]),
    muscleGroups: ["Shoulders"],
  },
  {
    name: "Rear Delt 45° Cable Flye",
    originalName: "Rear Delt 45° Cable Flye",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Pull with one arm at a time, bracing with your non-working hand against the machine. Try to align your arm and the cable in a straight line at the bottom of the flye.",
    substitutions: templateSubstitutions(["DB Rear Delt Swing", "Bent-Over Reverse DB Flye"]),
    muscleGroups: ["Shoulders", "Back"],
  },
];

const DEFAULT_BLOCK2_LOWER_2_EXERCISES: LoggedExercise[] = [
  {
    name: "Lying Leg Curl",
    originalName: "Lying Leg Curl",
    warmupSets: "1-2",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 10,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Long-length Partials (on all reps of the last set)",
    notes:
      "Set the machine so that you get the biggest stretch possible at the bottom. Prevent your butt from popping up as you curl. Once you can't get to the full squeeze, continue with partial reps on the last set.",
    substitutions: templateSubstitutions(["Seated Leg Curl", "Nordic Ham Curl"]),
    muscleGroups: ["Hamstrings"],
  },
  {
    name: "Smith Machine Reverse Lunge",
    originalName: "Smith Machine Reverse Lunge",
    warmupSets: "2-4",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 8,
    weight: 0,
    rpe: 9,
    earlySetRpe: "8-9",
    lastSetRpe: "8-9",
    restTime: "1-2 minutes",
    notes:
      "Set one leg back on the negative and then drive the weight up using your front leg. Try to minimize assistance from your back leg.",
    substitutions: templateSubstitutions(["DB Reverse Lunge", "DB Walking Lunge"]),
    muscleGroups: ["Quads", "Glutes"],
  },
  {
    name: "Glute-Ham Raise",
    originalName: "Glute-Ham Raise",
    warmupSets: "2-3",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 8,
    weight: 0,
    rpe: 10,
    earlySetRpe: "8-9",
    lastSetRpe: "9-10",
    restTime: "3-4 minutes",
    notes:
      "Cut out the top ~25% of the ROM, where there will be minimal tension on the hamstrings. Control the negative and squeeze your hamstrings to pull yourself up!",
    substitutions: templateSubstitutions(["Nordic Ham Curl", "Seated Leg Curl"]),
    muscleGroups: ["Hamstrings", "Glutes"],
  },
  {
    name: "A1: Machine Hip Adduction",
    originalName: "A1: Machine Hip Adduction",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "Minimal (A1/A2 superset)",
    notes:
      "Mind-muscle connection with your inner thighs. These are great for adding thigh mass from the front! Push them hard!",
    substitutions: templateSubstitutions(["Cable Hip Adduction", "Copenhagen Hip Adduction"]),
    muscleGroups: ["Adductors"],
  },
  {
    name: "A2: Machine Hip Abduction",
    originalName: "A2: Machine Hip Abduction",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "Minimal (A1/A2 superset)",
    notes:
      "If possible, use pads to increase the range of motion on the machine. Lean forward and grab onto the machine rails to stretch the glutes further.",
    substitutions: templateSubstitutions(["Cable Hip Abduction", "Lateral Band Walk"]),
    muscleGroups: ["Abductors", "Glutes"],
  },
  {
    name: "Standing Calf Raise",
    originalName: "Standing Calf Raise",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Calf Static Stretch (30 sec hold)",
    notes:
      "1-2 second pause at the bottom of each rep. Instead of just going up onto your toes, think about rolling your ankle back and forth on the balls of your feet.",
    substitutions: templateSubstitutions(["Seated Calf Raise", "Leg Press Calf Press"]),
    muscleGroups: ["Calves"],
  },
];

const DEFAULT_BLOCK2_ARMS_WEAK_POINTS_EXERCISES: LoggedExercise[] = [
  {
    name: "Weak Point Exercise 1",
    originalName: "Weak Point Exercise 1",
    warmupSets: "1-3",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "9-10",
    restTime: "1-3 minutes",
    notes:
      "Decide on your weak point using The Weak Point Table in your Hypertrophy Handbook. Perform ONE of the exercises listed under Exercise 1 for the sets and reps provided here.",
    substitutions: templateSubstitutions(["See The Weak Point Table for sub options", "See The Weak Point Table for sub options"]),
    muscleGroups: [],
  },
  {
    name: "Weak Point Exercise 2 (optional)",
    originalName: "Weak Point Exercise 2 (optional)",
    warmupSets: "1-3",
    sets: 2,
    repRangeMin: 8,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9",
    lastSetRpe: "9-10",
    restTime: "1-3 minutes",
    notes:
      "If your weak point is feeling recovered (not sore or fatigued) then feel free to hit Exercise 2. If your weak point is feeling tired or sore, do not perform the second weak point exercise this week.",
    substitutions: templateSubstitutions(["See The Weak Point Table for sub options", "See The Weak Point Table for sub options"]),
    muscleGroups: [],
  },
  {
    name: "Slow-Eccentric EZ-Bar Skull Crusher",
    originalName: "Slow-Eccentric EZ-Bar Skull Crusher",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Use a 3-4 second negative. Arc the EZ-bar slightly back behind your head. When you extend, keep the bar back behind your eye line. Use the inside (closer) grip option and allow the elbows to flare to a degree that feels comfortable.",
    substitutions: templateSubstitutions(["Slow-Eccentric DB Skull Crusher", "Slow-Eccentric DB French Press"]),
    muscleGroups: ["Triceps"],
  },
  {
    name: "Slow-Eccentric Bayesian Curl",
    originalName: "Slow-Eccentric Bayesian Curl",
    warmupSets: "1",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 12,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    lastSetIntensityTechnique: "Long-length Partials (on all reps of the last set)",
    notes:
      "Use a 3-4 second negative and a slight pause at the bottom of each rep to emphasize stretching your biceps.",
    substitutions: templateSubstitutions(["Slow-Eccentric DB Incline Curl", "Slow-Eccentric DB Scott Curl"]),
    muscleGroups: ["Biceps"],
  },
  {
    name: "Triceps Diverging Pressdown (Long Rope or 2 Ropes)",
    originalName: "Triceps Diverging Pressdown (Long Rope or 2 Ropes)",
    warmupSets: "1",
    sets: 2,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Use two long ropes or one long rope. Lean slightly forward, flare your elbows slightly out and keep your arms back in line with your torso. Then do triceps pressdowns, getting a full, big squeeze at the bottom.",
    substitutions: templateSubstitutions(["Cable Triceps Kickback", "DB Triceps Kickback"]),
    muscleGroups: ["Triceps"],
  },
  {
    name: "Reverse-Grip Cable Curl",
    originalName: "Reverse-Grip Cable Curl",
    warmupSets: "0",
    sets: 2,
    repRangeMin: 12,
    repRangeMax: 15,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Grab a cable bar with your palms facing down and perform curls. These will work the back of your forearm, brachialis and biceps!",
    substitutions: templateSubstitutions(["Reverse-Grip EZ-Bar Curl", "Reverse-Grip DB Curl"]),
    muscleGroups: ["Biceps", "Forearms"],
  },
  {
    name: "Roman Chair Leg Raise",
    originalName: "Roman Chair Leg Raise",
    warmupSets: "0",
    sets: 3,
    repRangeMin: 10,
    repRangeMax: 20,
    weight: 0,
    rpe: 10,
    earlySetRpe: "9-10",
    lastSetRpe: "10",
    restTime: "1-2 minutes",
    notes:
      "Allow your lower back to round as you curl your legs up. 10-20 reps is a broad range on purpose: just go until you hit RPE 9-10 (0-1 reps shy of failure) with controlled form.",
    substitutions: templateSubstitutions(["Hanging Leg Raise", "Reverse Crunch"]),
    muscleGroups: ["Core"],
  },
];

const BLOCK1_TEMPLATES: Record<string, DefaultWorkoutTemplate> = {
  "Upper #1": UPPER_1_TEMPLATE,
  "Lower #1": LOWER_1_TEMPLATE,
  "Upper #2": {
    name: UPPER_2_TEMPLATE_NAME,
    week: UPPER_2_TEMPLATE_WEEK,
    description: UPPER_2_TEMPLATE_DESCRIPTION,
    exercises: DEFAULT_UPPER_2_EXERCISES,
  },
  "Lower #2": {
    name: LOWER_2_TEMPLATE_NAME,
    week: LOWER_2_TEMPLATE_WEEK,
    description: LOWER_2_TEMPLATE_DESCRIPTION,
    exercises: DEFAULT_LOWER_2_EXERCISES,
  },
  "Arms & Weak Points": {
    name: ARMS_WEAK_POINTS_TEMPLATE_NAME,
    week: ARMS_WEAK_POINTS_TEMPLATE_WEEK,
    description: ARMS_WEAK_POINTS_TEMPLATE_DESCRIPTION,
    exercises: DEFAULT_ARMS_WEAK_POINTS_EXERCISES,
  },
};

const BLOCK2_TEMPLATES: Record<string, DefaultWorkoutTemplate> = {
  "Upper #1": {
    name: "Upper #1 - Novelty Phase (Jeff Nippard Pure Bodybuilding)",
    week: BLOCK2_WEEK_LABEL,
    description:
      "Novelty-phase upper body session emphasizing lateral delts, lats, chest, and triceps with fresh exercise variations.",
    exercises: DEFAULT_BLOCK2_UPPER_1_EXERCISES,
  },
  "Lower #1": {
    name: "Lower #1 - Novelty Phase (Jeff Nippard Pure Bodybuilding)",
    week: BLOCK2_WEEK_LABEL,
    description:
      "Novelty-phase lower body session emphasizing hamstrings, adductors, quads, and calves with fresh exercise variations.",
    exercises: DEFAULT_BLOCK2_LOWER_1_EXERCISES,
  },
  "Upper #2": {
    name: "Upper #2 - Novelty Phase (Jeff Nippard Pure Bodybuilding)",
    week: BLOCK2_WEEK_LABEL,
    description:
      "Novelty-phase upper body session emphasizing back, shoulders, chest, and arms with fresh exercise variations.",
    exercises: DEFAULT_BLOCK2_UPPER_2_EXERCISES,
  },
  "Lower #2": {
    name: "Lower #2 - Novelty Phase (Jeff Nippard Pure Bodybuilding)",
    week: BLOCK2_WEEK_LABEL,
    description:
      "Novelty-phase lower body session emphasizing hamstrings, quads, glutes, adductors/abductors, and calves.",
    exercises: DEFAULT_BLOCK2_LOWER_2_EXERCISES,
  },
  "Arms & Weak Points": {
    name: "Arms & Weak Points - Novelty Phase (Jeff Nippard Pure Bodybuilding)",
    week: BLOCK2_WEEK_LABEL,
    description:
      "Novelty-phase arm and weak-point session with slow-eccentric and diverging variations for biceps, triceps, and core.",
    exercises: DEFAULT_BLOCK2_ARMS_WEAK_POINTS_EXERCISES,
  },
};

// ---------------------------------------------------------------------------
// Program presets (selectable starting points)
// ---------------------------------------------------------------------------

export interface ProgramBlockTemplate {
  name: string;
  phase: string;
  lengthWeeks: number;
  deloadWeeks: number[];
  templatesBySlot: Record<string, DefaultWorkoutTemplate>;
}

export interface ProgramPreset {
  id: string;
  name: string;
  description: string;
  splitType: SplitType;
  weeklyCycle: (string | null)[]; // Monday..Sunday slot names (null = rest)
  progression: ProgressionSettings;
  blocks: ProgramBlockTemplate[];
}

export const PURE_BODYBUILDING_PRESET: ProgramPreset = {
  id: "pure-bodybuilding-upper-lower",
  name: "Pure Bodybuilding (Upper/Lower)",
  description:
    "Jeff Nippard's 10-week Upper/Lower hypertrophy program: a 5-week Build phase followed by a 5-week Novelty phase, each ending in a semi-deload week. Pick it as a starting point, then edit any exercise, set, rep, or substitution to make it your own.",
  splitType: "UPPER_LOWER",
  // Monday..Sunday. Mirrors DEFAULT_WEEKLY_CYCLES.UPPER_LOWER (inlined to avoid
  // a use-before-declaration on that const, which is defined later in the file).
  weeklyCycle: ["Upper #1", "Lower #1", null, "Upper #2", "Lower #2", "Arms & Weak Points", null],
  progression: { repProgression: 0, setProgressionEnabled: false, rpeProgression: 0 },
  blocks: [
    {
      name: "Build Phase",
      phase: "Build",
      lengthWeeks: 5,
      deloadWeeks: [5],
      templatesBySlot: BLOCK1_TEMPLATES,
    },
    {
      name: "Novelty Phase",
      phase: "Novelty",
      lengthWeeks: 5,
      deloadWeeks: [5],
      templatesBySlot: BLOCK2_TEMPLATES,
    },
  ],
};

export const PROGRAM_PRESETS: ProgramPreset[] = [PURE_BODYBUILDING_PRESET];

export function getSplitDefinition(splitType: SplitType): SplitDefinition {
  return SPLIT_DEFINITIONS[splitType];
}

export function getSplitSlots(splitType: SplitType): string[] {
  return SPLIT_DEFINITIONS[splitType].slots.map((slot) => slot.slot);
}

const DEFAULT_WEEKLY_CYCLES: Record<SplitType, (string | null)[]> = {
  // Monday..Sunday
  PPL: ["Push", "Pull", "Legs", null, "Push", "Pull", null],
  UPPER_LOWER: ["Upper #1", "Lower #1", null, "Upper #2", "Lower #2", "Arms & Weak Points", null],
};

export function getDefaultWeeklyCycle(splitType: SplitType): WeeklyCycle {
  const template = DEFAULT_WEEKLY_CYCLES[splitType];
  return {
    days: DAYS_OF_WEEK.map((dayOfWeek, index) => ({
      dayOfWeek,
      workoutType: template[index] ?? null,
    })),
  };
}

export function getWeeklyWorkload(weeklyCycle: WeeklyCycle): WeeklyWorkload {
  const frequencyByType: Record<string, number> = {};
  let totalSessions = 0;
  let restDays = 0;

  for (const day of weeklyCycle.days) {
    if (day.workoutType === null) {
      restDays += 1;
      continue;
    }
    frequencyByType[day.workoutType] = (frequencyByType[day.workoutType] ?? 0) + 1;
    totalSessions += 1;
  }

  return { frequencyByType, totalSessions, restDays };
}

export function getScheduledSessions(weeklyCycle: WeeklyCycle): ScheduledSession[] {
  return weeklyCycle.days
    .filter((day): day is WeeklyCycleDay & { workoutType: string } => day.workoutType !== null)
    .map((day) => ({ dayOfWeek: day.dayOfWeek, workoutType: day.workoutType }));
}

export function requiredSessionCount(weeklyCycle: WeeklyCycle): number {
  return getScheduledSessions(weeklyCycle).length;
}

export function loggedSessionCount(program: Program): number {
  return program.baselineWeek.loggedWorkouts.length;
}

export function isBaselineComplete(program: Program): boolean {
  const required = requiredSessionCount(program.weeklyCycle);
  return required > 0 && program.baselineWeek.loggedWorkouts.length >= required;
}

export function getLoggedWorkoutForDay(
  program: Program,
  dayOfWeek: DayOfWeek,
): LoggedWorkout | undefined {
  return program.baselineWeek.loggedWorkouts.find((workout) => workout.dayOfWeek === dayOfWeek);
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function createProgram(input: {
  name: string;
  splitType: SplitType;
  weeklyCycle: WeeklyCycle;
  mesocycleLengthWeeks: number;
  progression: ProgressionSettings;
}): Program {
  return {
    id: createId("program"),
    name: input.name.trim(),
    splitType: input.splitType,
    weeklyCycle: input.weeklyCycle,
    mesocycleLengthWeeks: input.mesocycleLengthWeeks,
    progression: input.progression,
    status: "collecting_baseline_week",
    baselineWeek: {
      loggedWorkouts: [],
    },
    substitutionMemory: {},
    mesocycle: null,
    createdAt: new Date().toISOString(),
  };
}

function weeklyCycleFromSlots(slots: (string | null)[]): WeeklyCycle {
  return {
    days: DAYS_OF_WEEK.map((dayOfWeek, index) => ({
      dayOfWeek,
      workoutType: slots[index] ?? null,
    })),
  };
}

/**
 * Build the editable, per-user baseline workouts for one block by deep-cloning
 * the block's templates onto the scheduled days. Cloning ensures edits never
 * mutate the shared preset/template constants.
 */
function seedBlockBaseline(
  weeklyCycle: WeeklyCycle,
  templatesBySlot: Record<string, DefaultWorkoutTemplate>,
): LoggedWorkout[] {
  const workouts: LoggedWorkout[] = [];
  for (const day of weeklyCycle.days) {
    if (day.workoutType === null) {
      continue;
    }
    const template = templatesBySlot[day.workoutType];
    if (!template) {
      continue;
    }
    workouts.push({
      id: createId("workout"),
      dayOfWeek: day.dayOfWeek,
      workoutType: day.workoutType,
      templateName: template.name,
      templateDescription: template.description,
      templateWeek: template.week,
      exercises: template.exercises.map((exercise) => applySubstitutionMemory(exercise, {})),
      loggedAt: new Date().toISOString(),
      sessionType: day.workoutType,
    });
  }
  return workouts;
}

function cloneWorkout(workout: LoggedWorkout): LoggedWorkout {
  return {
    ...workout,
    id: createId("workout"),
    exercises: workout.exercises.map(cloneExercise),
  };
}

/**
 * Create a program from a preset (e.g. Pure Bodybuilding). Every block's
 * baseline is auto-seeded from its template into an editable, per-user copy
 * (persisted in the browser); the shared template constants are never mutated.
 * The full multi-block mesocycle (including semi-deload weeks) is generated up
 * front so the program starts active.
 */
export function createProgramFromPreset(preset: ProgramPreset, name?: string): Program {
  const weeklyCycle = weeklyCycleFromSlots(preset.weeklyCycle);
  const blocks: ProgramBlock[] = preset.blocks.map((block) => ({
    id: createId("block"),
    name: block.name,
    phase: block.phase,
    lengthWeeks: block.lengthWeeks,
    deloadWeeks: [...block.deloadWeeks],
    baselineWorkouts: seedBlockBaseline(weeklyCycle, block.templatesBySlot),
  }));
  const totalWeeks = preset.blocks.reduce((sum, block) => sum + block.lengthWeeks, 0);

  const program: Program = {
    id: createId("program"),
    name: name?.trim() ? name.trim() : preset.name,
    splitType: preset.splitType,
    weeklyCycle,
    mesocycleLengthWeeks: totalWeeks,
    progression: preset.progression,
    status: "active_mesocycle",
    baselineWeek: {
      loggedWorkouts: blocks[0]?.baselineWorkouts.map(cloneWorkout) ?? [],
    },
    substitutionMemory: {},
    mesocycle: null,
    blocks,
    createdAt: new Date().toISOString(),
  };

  program.mesocycle = generateMesocycle(program);
  return program;
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

function cloneSubstitution(option: ExerciseSubstitutionOption): ExerciseSubstitutionOption {
  return { ...option };
}

function cloneExercise(exercise: LoggedExercise): LoggedExercise {
  return {
    ...exercise,
    muscleGroups: [...exercise.muscleGroups],
    substitutions: exercise.substitutions?.map(cloneSubstitution),
  };
}

function mergeSubstitutionOptions(
  templateOptions: ExerciseSubstitutionOption[] | undefined,
  memoryOptions: ExerciseSubstitutionOption[] | undefined,
): ExerciseSubstitutionOption[] {
  const options = new Map<string, ExerciseSubstitutionOption>();

  for (const option of [...(templateOptions ?? []), ...(memoryOptions ?? [])]) {
    const key = normalizeExerciseName(option.name);
    if (!key) {
      continue;
    }
    const existing = options.get(key);
    options.set(key, {
      ...option,
      frequencyUsed: Math.max(existing?.frequencyUsed ?? 0, option.frequencyUsed ?? 0) || undefined,
      source: existing?.source === "template" ? "template" : option.source,
    });
  }

  return [...options.values()];
}

function applySubstitutionMemory(
  exercise: LoggedExercise,
  substitutionMemory: SubstitutionMemory,
): LoggedExercise {
  const originalName = exercise.originalName ?? exercise.name;
  const memoryOptions = substitutionMemory[normalizeExerciseName(originalName)];

  return {
    ...cloneExercise(exercise),
    originalName,
    substitutions: mergeSubstitutionOptions(exercise.substitutions, memoryOptions),
  };
}

export function rememberWorkoutSubstitutions(
  substitutionMemory: SubstitutionMemory,
  workout: LoggedWorkout,
): SubstitutionMemory {
  const next: SubstitutionMemory = Object.fromEntries(
    Object.entries(substitutionMemory).map(([key, options]) => [key, options.map(cloneSubstitution)]),
  );

  for (const exercise of workout.exercises) {
    const originalName = exercise.originalName?.trim();
    const substitutedName = exercise.name.trim();

    if (!originalName || normalizeExerciseName(originalName) === normalizeExerciseName(substitutedName)) {
      continue;
    }

    const predefined = exercise.substitutions?.some(
      (option) =>
        option.source === "template" &&
        normalizeExerciseName(option.name) === normalizeExerciseName(substitutedName),
    );

    if (predefined) {
      continue;
    }

    const key = normalizeExerciseName(originalName);
    const currentOptions = next[key] ?? [];
    const existingIndex = currentOptions.findIndex(
      (option) => normalizeExerciseName(option.name) === normalizeExerciseName(substitutedName),
    );
    const learnedOption: ExerciseSubstitutionOption = {
      name: substitutedName,
      source: "custom",
      reason: exercise.substitutionReason,
      frequencyUsed: 1,
    };

    if (existingIndex >= 0) {
      const existing = currentOptions[existingIndex];
      currentOptions[existingIndex] = {
        ...existing,
        reason: exercise.substitutionReason ?? existing.reason,
        frequencyUsed: (existing.frequencyUsed ?? 0) + 1,
      };
      next[key] = currentOptions;
      continue;
    }

    next[key] = [...currentOptions, learnedOption];
  }

  return next;
}

const parseRepRange = (reps: string): { min: number; max: number } => {
  const match = reps.match(/\d+/g);
  if (!match || match.length === 0) {
    return { min: 8, max: 12 };
  }
  const min = Number(match[0]);
  const max = match.length > 1 ? Number(match[1]) : min;
  return { min, max };
};

const parseRpe = (rirOrRpe: string | null): number => {
  if (!rirOrRpe) {
    return 7;
  }
  const rpeMatch = rirOrRpe.match(/RPE\s*([\d.]+)/i);
  if (rpeMatch) {
    return Number(rpeMatch[1]);
  }
  const rirMatch = rirOrRpe.match(/([\d.]+)\s*RIR/i);
  if (rirMatch) {
    // Convert a rough RIR to RPE (RPE = 10 - RIR), clamped to a sane floor.
    return Math.max(6, 10 - Number(rirMatch[1]));
  }
  return 7;
};

export function createEmptyLoggedExercise(): LoggedExercise {
  return {
    name: "",
    sets: 3,
    repRangeMin: 8,
    repRangeMax: 12,
    weight: 0,
    rpe: 7,
    muscleGroups: [],
    substitutions: [],
  };
}

/**
 * Seed a logged workout from the existing sample mock data for the requested
 * workout type. Upper/Lower types are composed from the matching Push/Pull/Legs
 * sample sessions so every type can be quick-filled in the demo. Weight defaults
 * to 0 because the sample data has no weight; the user fills it in.
 */
export function buildQuickFillWorkout(
  dayOfWeek: DayOfWeek,
  workoutType: string,
  substitutionMemory: SubstitutionMemory = {},
): LoggedWorkout {
  const template = DEFAULT_WORKOUT_TEMPLATES[workoutType];
  if (template) {
    return {
      id: createId("workout"),
      dayOfWeek,
      workoutType,
      templateName: template.name,
      templateDescription: template.description,
      templateWeek: template.week,
      exercises: template.exercises.map((exercise) =>
        applySubstitutionMemory(exercise, substitutionMemory),
      ),
      loggedAt: new Date().toISOString(),
      sessionType: workoutType,
    };
  }

  const sampleByType: Record<string, string[]> = {
    Push: ["Push"],
    Pull: ["Pull"],
    Legs: ["Legs"],
    Upper: ["Push", "Pull"],
    Lower: ["Legs"],
  };

  const sourceTypes = sampleByType[workoutType] ?? [];
  const exercises: LoggedExercise[] = [];

  for (const sourceType of sourceTypes) {
    const sample = mockWorkoutWeek.workouts.find((workout) => workout.workoutType === sourceType);
    if (!sample) {
      continue;
    }
    for (const exercise of sample.exercises) {
      const range = parseRepRange(exercise.reps);
      exercises.push({
        name: exercise.name,
        originalName: exercise.name,
        sets: exercise.sets,
        repRangeMin: range.min,
        repRangeMax: range.max,
        weight: 0,
        rpe: parseRpe(exercise.rirOrRpe),
        muscleGroups: [...exercise.muscleGroups],
        substitutions: substitutionMemory[normalizeExerciseName(exercise.name)]?.map(cloneSubstitution) ?? [],
      });
    }
  }

  return {
    id: createId("workout"),
    dayOfWeek,
    workoutType,
    exercises,
    loggedAt: new Date().toISOString(),
    sessionType: workoutType,
  };
}

/**
 * Merge a Strava activity into a logged workout. Manual strength data
 * (sets / reps / weight / RPE) is the source of truth and is never overwritten.
 * Strava only fills physiological + external gaps: heart rate, duration,
 * calories, and distance. Manual values always win when present.
 */
export function enrichWorkout(workout: LoggedWorkout, activity: StravaActivity): LoggedWorkout {
  const avgHeartRate = workout.heartRate?.avg ?? activity.avgHeartRate;
  const maxHeartRate = workout.heartRate?.max ?? activity.maxHeartRate;

  const heartRate: HeartRateData | undefined =
    avgHeartRate !== undefined ? { avg: avgHeartRate, max: maxHeartRate } : undefined;

  return {
    ...workout,
    exercises: workout.exercises.map(cloneExercise),
    heartRate,
    durationMinutes: workout.durationMinutes ?? activity.durationMinutes,
    stravaData: {
      activityId: activity.activityId,
      durationMinutes: activity.durationMinutes,
      avgHeartRate: activity.avgHeartRate,
      maxHeartRate: activity.maxHeartRate,
      calories: activity.calories,
      distanceKm: activity.distanceKm,
    },
    enrichmentStatus: "enriched",
  };
}

/**
 * Placeholder progression logic. Intentionally simple and isolated so it can be
 * replaced with real periodization rules later. Weight is left as-is per spec;
 * only rep range, sets, and RPE progress.
 */
function progressExercise(
  exercise: LoggedExercise,
  weekNumber: number,
  progression: ProgressionSettings,
  lengthWeeks: number,
): LoggedExercise {
  const weekOffset = weekNumber - 1;
  const repRangeMin = exercise.repRangeMin + progression.repProgression * weekOffset;
  const repRangeMax = exercise.repRangeMax + progression.repProgression * weekOffset;
  const rpe = Number((exercise.rpe + progression.rpeProgression * weekOffset).toFixed(2));
  const addFinalSet = progression.setProgressionEnabled && weekNumber === lengthWeeks ? 1 : 0;
  const sets = exercise.sets + addFinalSet;

  return {
    ...exercise,
    sets,
    repRangeMin,
    repRangeMax,
    rpe,
    muscleGroups: [...exercise.muscleGroups],
    substitutions: exercise.substitutions?.map(cloneSubstitution),
  };
}

function progressWorkout(
  workout: LoggedWorkout,
  weekNumber: number,
  progression: ProgressionSettings,
  lengthWeeks: number,
): LoggedWorkout {
  return {
    ...workout,
    id: createId("workout"),
    exercises: workout.exercises.map((exercise) =>
      progressExercise(exercise, weekNumber, progression, lengthWeeks),
    ),
  };
}

/**
 * Semi-deload transform: train lighter and avoid failure. Caps RPE and trims a
 * working set per exercise (volume) while keeping the rep ranges intact.
 */
function deloadExercise(exercise: LoggedExercise): LoggedExercise {
  return {
    ...exercise,
    sets: Math.max(1, exercise.sets - 1),
    rpe: Math.min(exercise.rpe, 7),
    earlySetRpe: "6-7",
    lastSetRpe: "7",
    muscleGroups: [...exercise.muscleGroups],
    substitutions: exercise.substitutions?.map(cloneSubstitution),
  };
}

function deloadWorkout(workout: LoggedWorkout): LoggedWorkout {
  return {
    ...workout,
    id: createId("workout"),
    exercises: workout.exercises.map(deloadExercise),
  };
}

/**
 * Generate a mesocycle for multi-block preset programs. Blocks run sequentially
 * (e.g. weeks 1-5 Build, 6-10 Novelty), each drawing from its own baseline
 * workouts. The first week of each block is its baseline; deload weeks apply the
 * semi-deload transform; other weeks apply the normal progression.
 */
function generateMesocycleFromBlocks(program: Program, blocks: ProgramBlock[]): Mesocycle {
  const weeks: MesocycleWeek[] = [];
  let weekNumber = 0;

  for (const block of blocks) {
    const workoutByDay = new Map<DayOfWeek, LoggedWorkout>(
      block.baselineWorkouts.map((workout) => [workout.dayOfWeek, workout]),
    );

    for (let weekInBlock = 1; weekInBlock <= block.lengthWeeks; weekInBlock += 1) {
      weekNumber += 1;
      const isBaseline = weekInBlock === 1;
      const isDeload = block.deloadWeeks.includes(weekInBlock);

      const days: MesocycleWeekDay[] = program.weeklyCycle.days.map((cycleDay) => {
        if (cycleDay.workoutType === null) {
          return { dayOfWeek: cycleDay.dayOfWeek, workoutType: null, workout: null };
        }
        const baselineWorkout = workoutByDay.get(cycleDay.dayOfWeek);
        if (!baselineWorkout) {
          return { dayOfWeek: cycleDay.dayOfWeek, workoutType: cycleDay.workoutType, workout: null };
        }
        let workout: LoggedWorkout;
        if (isDeload) {
          workout = deloadWorkout(baselineWorkout);
        } else if (isBaseline) {
          workout = {
            ...baselineWorkout,
            id: createId("workout"),
            exercises: baselineWorkout.exercises.map(cloneExercise),
          };
        } else {
          workout = progressWorkout(baselineWorkout, weekInBlock, program.progression, block.lengthWeeks);
        }
        return { dayOfWeek: cycleDay.dayOfWeek, workoutType: cycleDay.workoutType, workout };
      });

      weeks.push({ weekNumber, isBaseline, isDeload, blockName: block.name, days });
    }
  }

  return { lengthWeeks: weeks.length, currentWeek: 1, weeks };
}

/**
 * Generate the full mesocycle from the logged baseline week. Week 1 is the
 * baseline (source of truth); later weeks apply the placeholder progression.
 * Weeks mirror the configured weekly cycle, laid out day-by-day.
 *
 * Preset programs carrying multiple blocks delegate to the block-aware path.
 */
export function generateMesocycle(program: Program): Mesocycle {
  if (program.blocks && program.blocks.length > 0) {
    return generateMesocycleFromBlocks(program, program.blocks);
  }

  const lengthWeeks = program.mesocycleLengthWeeks;
  const workoutByDay = new Map<DayOfWeek, LoggedWorkout>(
    program.baselineWeek.loggedWorkouts.map((workout) => [workout.dayOfWeek, workout]),
  );

  const weeks: MesocycleWeek[] = [];
  for (let weekNumber = 1; weekNumber <= lengthWeeks; weekNumber += 1) {
    const isBaseline = weekNumber === 1;
    const days: MesocycleWeekDay[] = program.weeklyCycle.days.map((cycleDay) => {
      if (cycleDay.workoutType === null) {
        return { dayOfWeek: cycleDay.dayOfWeek, workoutType: null, workout: null };
      }
      const baselineWorkout = workoutByDay.get(cycleDay.dayOfWeek);
      if (!baselineWorkout) {
        return { dayOfWeek: cycleDay.dayOfWeek, workoutType: cycleDay.workoutType, workout: null };
      }
      const workout = isBaseline
        ? {
            ...baselineWorkout,
            id: createId("workout"),
            exercises: baselineWorkout.exercises.map(cloneExercise),
          }
        : progressWorkout(baselineWorkout, weekNumber, program.progression, lengthWeeks);
      return { dayOfWeek: cycleDay.dayOfWeek, workoutType: cycleDay.workoutType, workout };
    });

    weeks.push({ weekNumber, isBaseline, days });
  }

  return {
    lengthWeeks,
    currentWeek: 1,
    weeks,
  };
}
