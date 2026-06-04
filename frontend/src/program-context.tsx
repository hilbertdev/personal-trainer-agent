"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createProgram as createProgramRecord,
  createProgramFromPreset,
  enrichWorkout,
  generateMesocycle as generateMesocycleRecord,
  getScheduledSessions,
  rememberWorkoutSubstitutions,
  type DayOfWeek,
  type LoggedWorkout,
  type Program,
  type ProgramPreset,
  type ProgressionSettings,
  type SplitType,
  type StravaActivity,
  type WeeklyCycle,
  type WorkoutMapping,
} from "@/lib/program";
import { syncStravaActivities } from "@/lib/strava";

const STORAGE_KEY = "pta:active-program";

export type StravaSyncStatus = "idle" | "syncing" | "synced" | "error";

export interface CreateProgramInput {
  name: string;
  splitType: SplitType;
  weeklyCycle: WeeklyCycle;
  mesocycleLengthWeeks: number;
  progression: ProgressionSettings;
}

interface ProgramContextValue {
  activeProgram: Program | null;
  isWizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
  createProgram: (input: CreateProgramInput) => void;
  createPresetProgram: (preset: ProgramPreset, name?: string) => void;
  updateMesocycleWorkout: (weekNumber: number, workout: LoggedWorkout) => void;
  logWorkout: (workout: LoggedWorkout) => void;
  removeLoggedWorkout: (dayOfWeek: DayOfWeek) => void;
  generateMesocycle: () => void;
  advanceWeek: () => void;
  resetProgram: () => void;
  // Strava sync + enrichment (additive; does not affect baseline completion).
  stravaActivities: StravaActivity[];
  pendingMappings: WorkoutMapping[];
  stravaSyncStatus: StravaSyncStatus;
  syncStrava: () => Promise<void>;
  setMapping: (workoutId: string, activityId: string | null) => void;
  confirmMappings: () => void;
  resetStravaSync: () => void;
}

const ProgramContext = createContext<ProgramContextValue | null>(null);

/**
 * Load the persisted program. Older persisted shapes (pre weekly-cycle, or
 * template-based baseline weeks) are incompatible, so discard them and fall
 * back cleanly to the mock dashboard instead of crashing.
 */
