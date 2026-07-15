import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Sparkles } from "lucide-react";
import { fieldIsVisible } from "../configuration";
import type { JsonObject, OperatorField, Option, RegistryItem } from "../types";

export function OptionSelect({
    value,
    onChange,
    options = [],
    placeholder,
    allowEmpty = true,
}: {
    value: string;
    onChange: (value: string) => void;
    options?: Option[];
    placeholder: string;
    allowEmpty?: boolean;
}) {
    const emptyValue = "__all__";

    return (
        <Select value={value || emptyValue} onValueChange={(selected) => onChange(selected === emptyValue ? "" : selected)}>
            <SelectTrigger className="min-h-11 w-full" aria-label={placeholder}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {allowEmpty ? <SelectItem value={emptyValue}>{placeholder}</SelectItem> : null}
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function SchemaFields({
    item,
    value,
    options,
    onChange,
}: {
    item?: RegistryItem;
    value: JsonObject;
    options: Record<string, Option[]>;
    onChange: (value: JsonObject) => void;
}) {
    if (!item?.operator_configurable) {
        return (
            <Alert className="mt-4 border-amber-500/30 bg-amber-500/5">
                <AlertTriangle className="size-4" />
                <AlertTitle>Configured by an extension</AlertTitle>
                <AlertDescription>
                    This behavior still works, but its extension does not provide a visual form. Import and export remain available under Advanced.
                </AlertDescription>
            </Alert>
        );
    }

    const fields = (item.operator_schema?.fields ?? []).filter((field) => fieldIsVisible(field, value));

    if (fields.length === 0) {
        return <p className="text-muted-foreground mt-3 text-sm">This option has no additional settings.</p>;
    }

    return (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
                <SchemaField
                    key={field.key}
                    field={field}
                    value={value[field.key]}
                    options={options}
                    onChange={(fieldValue) => onChange({ ...value, [field.key]: fieldValue })}
                />
            ))}
        </div>
    );
}

function SchemaField({
    field,
    value,
    options,
    onChange,
}: {
    field: OperatorField;
    value: unknown;
    options: Record<string, Option[]>;
    onChange: (value: unknown) => void;
}) {
    const choices = field.options ?? options[field.option_source ?? ""] ?? [];
    const fieldId = `enrollment-policy-${field.key}`;
    const descriptionId = `${fieldId}-description`;

    if (field.control === "boolean") {
        return (
            <div className="bg-muted/20 flex min-h-20 items-start justify-between gap-4 rounded-xl border p-4 md:col-span-2">
                <div>
                    <Label htmlFor={fieldId} className="text-sm font-semibold">
                        {field.label}
                    </Label>
                    <FieldGuidance field={field} />
                </div>
                <Switch id={fieldId} checked={value === true} onCheckedChange={onChange} aria-describedby={descriptionId} />
            </div>
        );
    }

    return (
        <div className={field.control === "date_range" ? "space-y-2 md:col-span-2" : "space-y-2"}>
            <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor={fieldId}>{field.label}</Label>
                {field.required ? <span className="text-destructive text-xs font-medium">Required</span> : null}
                {field.recommended !== undefined && field.recommended !== null ? (
                    <span className="bg-primary/8 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
                        <Sparkles className="size-3" /> Recommended: {String(field.recommended)}
                    </span>
                ) : null}
            </div>

            {field.control === "multi_select" ? (
                <MultiSelect
                    options={choices}
                    selected={Array.isArray(value) ? value.map(String) : []}
                    onChange={onChange}
                    placeholder={field.placeholder ?? `Choose ${field.label.toLowerCase()}`}
                />
            ) : null}

            {["select", "role", "permission", "school", "program", "period", "notification_channel"].includes(field.control) ? (
                <OptionSelect
                    value={String(value ?? "")}
                    onChange={onChange}
                    options={choices}
                    placeholder={field.placeholder ?? `Choose ${field.label.toLowerCase()}`}
                    allowEmpty={!field.required}
                />
            ) : null}

            {field.control === "date_range" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor={`${fieldId}-start`} className="text-muted-foreground text-xs">
                            Opens
                        </Label>
                        <Input
                            id={`${fieldId}-start`}
                            type="date"
                            className="h-11"
                            value={String((value as { starts_at?: string } | undefined)?.starts_at ?? "")}
                            onChange={(event) => onChange({ ...(typeof value === "object" ? value : {}), starts_at: event.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`${fieldId}-end`} className="text-muted-foreground text-xs">
                            Closes
                        </Label>
                        <Input
                            id={`${fieldId}-end`}
                            type="date"
                            className="h-11"
                            value={String((value as { ends_at?: string } | undefined)?.ends_at ?? "")}
                            onChange={(event) => onChange({ ...(typeof value === "object" ? value : {}), ends_at: event.target.value })}
                        />
                    </div>
                </div>
            ) : null}

            {["number", "money", "percentage"].includes(field.control) ? (
                <InputGroup className="min-h-11">
                    {field.prefix ? <InputGroupAddon>{field.prefix}</InputGroupAddon> : null}
                    <InputGroupInput
                        id={fieldId}
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step ?? (field.control === "money" ? 0.01 : 1)}
                        value={String(value ?? "")}
                        placeholder={field.placeholder}
                        onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
                        aria-describedby={descriptionId}
                    />
                    {field.suffix ? <InputGroupAddon align="inline-end">{field.suffix}</InputGroupAddon> : null}
                </InputGroup>
            ) : null}

            {["text", "date"].includes(field.control) ? (
                <Input
                    id={fieldId}
                    type={field.control === "date" ? "date" : "text"}
                    className="h-11"
                    value={String(value ?? "")}
                    placeholder={field.placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    aria-describedby={descriptionId}
                />
            ) : null}

            <FieldGuidance field={field} id={descriptionId} />
        </div>
    );
}

function FieldGuidance({ field, id }: { field: OperatorField; id?: string }) {
    if (!field.description && field.example === undefined) {
        return null;
    }

    return (
        <p id={id} className="text-muted-foreground mt-1 text-xs leading-5 text-pretty">
            {field.description}
            {field.example !== undefined && field.example !== null ? ` Example: ${String(field.example)}.` : ""}
        </p>
    );
}
