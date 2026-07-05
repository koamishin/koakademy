import {
    Command,
    CommandEmpty,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

declare const route: (
    name: string,
    params?: Record<string, unknown>,
) => string;

export interface SchoolOption {
    name: string;
    address: string | null;
}

interface SchoolAutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    fieldName: string;
    onSelectOption?: (option: SchoolOption) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
    debounceMs?: number;
}

export function SchoolAutocompleteInput({
    value,
    onChange,
    fieldName,
    onSelectOption,
    placeholder,
    disabled = false,
    className,
    id,
    debounceMs = 300,
}: SchoolAutocompleteInputProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [debouncedValue] = useDebounce(inputValue, debounceMs);
    const [options, setOptions] = useState<SchoolOption[]>([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        if (disabled || debouncedValue.length < 1) {
            setOptions([]);
            setOpen(false);

            return;
        }

        const controller = new AbortController();

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = controller;

        const fetchOptions = async () => {
            setLoading(true);

            try {
                const response = await axios.get(
                    route("administrators.students.education-school-options", {
                        field: fieldName,
                        search: debouncedValue,
                    }),
                    { signal: controller.signal },
                );

                const items: SchoolOption[] = Array.isArray(response.data)
                    ? response.data
                    : (response.data.options ?? response.data.data ?? []);

                setOptions(items);

                if (items.length > 0) {
                    setOpen(true);
                }
            } catch (error: unknown) {
                const isCancelled =
                    error instanceof Error &&
                    (error.name === "CanceledError" ||
                        (error as { code?: string }).code === "ERR_CANCELED");

                if (!isCancelled) {
                    setOptions([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();

        return () => {
            controller.abort();
        };
    }, [debouncedValue, disabled, fieldName]);

    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }
        };
    }, []);

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value;
            setInputValue(nextValue);
            onChange(nextValue);
        },
        [onChange],
    );

    const handleSelect = useCallback(
        (option: SchoolOption) => {
            setInputValue(option.name);
            onChange(option.name);
            onSelectOption?.(option);
            setOpen(false);
        },
        [onChange, onSelectOption],
    );

    const handleFocus = useCallback(() => {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }

        if (!disabled && inputValue.length >= 1 && options.length > 0) {
            setOpen(true);
        }
    }, [disabled, inputValue, options]);

    const handleBlur = useCallback(() => {
        blurTimeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, 200);
    }, []);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Input
                    id={id}
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-autocomplete="list"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(className)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoComplete="off"
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => event.preventDefault()}
            >
                <Command shouldFilter={false}>
                    <CommandList>
                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching schools...
                            </div>
                        )}
                        {!loading && options.length === 0 && (
                            <CommandEmpty>No schools found.</CommandEmpty>
                        )}
                        {!loading &&
                            options.map((option) => (
                                <CommandItem
                                    key={`${option.name}-${option.address ?? ""}`}
                                    value={option.name}
                                    onSelect={() => handleSelect(option)}
                                    className="cursor-pointer"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">
                                            {option.name}
                                        </div>
                                        {option.address && (
                                            <div className="truncate text-xs text-muted-foreground">
                                                {option.address}
                                            </div>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
