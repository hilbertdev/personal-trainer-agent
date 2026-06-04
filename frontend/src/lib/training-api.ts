import {
  getScheduledSessions,
  type DayOfWeek,
  type LoggedExercise,
  type LoggedWorkout,
  type Program,
} from "@/lib/program";

const API_URL = import.meta.env.VITE_API_URL ?? import.meta.env.NEXT_PUBLIC_API_URL ?? "";
const USE_MOCK_DATA =
  (import.meta.env.VITE_USE_MOCK_DATA ?? import.meta.env.NEXT_PUBLIC_USE_MOCK_DATA) !== "false";

const ATHLETE_STORAGE_KEY = "pta:athlete-id";
const ACTIVE_PROGRAM_STORAGE_KEY = "pta:active-program";
const ARCHIVED_PROGRAMS_STORAGE_KEY = "pta:archived-program-ids";
const PROGRAM_LINK_STORAGE_KEY = "pta:program-backend-link";

const DEFAULT_ATHLETE_ID = "11111111-1111-1111-1111-111111111111";

/**
 * Backend program/workout DTOs (mirrors Training.Api contracts). These intentionally
 * use the structured backend shape, not the rich local `Program` model.
 */
export interface ProgramSummary {
  id: string;
  name: string;
  athleteId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  totalWeeks: number;
  currentWeek: number;
  sessionsPerWeek: number;
}

export interface ExerciseTemplateDto {
  id: string;
  exerciseName: string;
  warmupSets?: string | null;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  earlySetRpe?: string | null;
  lastSetRpe?: string | null;
  restTime?: string | null;
  lastSetIntensityTechnique?: string | null;
  notes?: string | null;
  category: string;
  substitutions: { id: string; exerciseName: string }[];
}

export interface WorkoutTemplateDto {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  exercises: ExerciseTemplateDto[];
  workoutType?: string | null;
  description?: string | null;
}

export interface TodayWorkout {
  date: string;
  workoutTemplate: WorkoutTemplateDto;
}

export interface ExerciseExecutionPayload {
  originalExerciseTemplateId?: string | null;
  exerciseName: string;
  setsPerformed: number;
  repsPerformed: number;
  weightUsed: number;
  substitutionReason?: string | null;
  contextTags: string[];
}

export interface RecordExecutionPayload {
  athleteId: string;
  date: string;
  exercises: ExerciseExecutionPayload[];
  durationMinutes: number;
  totalVolume?: number | null;
  notes?: string | null;
}

export interface WorkoutExecutionResult {
  id: string;
  date: string;
  durationMinutes: number;
  totalVolume: number;
}

interface ImportExerciseRequest {
  exerciseName: string;
  warmupSets: string | null;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  earlySetRpe: string | null;
  lastSetRpe: string | null;
  restTime: string | null;
  lastSetIntensityTechnique: string | null;
  notes: string | null;
  category: string;
  substitutions: string[];
}

interface ImportProgramRequest {
  name: string;
  athleteId: string;
  startDate: string;
  endDate: string | null;
  mesocycles: {
    name: string;
    startDate: string;
    durationWeeks: number;
    weeklyPlans: {
      weekNumber: number;
      workouts: {
        name: string;
        dayOfWeek: DayOfWeek;
        exercises: ImportExerciseRequest[];
        workoutType: string | null;
        description: string | null;
      }[];
    }[];
  }[];
}

export interface TrainingApiService {
  listPrograms: (athleteId: string) => Promise<ProgramSummary[]>;
  importProgram: (program: Program) => Promise<{ id: string }>;
  endProgram: (programId: string) => Promise<void>;
  getTodayWorkout: (athleteId: string, date?: string) => Promise<TodayWorkout | null>;
  recordExecution: (
    templateId: string,
    payload: RecordExecutionPayload,
  ) => Promise<WorkoutExecutionResult>;
}

/** A stable athlete id. Prefers the configured env value, otherwise a persisted UUID. */
export function getAthleteId(): string {
  const configured = import.meta.env.VITE_ATHLETE_ID ?? import.meta.env.NEXT_PUBLIC_ATHLETE_ID;
  if (configured) {
    return configured;
  }
  if (typeof window === "undefined") {
    return DEFAULT_ATHLETE_ID;
  }
  try {
    const stored = window.localStorage.getItem(ATHLETE_STORAGE_KEY);
    if (stored) {
      return stored;
    }
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : DEFAULT_ATHLETE_ID;
    window.localStorage.setItem(ATHLETE_STORAGE_KEY, generated);
    return generated;
  } catch {
    return DEFAULT_ATHLETE_ID;
  }
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Monday of the current week, so generated week 1 always contains today. */
function startOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  today.setDate(today.getDate() - diff);
  return isoDate(today);
}

