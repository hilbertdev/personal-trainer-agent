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
  generateMesocycle as generateMesocycleRecord,
  getScheduledSessions,
  type DayOfWeek,
  type LoggedWorkout,
  type Program,
  type ProgressionSettings,
  type SplitType,
  type WeeklyCycle,
} from "@/lib/program";

const STORAGE_KEY = "pta:active-program";

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
  logWorkout: (workout: LoggedWorkout) => void;
  removeLoggedWorkout: (dayOfWeek: DayOfWeek) => void;
  generateMesocycle: () => void;
  advanceWeek: () => void;
  resetProgram: () => void;
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
    return parsed as Program;
  } catch {
    return null;
  }
}

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [activeProgram, setActiveProgram] = useState<Program | null>(() => loadProgram());
  const [isWizardOpen, setIsWizardOpen] = useState(false);

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
  }, []);

  const value = useMemo<ProgramContextValue>(
    () => ({
      activeProgram,
      isWizardOpen,
      openWizard,
      closeWizard,
      createProgram,
      logWorkout,
      removeLoggedWorkout,
      generateMesocycle,
      advanceWeek,
      resetProgram,
    }),
    [
      activeProgram,
      isWizardOpen,
      openWizard,
      closeWizard,
      createProgram,
      logWorkout,
      removeLoggedWorkout,
      generateMesocycle,
      advanceWeek,
      resetProgram,
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
