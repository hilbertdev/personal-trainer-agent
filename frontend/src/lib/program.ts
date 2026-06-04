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
      { slot: "Upper", muscleGroups: ["Chest", "Back", "Shoulders", "Arms"] },
      { slot: "Lower", muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"] },
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

export function getSplitDefinition(splitType: SplitType): SplitDefinition {
  return SPLIT_DEFINITIONS[splitType];
}

export function getSplitSlots(splitType: SplitType): string[] {
  return SPLIT_DEFINITIONS[splitType].slots.map((slot) => slot.slot);
}

const DEFAULT_WEEKLY_CYCLES: Record<SplitType, (string | null)[]> = {
  // Monday..Sunday
  PPL: ["Push", "Pull", "Legs", null, "Push", "Pull", null],
  UPPER_LOWER: ["Upper", "Lower", null, "Upper", "Lower", null, null],
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
  if (workoutType === "Upper") {
    return {
      id: createId("workout"),
      dayOfWeek,
      workoutType,
      templateName: UPPER_1_TEMPLATE_NAME,
      templateDescription: UPPER_1_TEMPLATE_DESCRIPTION,
      templateWeek: UPPER_1_TEMPLATE_WEEK,
      exercises: DEFAULT_UPPER_1_EXERCISES.map((exercise) =>
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