function toImportExercise(exercise: LoggedExercise): ImportExerciseRequest {
  return {
    exerciseName: exercise.name,
    warmupSets: exercise.warmupSets ?? null,
    targetSets: exercise.sets,
    targetRepMin: exercise.repRangeMin,
    targetRepMax: exercise.repRangeMax,
    earlySetRpe: exercise.earlySetRpe ?? null,
    lastSetRpe: exercise.lastSetRpe ?? (exercise.rpe ? String(exercise.rpe) : null),
    restTime: exercise.restTime ?? null,
    lastSetIntensityTechnique: exercise.lastSetIntensityTechnique ?? null,
    notes: exercise.notes ?? null,
    category: "Hypertrophy",
    substitutions: (exercise.substitutions ?? []).map((option) => option.name),
  };
}

function buildImportRequest(program: Program, athleteId: string): ImportProgramRequest {
  const startDate = startOfCurrentWeek();
  const weeks = program.mesocycle?.weeks ?? [];
  const totalWeeks = program.mesocycle?.lengthWeeks ?? weeks.length ?? program.mesocycleLengthWeeks;

  const weeklyPlans = weeks.map((week) => ({
    weekNumber: week.weekNumber,
    workouts: week.days
      .filter((day): day is typeof day & { workout: LoggedWorkout } => day.workout !== null)
      .map((day) => ({
        name: `${day.workoutType ?? day.workout.workoutType} Day`,
        dayOfWeek: day.dayOfWeek,
        exercises: day.workout.exercises.map(toImportExercise),
        workoutType: day.workoutType ?? day.workout.workoutType,
        description: day.workout.templateDescription ?? null,
      })),
  }));

  return {
    name: program.name,
    athleteId,
    startDate,
    endDate: null,
    mesocycles: [
      {
        name: program.name,
        startDate,
        durationWeeks: Math.max(1, totalWeeks),
        weeklyPlans,
      },
    ],
  };
}

class RealTrainingApiService implements TrainingApiService {
  constructor(private readonly apiUrl: string) {}

  listPrograms(athleteId: string) {
    return this.apiFetch<ProgramSummary[]>(
      `/api/programs?athleteId=${encodeURIComponent(athleteId)}`,
    );
  }

  async importProgram(program: Program) {
    const athleteId = getAthleteId();
    const response = await this.apiFetch<{ id: string }>("/api/programs/import", {
      method: "POST",
      body: JSON.stringify(buildImportRequest(program, athleteId)),
    });
    return { id: response.id };
  }

  async endProgram(programId: string) {
    await this.apiFetch<unknown>(`/api/programs/${encodeURIComponent(programId)}/end`, {
      method: "POST",
      body: JSON.stringify({ endDate: isoDate(new Date()) }),
    });
  }

