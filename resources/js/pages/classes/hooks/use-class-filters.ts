import { ClassData } from "@/components/data-table";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { isValidDay, ScheduleEvent } from "./use-class-schedule";

function useLocalStorageState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }

        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) {
                return initialValue;
            }

            return JSON.parse(raw) as T;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // ignore
        }
    }, [key, value]);

    return [value, setValue];
}

export function useClassFilters(
    allClasses: ClassData[],
    events: ScheduleEvent[],
    conflictIds: Set<string>,
    unscheduled: ClassData[],
    storagePrefix = "koakademy.classes",
) {
    const [search, setSearch] = useLocalStorageState<string>(`${storagePrefix}.search`, "");
    const [filterClassification, setFilterClassification] = useLocalStorageState<string>(`${storagePrefix}.filter.classification`, "all");
    const [filterDay, setFilterDay] = useLocalStorageState<string>(`${storagePrefix}.filter.day`, "all");
    const [filterRoom, setFilterRoom] = useLocalStorageState<string>(`${storagePrefix}.filter.room`, "all");
    const [onlyConflicts, setOnlyConflicts] = useLocalStorageState<boolean>(`${storagePrefix}.filter.onlyConflicts`, false);
    const [onlyUnscheduled, setOnlyUnscheduled] = useLocalStorageState<boolean>(`${storagePrefix}.filter.onlyUnscheduled`, false);

    const filteredClasses = useMemo(() => {
        const query = search.trim().toLowerCase();

        return allClasses.filter((classItem) => {
            if (filterClassification !== "all") {
                const classification = String(classItem.classification ?? "").toLowerCase();
                if (classification !== filterClassification) {
                    return false;
                }
            }

            if (filterRoom !== "all") {
                const roomId = classItem.room_id !== undefined && classItem.room_id !== null ? String(classItem.room_id) : "";
                const hasScheduledRoom = (classItem.schedules ?? []).some((schedule) => String(schedule?.room_id ?? "") === filterRoom);
                if (roomId !== filterRoom && !hasScheduledRoom) {
                    return false;
                }
            }

            if (query) {
                const haystack = [
                    classItem.subject_code,
                    classItem.subject_title,
                    classItem.section,
                    classItem.room,
                    classItem.semester,
                    classItem.school_year,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [allClasses, filterClassification, filterRoom, search]);

    const effectiveClasses = useMemo(() => {
        if (onlyUnscheduled) {
            // Filter out those already filtered by SEARCH/CLASS/ROOM if needed, or just return global unscheduled
            // usually users expect search/filter to still apply.
            // For now, let's intersect unscheduled with filteredClasses
            const unscheduledIds = new Set(unscheduled.map((u) => u.id));
            return filteredClasses.filter((c) => unscheduledIds.has(c.id));
        }

        if (onlyConflicts) {
            return filteredClasses.filter((item) => conflictIds.has(String(item.id)));
        }

        if (filterDay !== "all" && isValidDay(filterDay)) {
            const idsForDay = new Set(events.filter((event) => event.day === filterDay).map((event) => String(event.classItem.id)));
            return filteredClasses.filter((item) => idsForDay.has(String(item.id)));
        }

        return filteredClasses;
    }, [conflictIds, events, filterDay, filteredClasses, onlyConflicts, onlyUnscheduled, unscheduled]);

    function resetFilters() {
        setSearch("");
        setFilterClassification("all");
        setFilterDay("all");
        setFilterRoom("all");
        setOnlyConflicts(false);
        setOnlyUnscheduled(false);
    }

    return {
        search,
        setSearch,
        filterClassification,
        setFilterClassification,
        filterDay,
        setFilterDay,
        filterRoom,
        setFilterRoom,
        onlyConflicts,
        setOnlyConflicts,
        onlyUnscheduled,
        setOnlyUnscheduled,
        effectiveClasses,
        resetFilters,
    };
}
