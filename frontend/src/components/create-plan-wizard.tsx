"use client";

import { Check, ChevronLeft, Dumbbell } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { WeeklyWorkloadSummary } from "@/components/weekly-workload-summary";
import {
  getDefaultWeeklyCycle,
  getSplitSlots,
  getWeeklyWorkload,
  MESOCYCLE_LENGTH_OPTIONS,
  PROGRAM_PRESETS,
  REP_PROGRESSION_OPTIONS,
  RPE_PROGRESSION_OPTIONS,
  SPLIT_DEFINITIONS,
  type ProgramPreset,
  type ProgressionSettings,
  type SplitType,
  type WeeklyCycle,
} from "@/lib/program";
import { useProgram } from "@/program-context";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 6;

const PLAN_NAME_EXAMPLES = ["Hypertrophy Block A", "Strength Block", "Marathon Maintenance"];

const defaultProgression: ProgressionSettings = {
  repProgression: 0,
  setProgressionEnabled: false,
  rpeProgression: 0,
};

export function CreatePlanWizard() {
  const { isWizardOpen, closeWizard, createProgram, createPresetProgram } = useProgram();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [splitType, setSplitType] = useState<SplitType | null>(null);
  const [weeklyCycle, setWeeklyCycle] = useState<WeeklyCycle | null>(null);
  const [mesocycleLengthWeeks, setMesocycleLengthWeeks] = useState<number | null>(null);
  const [progression, setProgression] = useState<ProgressionSettings>(defaultProgression);

  const reset = () => {
    setStep(1);
    setName("");
    setSplitType(null);
    setWeeklyCycle(null);
    setMesocycleLengthWeeks(null);
    setProgression(defaultProgression);
  };

  const handleClose = () => {
    closeWizard();
    reset();
  };

  const selectSplit = (type: SplitType) => {
    setSplitType(type);
    // Seed a sensible default weekly cycle whenever the split changes.
    setWeeklyCycle(getDefaultWeeklyCycle(type));
  };

  const setDayWorkout = (dayIndex: number, workoutType: string | null) => {
    setWeeklyCycle((current) => {
      if (!current) {
        return current;
      }
      return {
        days: current.days.map((day, index) =>
          index === dayIndex ? { ...day, workoutType } : day,
        ),
      };
    });
  };

  const canContinue = (() => {
    if (step === 1) {
      return name.trim().length > 0;
    }
    if (step === 2) {
      return splitType !== null;
    }
    if (step === 3) {
      return weeklyCycle !== null && getWeeklyWorkload(weeklyCycle).totalSessions > 0;
    }
    if (step === 4) {
      return mesocycleLengthWeeks !== null;
    }
    return true;
  })();

  const handleCreate = () => {
    if (!splitType || !weeklyCycle || !mesocycleLengthWeeks) {
      return;
    }
    createProgram({ name, splitType, weeklyCycle, mesocycleLengthWeeks, progression });
    reset();
  };

  const startFromPreset = (preset: ProgramPreset) => {
    createPresetProgram(preset, name);
    reset();
  };

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      {step > 1 ? (
        <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => setStep((value) => value - 1)}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto" onClick={handleClose}>
          Cancel
        </Button>
      )}

      {step < TOTAL_STEPS ? (
        <Button type="button" disabled={!canContinue} className="w-full sm:w-auto" onClick={() => setStep((value) => value + 1)}>
          Continue
        </Button>
      ) : (
        <Button type="button" className="w-full sm:w-auto" onClick={handleCreate}>
          <Dumbbell className="h-4 w-4" /> Create Plan
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      open={isWizardOpen}
      onClose={handleClose}
      title="Create Workout Plan"
      description={`Step ${step} of ${TOTAL_STEPS}`}
      footer={footer}
    >
      <StepIndicator step={step} />

      {step === 1 && (
        <StepContainer title="Plan details" subtitle="Give this mesocycle a name you'll recognise.">
          <label className="block text-sm font-semibold" htmlFor="plan-name">
            Plan Name
          </label>
          <input
            id="plan-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Hypertrophy Block A"
            autoFocus
            className={cn("mt-2", inputClassName)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {PLAN_NAME_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setName(example)}
                className="min-h-11 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-lime-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
              <span className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 sm:tracking-[0.2em]">
                or start from a template
              </span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            </div>
            <div className="mt-4 grid gap-3">
              {PROGRAM_PRESETS.map((preset) => {
                const totalWeeks = preset.blocks.reduce((sum, block) => sum + block.lengthWeeks, 0);
                return (
                  <div
                    key={preset.id}
                    className="rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold">{preset.name}</h4>
                      <Badge tone="lime">{totalWeeks} weeks</Badge>
                      {preset.blocks.map((block) => (
                        <Badge key={block.name} tone="zinc">
                          {block.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{preset.description}</p>
                    <Button
                      type="button"
                      className="mt-4 w-full sm:w-auto"
                      onClick={() => startFromPreset(preset)}
                    >
                      <Dumbbell className="h-4 w-4" /> Use this template
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Templates are a starting point. After creating, edit any exercise, set, rep, or substitution -
              your changes stay on this device and never alter the template.
            </p>
          </div>
        </StepContainer>
      )}

      {step === 2 && (
        <StepContainer title="Select workout split" subtitle="Choose how your training week is structured.">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(SPLIT_DEFINITIONS) as SplitType[]).map((type) => {
              const definition = SPLIT_DEFINITIONS[type];
              const selected = splitType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectSplit(type)}
                  className={cn(
                    "rounded-3xl border p-4 text-left transition",
                    selected
                      ? "border-lime-400 bg-lime-300/15 ring-2 ring-lime-300"
                      : "border-zinc-200 bg-white/70 hover:border-lime-300 dark:border-white/10 dark:bg-white/5",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold">{definition.label}</h4>
                    {selected && <Check className="h-5 w-5 text-lime-500" />}
                  </div>
                  <div className="mt-3 space-y-2">
                    {definition.slots.map((slot) => (
                      <div key={slot.slot}>
                        <p className="text-sm font-semibold">{slot.slot}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {slot.muscleGroups.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </StepContainer>
      )}

      {step === 3 && splitType && weeklyCycle && (
        <StepContainer
          title="Weekly cycle"
          subtitle="How many times will you perform each workout in your weekly cycle?"
        >
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-2">
              {weeklyCycle.days.map((day, index) => (
                <div
                  key={day.dayOfWeek}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:py-2.5"
                >
                  <span className="text-sm font-semibold">{day.dayOfWeek}</span>
                  <div className="flex flex-wrap gap-1.5 sm:justify-end">
                    {getSplitSlots(splitType).map((slot) => (
                      <DayOption
                        key={slot}
                        label={slot}
                        selected={day.workoutType === slot}
                        onClick={() => setDayWorkout(index, slot)}
                      />
                    ))}
                    <DayOption
                      label="Rest"
                      selected={day.workoutType === null}
                      onClick={() => setDayWorkout(index, null)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <WeeklyWorkloadSummary weeklyCycle={weeklyCycle} />
          </div>
        </StepContainer>
      )}

      {step === 4 && (
        <StepContainer title="Mesocycle duration" subtitle="How long is this mesocycle?">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MESOCYCLE_LENGTH_OPTIONS.map((weeks) => {
              const selected = mesocycleLengthWeeks === weeks;
              return (
                <button
                  key={weeks}
                  type="button"
                  onClick={() => setMesocycleLengthWeeks(weeks)}
                  className={cn(
                    "rounded-3xl border p-4 text-center transition",
                    selected
                      ? "border-lime-400 bg-lime-300/15 ring-2 ring-lime-300"
                      : "border-zinc-200 bg-white/70 hover:border-lime-300 dark:border-white/10 dark:bg-white/5",
                  )}
                >
                  <p className="text-2xl font-black">{weeks}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    Weeks
                  </p>
                </button>
              );
            })}
          </div>
        </StepContainer>
      )}

      {step === 5 && (
        <StepContainer
          title="Progression rules"
          subtitle="Configure how future weeks will be generated from your baseline week."
        >
          <div className="space-y-5">
            <OptionGroup
              label="Rep Progression"
              options={REP_PROGRESSION_OPTIONS}
              value={progression.repProgression}
              onChange={(value) => setProgression((prev) => ({ ...prev, repProgression: value }))}
            />
            <OptionGroup
              label="RPE Progression"
              options={RPE_PROGRESSION_OPTIONS}
              value={progression.rpeProgression}
              onChange={(value) => setProgression((prev) => ({ ...prev, rpeProgression: value }))}
            />
            <OptionGroup
              label="Set Progression"
              options={[
                { label: "None", value: 0 },
                { label: "Add 1 Set Final Week", value: 1 },
              ]}
              value={progression.setProgressionEnabled ? 1 : 0}
              onChange={(value) =>
                setProgression((prev) => ({ ...prev, setProgressionEnabled: value === 1 }))
              }
            />
          </div>
        </StepContainer>
      )}

      {step === 6 && splitType && weeklyCycle && mesocycleLengthWeeks && (
        <StepContainer title="Review & create" subtitle="Confirm your plan. You'll log your baseline week next.">
          <dl className="space-y-3">
            <SummaryRow label="Plan Name" value={name} />
            <SummaryRow label="Workout Split" value={SPLIT_DEFINITIONS[splitType].label} />
            <SummaryRow
              label="Weekly Sessions"
              value={`${getWeeklyWorkload(weeklyCycle).totalSessions} sessions / ${
                getWeeklyWorkload(weeklyCycle).restDays
              } rest`}
            />
            <SummaryRow label="Mesocycle" value={`${mesocycleLengthWeeks} Weeks`} />
            <SummaryRow
              label="Rep Progression"
              value={REP_PROGRESSION_OPTIONS.find((o) => o.value === progression.repProgression)?.label ?? "None"}
            />
            <SummaryRow
              label="RPE Progression"
              value={RPE_PROGRESSION_OPTIONS.find((o) => o.value === progression.rpeProgression)?.label ?? "None"}
            />
            <SummaryRow
              label="Set Progression"
              value={progression.setProgressionEnabled ? "Add 1 Set Final Week" : "None"}
            />
          </dl>
          <div className="mt-4 rounded-2xl border border-lime-300/40 bg-lime-300/10 p-4 text-sm text-zinc-600 dark:text-zinc-300">
            After creating, your program starts in <span className="font-semibold">Collecting Baseline Week</span>.
            Log one workout per split type and we'll generate the remaining weeks automatically.
          </div>
        </StepContainer>
      )}
    </Modal>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((value) => (
        <div
          key={value}
          className={cn(
            "h-1.5 flex-1 rounded-full transition",
            value <= step ? "bg-lime-400" : "bg-zinc-200 dark:bg-white/10",
          )}
        />
      ))}
    </div>
  );
}

function StepContainer({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-lg font-black tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: number }[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition",
                selected
                  ? "border-lime-400 bg-lime-300/20 text-zinc-950 dark:text-white"
                  : "border-zinc-200 bg-white/70 text-zinc-600 hover:border-lime-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isRest = label === "Rest";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
                "min-h-11 rounded-full border px-3 py-2 text-xs font-medium transition",
        selected
          ? isRest
            ? "border-zinc-400 bg-zinc-200 text-zinc-700 dark:border-white/20 dark:bg-white/15 dark:text-white"
            : "border-lime-400 bg-lime-300/20 text-zinc-950 dark:text-white"
          : "border-zinc-200 bg-white/70 text-zinc-600 hover:border-lime-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
      )}
    >
      {label}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="min-w-0 text-sm font-semibold sm:text-right">
        {label === "Plan Name" ? <Badge tone="lime">{value}</Badge> : value}
      </dd>
    </div>
  );
}
