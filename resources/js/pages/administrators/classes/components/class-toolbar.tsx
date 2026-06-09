import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LayoutGrid, List, Search } from "lucide-react";
import type { ReactNode } from "react";

type ViewMode = "grid" | "list";

interface ClassToolbarProps {
    search: string;
    onSearchChange: (search: string) => void;
    sortOption: string;
    onSortChange: (value: string) => void;
    activeFiltersCount: number;
    filterControl: ReactNode;
    resetControl: ReactNode;
    viewMode: ViewMode;
    onViewModeChange: (viewMode: ViewMode) => void;
}

export function ClassToolbar({
    search,
    onSearchChange,
    sortOption,
    onSortChange,
    activeFiltersCount,
    filterControl,
    resetControl,
    viewMode,
    onViewModeChange,
}: ClassToolbarProps) {
    return (
        <div className="bg-card flex flex-col justify-between gap-4 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                    placeholder="Search classes..."
                    className="bg-background pl-8"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Select value={sortOption} onValueChange={onSortChange}>
                    <SelectTrigger className="h-8 w-[180px]">
                        <SelectValue placeholder="Sort classes" />
                    </SelectTrigger>
                    <SelectContent align="end">
                        <SelectItem value="created_at:desc">Latest added</SelectItem>
                        <SelectItem value="created_at:asc">Oldest added</SelectItem>
                        <SelectItem value="record_title:asc">Class A-Z</SelectItem>
                        <SelectItem value="record_title:desc">Class Z-A</SelectItem>
                        <SelectItem value="students_count:desc">Most enrolled</SelectItem>
                        <SelectItem value="students_count:asc">Least enrolled</SelectItem>
                    </SelectContent>
                </Select>

                {filterControl}

                {(activeFiltersCount > 0 || resetControl) && resetControl}

                <Separator orientation="vertical" className="mx-1 h-8" />

                <div className="flex items-center rounded-md border p-0.5">
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onViewModeChange("grid")}
                        title="Grid view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onViewModeChange("list")}
                        title="List view"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
