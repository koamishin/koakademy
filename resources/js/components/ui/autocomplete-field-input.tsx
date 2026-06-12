"use client"

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/reui/autocomplete"
import axios from "axios"
import { Check, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useDebounce } from "use-debounce"

declare const route: (name: string, params?: Record<string, unknown>) => string

const OTHER_VALUE = "__other__"

interface AutocompleteFieldInputProps {
  value: string
  onChange: (value: string) => void
  fieldName: string
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  debounceMs?: number
  showOther?: boolean
}

export function AutocompleteFieldInput({
  value,
  onChange,
  fieldName,
  placeholder,
  disabled = false,
  className,
  id,
  debounceMs = 300,
  showOther = true,
}: AutocompleteFieldInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(value)
  const [debouncedSearch] = useDebounce(search, debounceMs)
  const abortControllerRef = useRef<AbortController | null>(null)

  const isOtherMode = value === OTHER_VALUE

  useEffect(() => {
    if (!isOtherMode) {
      setSearch(value)
    }
  }, [value, isOtherMode])

  useEffect(() => {
    if (isOtherMode) return
    if (disabled || debouncedSearch.trim().length < 1) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = controller

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const response = await axios.get(
          route("administrators.students.field-values", {
            field: fieldName,
            search: debouncedSearch,
          }),
          { signal: controller.signal },
        )

        const data = response.data
        const items: string[] = Array.isArray(data)
          ? data
          : (data.values ?? data.data ?? [])

        setSuggestions(items)
      } catch (error: unknown) {
        const isCancelled =
          error instanceof Error &&
          (error.name === "CanceledError" ||
            (error as { code?: string }).code === "ERR_CANCELED")
        if (!isCancelled) {
          setSuggestions([])
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchSuggestions()

    return () => {
      controller.abort()
    }
  }, [debouncedSearch, fieldName, disabled, isOtherMode])

  if (isOtherMode) {
    return (
      <div className={className}>
        <div className="flex gap-2">
          <input
            id={id}
            type="text"
            value=""
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder ?? "Type your custom value"}
            disabled={disabled}
            className="border-input bg-transparent ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-8 w-full rounded-lg border px-2.5 py-2 text-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => {
              onChange("")
              setSearch("")
            }}
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 rounded-md border px-2 text-xs"
          >
            <Check className="size-3.5" />
            Pick from list
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Autocomplete
        items={suggestions}
        itemToStringValue={(item) => String(item)}
        value={search}
        onValueChange={(next: string, _details) => {
          if (next === OTHER_VALUE) {
            onChange(OTHER_VALUE)
            return
          }
          setSearch(next)
          onChange(next)
        }}
      >
        <AutocompleteInput
          id={id}
          placeholder={placeholder ?? "Type to search or pick a suggestion"}
          showClear
          disabled={disabled}
        />
        <AutocompleteContent>
          <AutocompleteList>
            {(item: string) => (
              <AutocompleteItem key={item} value={item}>
                {item}
              </AutocompleteItem>
            )}
          </AutocompleteList>
          {showOther && !loading && search.trim().length > 0 && (
            <AutocompleteItem value={OTHER_VALUE} className="m-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Plus className="size-3.5" />
                Use &quot;{search.trim()}&quot; as custom value
              </span>
            </AutocompleteItem>
          )}
          <AutocompleteEmpty>
            {loading ? "Searching..." : "No matches. Type a custom value above."}
          </AutocompleteEmpty>
        </AutocompleteContent>
      </Autocomplete>
    </div>
  )
}
