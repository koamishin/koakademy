import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, CircleDashed, Save } from "lucide-react";
import type { ReactNode } from "react";
import { blueprintSteps } from "../configuration";
import type { BlueprintStepId } from "../types";

export function BlueprintShell({
    currentStep,
    completedSteps,
    dirty,
    saving,
    canUpdate,
    onStepChange,
    onSave,
    children,
}: {
    currentStep: BlueprintStepId;
    completedSteps: BlueprintStepId[];
    dirty: boolean;
    saving: boolean;
    canUpdate: boolean;
    onStepChange: (step: BlueprintStepId) => void;
    onSave: (continueToNext?: boolean) => void;
    children: ReactNode;
}) {
    const currentIndex = blueprintSteps.findIndex((step) => step.id === currentStep);
    const progress = Math.round((completedSteps.length / blueprintSteps.length) * 100);
    const previous = blueprintSteps[currentIndex - 1];
    const next = blueprintSteps[currentIndex + 1];

    return (
        <section className="bg-card overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_10px_34px_-18px_rgba(0,0,0,0.32)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="grid min-h-[720px] xl:grid-cols-[16rem_minmax(0,1fr)]">
                <aside className="bg-muted/35 border-b p-4 xl:border-r xl:border-b-0 xl:p-5">
                    <div className="mb-5 space-y-2">
                        <div className="flex items-center justify-between gap-3 text-xs font-medium">
                            <span className="text-muted-foreground">Blueprint progress</span>
                            <span className="tabular-nums">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </div>

                    <nav
                        aria-label="Enrollment policy setup"
                        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 xl:block xl:space-y-1 xl:overflow-visible xl:pb-0"
                    >
                        {blueprintSteps.map((step, index) => {
                            const current = step.id === currentStep;
                            const complete = completedSteps.includes(step.id);
                            return (
                                <button
                                    type="button"
                                    key={step.id}
                                    onClick={() => onStepChange(step.id)}
                                    aria-current={current ? "step" : undefined}
                                    className={cn(
                                        "group flex min-h-11 min-w-[13rem] items-start gap-3 rounded-xl px-3 py-3 text-left transition-[background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] motion-reduce:transition-none xl:w-full xl:min-w-0",
                                        current
                                            ? "bg-background text-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_4px_12px_-8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                                            : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                                            current && "bg-primary text-primary-foreground",
                                            !current && complete && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
                                            !current && !complete && "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {complete ? <Check className="size-3.5" /> : index + 1}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold">{step.shortTitle}</span>
                                        <span className="mt-0.5 hidden text-xs leading-5 text-pretty xl:block">{step.description}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <div className="flex min-w-0 flex-col">
                    <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>

                    <footer className="bg-card/95 sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 backdrop-blur sm:px-6">
                        <div className="flex items-center gap-2">
                            {previous ? (
                                <Button type="button" variant="outline" className="h-11" onClick={() => onStepChange(previous.id)}>
                                    <ChevronLeft className="size-4" /> Back
                                </Button>
                            ) : null}
                            <Badge variant={dirty ? "secondary" : "outline"} className="hidden h-8 sm:inline-flex">
                                {dirty ? <CircleDashed className="mr-1 size-3.5" /> : <Check className="mr-1 size-3.5" />}
                                {dirty ? "Unsaved changes" : "Draft saved"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                disabled={!canUpdate || saving || !dirty}
                                onClick={() => onSave(false)}
                            >
                                <Save className="size-4" /> {saving ? "Saving…" : "Save draft"}
                            </Button>
                            {next ? (
                                <Button type="button" className="h-11 pr-3.5 pl-4" disabled={!canUpdate || saving} onClick={() => onSave(true)}>
                                    Save and continue <ChevronRight className="size-4" />
                                </Button>
                            ) : null}
                        </div>
                    </footer>
                </div>
            </div>
        </section>
    );
}
