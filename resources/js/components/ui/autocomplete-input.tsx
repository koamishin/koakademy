import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
    fieldName: string;
    debounceMs?: number;
}

export function AutocompleteInput({
    value,
    onChange,
    placeholder,
    disabled = false,
    className,
    id,
    fieldName,
    debounceMs = 300,
}: AutocompleteInputProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [debouncedValue] = useDebounce(inputValue, debounceMs);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync external value changes (e.g. form reset)
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Fetch suggestions when debounced value changes
    useEffect(() => {
        if (disabled || debouncedValue.length < 1) {
            setSuggestions([]);
            setOpen(false);

            return;
        }

        const controller = new AbortController();

        // Abort any in-flight request before starting a new one
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = controller;

        const fetchSuggestions = async () => {
            setLoading(true);

            try {
                const response = await axios.get(
                    route("administrators.students.field-values", {
                        field: fieldName,
                        search: debouncedValue,
                    }),
                    { signal: controller.signal },
                );

                const data = response.data;
                const items: string[] = Array.isArray(data)
                    ? data
                    : (data.values ?? data.data ?? []);

                setSuggestions(items);

                if (items.length > 0) {
                    setOpen(true);
                }
            } catch (error: unknown) {
                const isCancelled =
                    error instanceof Error &&
                    (error.name === "CanceledError" ||
                        (error as { code?: string }).code === "ERR_CANCELED");

                if (!isCancelled) {
                    setSuggestions([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();

        return () => {
            controller.abort();
        };
    }, [debouncedValue, fieldName, disabled]);

    // Clean up blur timeout on unmount
    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }
        };
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            onChange(newValue);
        },
        [onChange],
    );

    const handleSelect = useCallback(
        (suggestion: string) => {
            setInputValue(suggestion);
            onChange(suggestion);
            setOpen(false);
        },
        [onChange],
    );

    const handleFocus = useCallback(() => {
        // If the input was blurred and a close timeout is pending, cancel it
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }

        if (!disabled && inputValue.length >= 1 && suggestions.length > 0) {
            setOpen(true);
        }
    }, [disabled, inputValue, suggestions]);

    const handleBlur = useCallback(() => {
        // Delay closing so clicks on suggestion items can register
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
                    aria-controls={
                        open ? "autocomplete-listbox" : undefined
                    }
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={className}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoComplete="off"
                />
            </PopoverTrigger>
            <PopoverContent
                id="autocomplete-listbox"
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <Command shouldFilter={false}>
                    <CommandList>
                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching...
                            </div>
                        )}
                        {!loading && suggestions.length === 0 && (
                            <CommandEmpty>No results found.</CommandEmpty>
                        )}
                        {!loading &&
                            suggestions.map((suggestion) => (
                                <CommandItem
                                    key={suggestion}
                                    value={suggestion}
                                    onSelect={() =>
                                        handleSelect(suggestion)
                                    }
                                    className="cursor-pointer"
                                >
                                    {suggestion}
                                </CommandItem>
                            ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