  async getTodayWorkout(athleteId: string, date?: string) {
    const query = new URLSearchParams({ athleteId });
    if (date) {
      query.set("date", date);
    }
    const response = await fetch(`${this.apiUrl}/api/workouts/today?${query.toString()}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to load today's workout (${response.status})`);
    }
    return (await response.json()) as TodayWorkout;
  }

  recordExecution(templateId: string, payload: RecordExecutionPayload) {
    return this.apiFetch<WorkoutExecutionResult>(
      `/api/workouts/${encodeURIComponent(templateId)}/execute`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  }

  private async apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `API request failed with ${response.status}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }
}

const JS_DAY_TO_DAY_OF_WEEK: DayOfWeek[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function readActiveProgram(): Program | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(ACTIVE_PROGRAM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Program) : null;
  } catch {
    return null;
  }
}

function readArchivedIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(ARCHIVED_PROGRAMS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function workoutToTemplateDto(programId: string, workout: LoggedWorkout): WorkoutTemplateDto {
  return {
    id: `${programId}:${workout.dayOfWeek}`,
    name: `${workout.workoutType} Day`,
    dayOfWeek: workout.dayOfWeek,
    workoutType: workout.workoutType,
    description: workout.templateDescription ?? null,
    exercises: workout.exercises.map((exercise, index) => ({
      id: `${programId}:${workout.dayOfWeek}:${index}`,
      exerciseName: exercise.name,
      warmupSets: exercise.warmupSets ?? null,
      targetSets: exercise.sets,
      targetRepMin: exercise.repRangeMin,
      targetRepMax: exercise.repRangeMax,
      earlySetRpe: exercise.earlySetRpe ?? null,
      lastSetRpe: exercise.lastSetRpe ?? null,
      restTime: exercise.restTime ?? null,
      lastSetIntensityTechnique: exercise.lastSetIntensityTechnique ?? null,
      notes: exercise.notes ?? null,
      category: "Hypertrophy",
      substitutions: (exercise.substitutions ?? []).map((option, optionIndex) => ({
        id: `${programId}:${workout.dayOfWeek}:${index}:${optionIndex}`,
        exerciseName: option.name,
      })),
    })),
  };
}

/**
 * Mock service backed by the locally persisted program so the new pages remain
 * demoable without a running backend (default dev mode).
 */
class MockTrainingApiService implements TrainingApiService {
  async listPrograms(athleteId: string): Promise<ProgramSummary[]> {
    await mockDelay();
    const program = readActiveProgram();
    if (!program) {
      return [];
    }
    const archivedIds = readArchivedIds();
    const weeks = program.mesocycle?.lengthWeeks ?? program.mesocycleLengthWeeks;
    const sessionsPerWeek = getScheduledSessions(program.weeklyCycle).length;
    const isArchived = archivedIds.includes(program.id);
    return [
      {
        id: program.id,
        name: program.name,
        athleteId,
        startDate: program.createdAt.slice(0, 10),
        endDate: isArchived ? isoDate(new Date()) : null,
        isActive: !isArchived,
        totalWeeks: weeks,
        currentWeek: program.mesocycle?.currentWeek ?? 1,
        sessionsPerWeek,
      },
    ];
  }

  async importProgram(program: Program): Promise<{ id: string }> {
    await mockDelay();
    return { id: program.id };
  }

  async endProgram(programId: string): Promise<void> {
    await mockDelay();
    if (typeof window === "undefined") {
      return;
    }
    const archived = new Set(readArchivedIds());
    archived.add(programId);
    window.localStorage.setItem(ARCHIVED_PROGRAMS_STORAGE_KEY, JSON.stringify([...archived]));
  }

  async getTodayWorkout(_athleteId: string, date?: string): Promise<TodayWorkout | null> {
    await mockDelay();
    const program = readActiveProgram();
    if (!program?.mesocycle) {
      return null;
    }
    const target = date ? new Date(date) : new Date();
    const today = JS_DAY_TO_DAY_OF_WEEK[target.getDay()];
    const currentWeek = program.mesocycle.weeks.find(
      (week) => week.weekNumber === program.mesocycle?.currentWeek,
    );
    const entry = currentWeek?.days.find((day) => day.dayOfWeek === today);
    if (!entry?.workout) {
      return null;
    }
    return {
      date: isoDate(target),
      workoutTemplate: workoutToTemplateDto(program.id, entry.workout),
    };
  }

  async recordExecution(
    _templateId: string,
    payload: RecordExecutionPayload,
  ): Promise<WorkoutExecutionResult> {
    await mockDelay();
    const totalVolume = payload.exercises.reduce(
      (sum, exercise) => sum + exercise.setsPerformed * exercise.repsPerformed * exercise.weightUsed,
      0,
    );
    return {
      id: `mock-${Date.now()}`,
      date: payload.date,
      durationMinutes: payload.durationMinutes,
      totalVolume,
    };
  }
}

const mockTrainingApiService = new MockTrainingApiService();

function withMockFallback(real: TrainingApiService): TrainingApiService {
  return {
    listPrograms: (athleteId) =>
      real.listPrograms(athleteId).catch(() => mockTrainingApiService.listPrograms(athleteId)),
    importProgram: (program) =>
      real.importProgram(program).catch(() => mockTrainingApiService.importProgram(program)),
    endProgram: (programId) =>
      real.endProgram(programId).catch(() => mockTrainingApiService.endProgram(programId)),
    getTodayWorkout: (athleteId, date) =>
      real
        .getTodayWorkout(athleteId, date)
        .catch(() => mockTrainingApiService.getTodayWorkout(athleteId, date)),
    recordExecution: (templateId, payload) =>
      real
        .recordExecution(templateId, payload)
        .catch(() => mockTrainingApiService.recordExecution(templateId, payload)),
  };
}

const trainingApiService: TrainingApiService = USE_MOCK_DATA
  ? mockTrainingApiService
  : withMockFallback(new RealTrainingApiService(API_URL));

export function listPrograms(athleteId: string = getAthleteId()): Promise<ProgramSummary[]> {
  return trainingApiService.listPrograms(athleteId);
}

export function importProgram(program: Program): Promise<{ id: string }> {
  return trainingApiService.importProgram(program);
}

export function endProgram(programId: string): Promise<void> {
  return trainingApiService.endProgram(programId);
}

export function getTodayWorkout(
  athleteId: string = getAthleteId(),
  date?: string,
): Promise<TodayWorkout | null> {
  return trainingApiService.getTodayWorkout(athleteId, date);
}

export function recordExecution(
  templateId: string,
  payload: RecordExecutionPayload,
): Promise<WorkoutExecutionResult> {
  return trainingApiService.recordExecution(templateId, payload);
}

export { PROGRAM_LINK_STORAGE_KEY };

function mockDelay() {
  const delay = 150 + Math.floor(Math.random() * 250);
  return new Promise((resolve) => setTimeout(resolve, delay));
}
