import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface ActiveFilterBadge {
    key: string;
    label: string;
    onClear: () => void;
}

interface ClassActiveFiltersProps {
    activeFilterBadges: ActiveFilterBadge[];
    onClearAll: () => void;
}

export function ClassActiveFilters({ activeFilterBadges, onClearAll }: ClassActiveFiltersProps) {
    if (activeFilterBadges.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Active filters:</span>
            {activeFilterBadges.map((badge) => (
                <Badge key={badge.key} variant="secondary" className="flex items-center gap-1">
                    <span>{badge.label}</span>
                    <button
                        type="button"
                        className="hover:bg-muted ml-1 inline-flex items-center rounded-sm p-0.5"
                        onClick={badge.onClear}
                        aria-label={"Remove " + badge.label}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}

            <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
                Clear all
            </Button>
        </div>
    );
}
