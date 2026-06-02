import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import type { ReactNode } from "react";

export type WizardValidationResult = boolean | string;

export type WizardStep = {
    id: string;
    title: string;
    description?: string;
    isComplete: () => WizardValidationResult;
    isValid?: () => WizardValidationResult;
};

export type WizardLabels = {
    back: string;
    next: string;
    complete: string;
    saveDraft?: string;
    stepLabel: (stepNumber: number) => string;
};

type WizardProps = {
    steps: WizardStep[];
    currentStep: number;
    onStepChange: (next: number) => void;
    onComplete?: () => void;
    onSaveDraft?: () => void;
    labels: WizardLabels;
    children: ReactNode;
    className?: string;
    isProcessing?: boolean;
};

function resultIsValid(result: WizardValidationResult): boolean {
    return result === true;
}

function resultMessage(result: WizardValidationResult): string | null {
    if (typeof result === "string" && result.trim() !== "") {
        return result;
    }

    return null;
}

export function Wizard({
    steps,
    currentStep,
    onStepChange,
    onComplete,
    onSaveDraft,
    labels,
    children,
    className,
    isProcessing = false,
}: WizardProps): ReactNode {
    const activeStep = steps[currentStep];
    const validationResult = activeStep?.isValid?.() ?? true;
    const canContinue = resultIsValid(validationResult);
    const validationMessage = resultMessage(validationResult);
    const isLastStep = currentStep >= steps.length - 1;

    const handleNext = (): void => {
        if (!canContinue || isProcessing) {
            return;
        }

        if (isLastStep) {
            onComplete?.();
            return;
        }

        onStepChange(currentStep + 1);
    };

    return (
        <TooltipProvider>
            <section className={cn("flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl", className)}>
                <div className="border-b bg-background/60 px-4 py-5 backdrop-blur sm:px-6">
                    <ol className="grid gap-3 md:grid-cols-[repeat(var(--wizard-steps),minmax(0,1fr))]" style={{ "--wizard-steps": steps.length } as React.CSSProperties}>
                        {steps.map((step, index) => {
                            const complete = resultIsValid(step.isComplete());
                            const current = index === currentStep;
                            const clickable = index <= currentStep || complete;

                            return (
                                <li key={step.id}>
                                    <button
                                        type="button"
                                        onClick={() => clickable && onStepChange(index)}
                                        disabled={!clickable}
                                        className={cn(
                                            "group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                                            current && "border-primary bg-primary/8 shadow-sm ring-1 ring-primary/15",
                                            !current && complete && "border-primary/30 bg-primary/5",
                                            !current && !complete && "border-border bg-card/70",
                                            clickable ? "hover:border-primary/50 hover:bg-accent/50" : "cursor-not-allowed opacity-60",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                                                current && "border-primary bg-primary text-primary-foreground",
                                                !current && complete && "border-primary bg-primary/10 text-primary",
                                                !current && !complete && "border-border bg-muted text-muted-foreground",
                                            )}
                                            aria-label={labels.stepLabel(index + 1)}
                                        >
                                            {complete && !current ? <Check className="size-4" /> : index + 1}
                                        </span>
                                        <span className="min-w-0 space-y-1">
                                            <span className={cn("block text-sm font-semibold", current ? "text-foreground" : "text-muted-foreground")}>{step.title}</span>
                                            {step.description ? <span className="block text-xs leading-5 text-muted-foreground">{step.description}</span> : null}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                <div className="flex-1 bg-background/35 p-4 sm:p-6">{children}</div>

                <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t bg-card/95 px-4 py-4 backdrop-blur sm:px-6">
                    <div>
                        {currentStep > 0 ? (
                            <Button type="button" variant="outline" onClick={() => onStepChange(currentStep - 1)} disabled={isProcessing}>
                                <ChevronLeft className="size-4" />
                                {labels.back}
                            </Button>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                        {onSaveDraft && labels.saveDraft ? (
                            <Button type="button" variant="outline" onClick={onSaveDraft} disabled={isProcessing}>
                                <Save className="size-4" />
                                {labels.saveDraft}
                            </Button>
                        ) : null}

                        <Tooltip open={!canContinue && validationMessage ? undefined : false}>
                            <TooltipTrigger asChild>
                                <span className="inline-flex">
                                    <Button type="button" onClick={handleNext} disabled={!canContinue || isProcessing}>
                                        {isProcessing ? <Loader2 className="size-4 animate-spin" /> : null}
                                        {isLastStep ? labels.complete : labels.next}
                                        {!isLastStep ? <ChevronRight className="size-4" /> : null}
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            {validationMessage ? <TooltipContent>{validationMessage}</TooltipContent> : null}
                        </Tooltip>
                    </div>
                </div>
            </section>
        </TooltipProvider>
    );
}
