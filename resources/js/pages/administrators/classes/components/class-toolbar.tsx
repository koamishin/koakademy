import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Search } from "lucide-react";

type ViewMode = "grid" | "list";

interface ClassToolbarProps {
    search: string;
    onSearchChange: (search: string) => void;
    isSearchLoading: boolean;
    classification: string;
    onClassificationChange: (classification: string) => void;
    viewMode: ViewMode;
    onViewModeChange: (viewMode: ViewMode) => void;
}

export function ClassToolbar({
    search,
    onSearchChange,
    isSearchLoading,
    classification,
    onClassificationChange,
    viewMode,
    onViewModeChange,
}: ClassToolbarProps) {
    return (
        <div className="bg-card flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                    placeholder="Search classes..."
                    className="h-9 pl-8"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
                {isSearchLoading ? <span className="text-muted-foreground absolute top-2.5 right-2.5 text-xs">Searching?</span> : null}
            </div>

            <div className="flex items-center gap-2">
                <Tabs value={classification} onValueChange={onClassificationChange} className="w-auto">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="college">College</TabsTrigger>
                        <TabsTrigger value="shs">SHS</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="bg-border mx-1 h-6 w-px" />

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
