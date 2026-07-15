import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Plus, RotateCcw, Trash2 } from "lucide-react";
import { newRule, schemaHelp, sectionSource } from "../configuration";
import type { HelpTopic, Option, PolicySource, RegistryItem, Rule } from "../types";
import { HelpButton } from "./help-drawer";
import { SchemaFields } from "./schema-fields";

export function RuleEditor({
    title,
    description,
    category,
    effectiveRules,
    localRules,
    registry,
    options,
    sourceMap,
    onChange,
    onHelp,
}: {
    title: string;
    description: string;
    category: "availability" | "eligibility";
    effectiveRules: Rule[];
    localRules: Rule[];
    registry: Record<string, RegistryItem>;
    options: Record<string, Option[]>;
    sourceMap: Record<string, PolicySource>;
    onChange: (rules: Rule[]) => void;
    onHelp: (topic: HelpTopic) => void;
}) {
    const visibleRules = [
        ...effectiveRules.filter((rule) => categoryFor(registry[rule.handler]) === category),
        ...localRules.filter(
            (rule) =>
                rule.enabled === false &&
                categoryFor(registry[rule.handler]) === category &&
                !effectiveRules.some((effectiveRule) => effectiveRule.key === rule.key),
        ),
    ];
    const overriddenKeys = new Set(localRules.map((rule) => rule.key));
    const existingHandlers = new Set(visibleRules.map((rule) => rule.handler));
    const available = Object.values(registry).filter((item) => categoryFor(item) === category && !existingHandlers.has(item.key));

    const editRule = (rule: Rule, mutate: (value: Rule) => Rule) => {
        const existing = localRules.find((item) => item.key === rule.key);
        const next = mutate(structuredClone(existing ?? rule));
        onChange([...localRules.filter((item) => item.key !== rule.key), next]);
    };

    return (
        <section className="space-y-5">
            <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6 text-pretty">{description}</p>
            </div>

            <div className="space-y-3">
                {visibleRules.map((rule) => {
                    const item = registry[rule.handler];
                    const source = sectionSource(sourceMap, "rules", rule.key);
                    const overridden = overriddenKeys.has(rule.key);
                    const help = schemaHelp(item);

                    return (
                        <article key={rule.key} className="bg-background rounded-2xl border p-4 shadow-sm sm:p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold">{item?.label ?? rule.handler}</h3>
                                        {source && !overridden ? (
                                            <Badge variant="outline" className="font-normal">
                                                Inherited from {source.policy_name ?? `version ${source.version ?? source.version_id}`}
                                            </Badge>
                                        ) : overridden && source ? (
                                            <Badge variant="secondary">Overridden here</Badge>
                                        ) : null}
                                    </div>
                                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6 text-pretty">{help.description}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <HelpButton
                                        onClick={() =>
                                            onHelp({
                                                title: item?.label ?? rule.handler,
                                                whatItDoes: help.what_it_does ?? help.description ?? "Controls this enrollment check.",
                                                impact: help.impact,
                                                example: help.example,
                                                docsAnchor: help.docs_anchor,
                                            })
                                        }
                                    />
                                    <Switch
                                        aria-label={`Enable ${item?.label ?? rule.handler}`}
                                        checked={rule.enabled !== false}
                                        onCheckedChange={(checked) => editRule(rule, (current) => ({ ...current, enabled: checked }))}
                                    />
                                </div>
                            </div>

                            {rule.enabled !== false ? (
                                <SchemaFields
                                    item={item}
                                    value={rule.configuration}
                                    options={options}
                                    onChange={(configuration) => editRule(rule, (current) => ({ ...current, configuration }))}
                                />
                            ) : null}

                            <div className="mt-4 flex justify-end border-t pt-3">
                                {source ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-10"
                                        disabled={!overridden}
                                        onClick={() => onChange(localRules.filter((item) => item.key !== rule.key))}
                                    >
                                        <RotateCcw className="size-4" /> Use inherited value
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive h-10"
                                        onClick={() => onChange(localRules.filter((item) => item.key !== rule.key))}
                                    >
                                        <Trash2 className="size-4" /> Remove check
                                    </Button>
                                )}
                            </div>
                        </article>
                    );
                })}

                {visibleRules.length === 0 ? (
                    <Alert>
                        <AlertTriangle className="size-4" />
                        <AlertTitle>No {category} checks yet</AlertTitle>
                        <AlertDescription>Add a check below. The simulation will show exactly who passes or is blocked.</AlertDescription>
                    </Alert>
                ) : null}
            </div>

            {available.length ? (
                <Select
                    onValueChange={(handler) => onChange([...localRules, newRule(handler, [...effectiveRules, ...localRules], registry[handler])])}
                >
                    <SelectTrigger className="h-11 max-w-sm border-dashed">
                        <Plus className="size-4" />
                        <SelectValue placeholder={`Add ${category === "availability" ? "an availability" : "an eligibility"} check`} />
                    </SelectTrigger>
                    <SelectContent>
                        {available.map((item) => (
                            <SelectItem key={item.key} value={item.key}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : null}
        </section>
    );
}

function categoryFor(item?: RegistryItem): "availability" | "eligibility" {
    return item?.category === "availability" ? "availability" : "eligibility";
}
