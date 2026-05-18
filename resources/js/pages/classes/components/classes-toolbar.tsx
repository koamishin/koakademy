import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconAdjustmentsHorizontal, IconGridDots, IconListDetails, IconSchool, IconSearch } from "@tabler/icons-react";
import { DAYS } from "../hooks/use-class-schedule";

interface ClassesToolbarProps {
    viewMode: "board" | "gallery" | "list";
    setViewMode: (mode: "board" | "gallery" | "list") => void;
    search: string;
    setSearch: (val: string) => void;
    filterClassification: string;
    setFilterClassification: (val: string) => void;
    filterRoom: string;
    setFilterRoom: (val: string) => void;
    filterDay: string;
    setFilterDay: (val: string) => void;
    rooms: { id: number; name: string }[];
    resetFilters: () => void;
    hasActiveFilters: boolean;
}

export function ClassesToolbar({
    viewMode,
    setViewMode,
    search,
    setSearch,
    filterClassification,
    setFilterClassification,
    filterRoom,
    setFilterRoom,
    filterDay,
    setFilterDay,
    rooms,
    resetFilters,
    hasActiveFilters,
}: ClassesToolbarProps) {
    const activeFilterCount = [filterClassification !== "all", filterRoom !== "all", filterDay !== "all"].filter(Boolean).length;

    return (
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-border/40 bg-card/40 p-1.5 shadow-sm backdrop-blur-sm sm:flex-row">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
                <IconSearch className="text-muted-foreground/60 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                    placeholder="Search classes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="placeholder:text-muted-foreground/50 h-9 border-0 bg-transparent pl-10 text-sm focus-visible:ring-0"
                />
            </div>

            <div className="flex w-full items-center gap-2 px-1 sm:w-auto">
                {/* Filters Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={hasActiveFilters ? "secondary" : "ghost"} size="sm" className="h-8.5 gap-2 rounded-lg border border-transparent px-3 text-xs font-medium transition-all hover:bg-muted/60">
                            <IconAdjustmentsHorizontal className="h-4 w-4" />
                            <span>Filters</span>
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary ml-0.5 h-5 px-1.5 text-[10px] font-bold">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 rounded-xl p-4 shadow-xl" align="end">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold tracking-tight">Filter Classes</h4>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetFilters}
                                        className="text-primary hover:text-primary/80 h-auto p-0 px-2 text-[11px] font-bold uppercase tracking-wider"
                                    >
                                        Reset all
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Classification</Label>
                                    <Select value={filterClassification} onValueChange={setFilterClassification}>
                                        <SelectTrigger className="h-9 rounded-lg">
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">All types</SelectItem>
                                            <SelectItem value="shs">Senior High</SelectItem>
                                            <SelectItem value="college">College</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Room</Label>
                                    <Select value={filterRoom} onValueChange={setFilterRoom}>
                                        <SelectTrigger className="h-9 rounded-lg">
                                            <SelectValue placeholder="All rooms" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">Everywhere</SelectItem>
                                            {rooms.map((room) => (
                                                <SelectItem key={room.id} value={String(room.id)}>
                                                    {room.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Day</Label>
                                    <Select value={filterDay} onValueChange={setFilterDay}>
                                        <SelectTrigger className="h-9 rounded-lg">
                                            <SelectValue placeholder="All days" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">Any day</SelectItem>
                                            {DAYS.map((day) => (
                                                <SelectItem key={day} value={day}>
                                                    {day}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="Sunday">Sunday</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="bg-border/60 mx-1 hidden h-4 w-px sm:block" />

                {/* View Switcher */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                    <TabsList className="bg-muted/40 h-8.5 rounded-lg p-1">
                        <TabsTrigger value="board" className="data-[state=active]:bg-background h-6.5 rounded-md px-3 text-[11px] font-medium data-[state=active]:shadow-sm">
                            <IconGridDots className="mr-1.5 h-3.5 w-3.5" />
                            Board
                        </TabsTrigger>
                        <TabsTrigger value="gallery" className="data-[state=active]:bg-background h-6.5 rounded-md px-3 text-[11px] font-medium data-[state=active]:shadow-sm">
                            <IconSchool className="mr-1.5 h-3.5 w-3.5" />
                            Cards
                        </TabsTrigger>
                        <TabsTrigger value="list" className="data-[state=active]:bg-background h-6.5 rounded-md px-3 text-[11px] font-medium data-[state=active]:shadow-sm">
                            <IconListDetails className="mr-1.5 h-3.5 w-3.5" />
                            List
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </div>
    );
}
