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
import { Plus } from "lucide-react"
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
  options?: readonly string[]
  endpoint?: string
  "aria-invalid"?: boolean
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
  options,
  endpoint,
  "aria-invalid": ariaInvalid,
}: AutocompleteFieldInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(value)
  const [debouncedSearch] = useDebounce(search, debounceMs)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setSearch(value)
  }, [value])

  useEffect(() => {
    if (disabled) {
      setSuggestions([])
      return
    }

    if (options) {
      const query = debouncedSearch.trim().toLocaleLowerCase()
      const filtered = options
        .filter((option) =>
          query === "" ? true : option.toLocaleLowerCase().includes(query),
        )
        .filter(
          (option, index, items) =>
            items.findIndex(
              (item) =>
                item.toLocaleLowerCase() === option.toLocaleLowerCase(),
            ) === index,
        )
        .slice(0, 25)

      setSuggestions(filtered)
      setLoading(false)
      return
    }

    if (debouncedSearch.trim().length < 1) {
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
          endpoint ??
            route("administrators.students.field-values", {
              field: fieldName,
              search: debouncedSearch,
            }),
          {
            params: endpoint
              ? { field: fieldName, search: debouncedSearch }
              : undefined,
            signal: controller.signal,
          },
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
  }, [debouncedSearch, disabled, endpoint, fieldName, options])

  return (
    <div className={className}>
      <Autocomplete
        items={suggestions}
        itemToStringValue={(item) => String(item)}
        value={search}
        onValueChange={(next: string, _details) => {
          if (next === OTHER_VALUE) {
            const customValue = search.trim()
            setSearch(customValue)
            onChange(customValue)
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
          showTrigger
          disabled={disabled}
          aria-invalid={ariaInvalid}
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