function loadProgram(): Program | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<Program> & {
      baselineWeek?: { loggedWorkouts?: unknown; templates?: unknown };
    };
    const hasWeeklyCycle = Boolean(parsed.weeklyCycle?.days);
    const hasLoggedWorkouts = Array.isArray(parsed.baselineWeek?.loggedWorkouts);
    if (!hasWeeklyCycle || !hasLoggedWorkouts) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      ...(parsed as Program),
      substitutionMemory: parsed.substitutionMemory ?? {},
    };
  } catch {
    return null;
  }
}

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [activeProgram, setActiveProgram] = useState<Program | null>(() => loadProgram());
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([]);
  const [pendingMappings, setPendingMappings] = useState<WorkoutMapping[]>([]);
  const [stravaSyncStatus, setStravaSyncStatus] = useState<StravaSyncStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (activeProgram) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeProgram));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage write failures (e.g. private mode); state remains in memory.
    }
  }, [activeProgram]);

  const openWizard = useCallback(() => setIsWizardOpen(true), []);
  const closeWizard = useCallback(() => setIsWizardOpen(false), []);

  const createProgram = useCallback((input: CreateProgramInput) => {
    setActiveProgram(createProgramRecord(input));
    setIsWizardOpen(false);
  }, []);

  const createPresetProgram = useCallback((preset: ProgramPreset, name?: string) => {
    setActiveProgram(createProgramFromPreset(preset, name));
    setIsWizardOpen(false);
  }, []);

  // Inline-edit a single day within the generated mesocycle. Edits live only on
  // this program (persisted locally) and never touch the shared templates. When
  // editing a block's baseline week we also sync that block's baseline so the
  // change stays the source of truth for that block.
  const updateMesocycleWorkout = useCallback((weekNumber: number, workout: LoggedWorkout) => {
    setActiveProgram((current) => {
      if (!current || !current.mesocycle) {
        return current;
      }
      const editedWeek = current.mesocycle.weeks.find((week) => week.weekNumber === weekNumber);
      const weeks = current.mesocycle.weeks.map((week) =>
        week.weekNumber === weekNumber
          ? {
              ...week,
              days: week.days.map((day) =>
                day.dayOfWeek === workout.dayOfWeek
                  ? { ...day, workoutType: workout.workoutType, workout }
                  : day,
              ),
            }
          : week,
      );

      let blocks = current.blocks;
      if (blocks && editedWeek?.isBaseline && editedWeek.blockName) {
        blocks = blocks.map((block) =>
          block.name === editedWeek.blockName
            ? {
                ...block,
                baselineWorkouts: block.baselineWorkouts.map((existing) =>
                  existing.dayOfWeek === workout.dayOfWeek ? workout : existing,
                ),
              }
            : block,
        );
      }

      return { ...current, blocks, mesocycle: { ...current.mesocycle, weeks } };
    });
  }, []);

  const logWorkout = useCallback((workout: LoggedWorkout) => {
    setActiveProgram((current) => {
      if (!current || current.status !== "collecting_baseline_week") {
        return current;
      }
      const scheduledDays = new Set(
        getScheduledSessions(current.weeklyCycle).map((session) => session.dayOfWeek),
      );
      if (!scheduledDays.has(workout.dayOfWeek)) {
        return current;
      }
      const others = current.baselineWeek.loggedWorkouts.filter(
        (logged) => logged.dayOfWeek !== workout.dayOfWeek,
      );
      return {
        ...current,
        substitutionMemory: rememberWorkoutSubstitutions(current.substitutionMemory ?? {}, workout),
        baselineWeek: {
          ...current.baselineWeek,
          loggedWorkouts: [...others, workout],
        },
      };
    });
  }, []);

  const removeLoggedWorkout = useCallback((dayOfWeek: DayOfWeek) => {
    setActiveProgram((current) => {
      if (!current || current.status !== "collecting_baseline_week") {
        return current;
      }
      return {
        ...current,
        baselineWeek: {
          ...current.baselineWeek,
          loggedWorkouts: current.baselineWeek.loggedWorkouts.filter(
            (logged) => logged.dayOfWeek !== dayOfWeek,
          ),
        },
      };
    });
  }, []);

  const generateMesocycle = useCallback(() => {
    setActiveProgram((current) => {
      if (!current || current.status !== "collecting_baseline_week") {
        return current;
      }
      return {
        ...current,
        status: "active_mesocycle",
        mesocycle: generateMesocycleRecord(current),
      };
    });
  }, []);

  const advanceWeek = useCallback(() => {
    setActiveProgram((current) => {
      if (!current || current.status !== "active_mesocycle" || !current.mesocycle) {
        return current;
      }
      const nextWeek = Math.min(current.mesocycle.currentWeek + 1, current.mesocycle.lengthWeeks);
      return {
        ...current,
        mesocycle: { ...current.mesocycle, currentWeek: nextWeek },
      };
    });
  }, []);

  const resetProgram = useCallback(() => {
    setActiveProgram(null);
    setIsWizardOpen(false);
    setStravaActivities([]);
    setPendingMappings([]);
    setStravaSyncStatus("idle");
  }, []);

  const syncStrava = useCallback(async () => {
    setStravaSyncStatus("syncing");
    try {
      const activities = await syncStravaActivities();
      setStravaActivities(activities);
      setPendingMappings([]);
      setStravaSyncStatus("synced");
    } catch {
      setStravaSyncStatus("error");
    }
  }, []);

  const setMapping = useCallback((workoutId: string, activityId: string | null) => {
    setPendingMappings((current) => {
      const withoutWorkout = current.filter((mapping) => mapping.workoutId !== workoutId);
      if (!activityId) {
        return withoutWorkout;
      }
      // An activity can only map to one workout, so drop any prior owner.
      const withoutActivity = withoutWorkout.filter((mapping) => mapping.activityId !== activityId);
      return [...withoutActivity, { workoutId, activityId }];
    });
  }, []);

  const confirmMappings = useCallback(() => {
    setActiveProgram((current) => {
      if (!current) {
        return current;
      }
      if (pendingMappings.length === 0) {
        return current;
      }
      const activityById = new Map(
        stravaActivities.map((activity) => [activity.activityId, activity]),
      );
      const mappingByWorkout = new Map(
        pendingMappings.map((mapping) => [mapping.workoutId, mapping.activityId]),
      );

      return {
        ...current,
        baselineWeek: {
          ...current.baselineWeek,
          loggedWorkouts: current.baselineWeek.loggedWorkouts.map((workout) => {
            const activityId = mappingByWorkout.get(workout.id);
            if (!activityId) {
              return workout;
            }
            const activity = activityById.get(activityId);
            return activity ? enrichWorkout(workout, activity) : workout;
          }),
        },
      };
    });
  }, [pendingMappings, stravaActivities]);

  const resetStravaSync = useCallback(() => {
    setStravaActivities([]);
    setPendingMappings([]);
    setStravaSyncStatus("idle");
  }, []);

  const value = useMemo<ProgramContextValue>(
    () => ({
      activeProgram,
      isWizardOpen,
      openWizard,
      closeWizard,
      createProgram,
      createPresetProgram,
      updateMesocycleWorkout,
      logWorkout,
      removeLoggedWorkout,
      generateMesocycle,
      advanceWeek,
      resetProgram,
      stravaActivities,
      pendingMappings,
      stravaSyncStatus,
      syncStrava,
      setMapping,
      confirmMappings,
      resetStravaSync,
    }),
    [
      activeProgram,
      isWizardOpen,
      openWizard,
      closeWizard,
      createProgram,
      createPresetProgram,
      updateMesocycleWorkout,
      logWorkout,
      removeLoggedWorkout,
      generateMesocycle,
      advanceWeek,
      resetProgram,
      stravaActivities,
      pendingMappings,
      stravaSyncStatus,
      syncStrava,
      setMapping,
      confirmMappings,
      resetStravaSync,
    ],
  );

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>;
}

export function useProgram(): ProgramContextValue {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error("useProgram must be used within a ProgramProvider");
  }
  return context;
}
