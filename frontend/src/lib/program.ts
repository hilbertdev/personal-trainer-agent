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
    name: "Super-ROM Overhead Cable Row",
    originalName: "Super-ROM Overhead Cable Row",
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
    substitutions: templateSubstitutions(["Overhead Machine Row", "Arm-Out Single-Arm DB Row"]),
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
    substitutions: templateSubstitutions(["DB Incline Curl", "DB Spider Curl"]),
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
 * Generate the full mesocycle from the logged baseline week. Week 1 is the
 * baseline (source of truth); later weeks apply the placeholder progression.
 * Weeks mirror the configured weekly cycle, laid out day-by-day.
 */
export function generateMesocycle(program: Program): Mesocycle {
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
