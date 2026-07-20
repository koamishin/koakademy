import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Ellipsis, LucideIcon } from "lucide-react";
import { useState } from "react";

export interface ClassroomTab {
    value: string;
    label: string;
    icon: LucideIcon;
    description?: string;
    disabled?: boolean;
}

interface ClassroomNavigationProps {
    activeTab: string;
    onTabChange: (value: string) => void;
    tabs: ClassroomTab[];
}

export function ClassroomNavigation({ activeTab, onTabChange, tabs }: ClassroomNavigationProps) {
    const [moreOpen, setMoreOpen] = useState(false);
    const primaryTabs = tabs.filter((tab) => ["stream", "classwork"].includes(tab.value));
    const secondaryTabs = tabs.filter((tab) => !["stream", "classwork"].includes(tab.value));
    const secondaryActive = secondaryTabs.some((tab) => tab.value === activeTab);

    const selectSecondaryTab = (value: string) => {
        onTabChange(value);
        setMoreOpen(false);
    };

    return (
        <div className="border-border/70 bg-background/95 sticky top-0 z-30 -mx-3 border-b px-3 py-2 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
            <TabsList className="bg-muted/40 hidden h-11 w-full justify-start rounded-lg p-1 md:flex">
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className="h-9 gap-2 px-4">
                        <tab.icon className="size-4" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            <div className="grid grid-cols-3 gap-1 md:hidden">
                {primaryTabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-11 gap-2 rounded-md"
                    >
                        <tab.icon className="size-4" />
                        {tab.label}
                    </TabsTrigger>
                ))}
                <Button
                    type="button"
                    variant="ghost"
                    className={cn("h-11 gap-2 rounded-md", secondaryActive && "bg-primary/10 text-primary")}
                    onClick={() => setMoreOpen(true)}
                    aria-label="Open more class sections"
                >
                    <Ellipsis className="size-4" />
                    More
                </Button>
            </div>

            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent side="bottom" className="max-h-[75dvh] rounded-t-lg p-0">
                    <SheetHeader className="border-border border-b px-5 py-4 text-left">
                        <SheetTitle>Class sections</SheetTitle>
                        <SheetDescription>Open attendance, people, and grading tools.</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-2 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                        {secondaryTabs.map((tab) => (
                            <Button
                                key={tab.value}
                                type="button"
                                variant={activeTab === tab.value ? "secondary" : "ghost"}
                                className="h-auto min-h-14 justify-start gap-3 px-4 py-3 text-left"
                                disabled={tab.disabled}
                                onClick={() => selectSecondaryTab(tab.value)}
                            >
                                <tab.icon className="size-5 shrink-0" />
                                <span className="min-w-0">
                                    <span className="block font-medium">{tab.label}</span>
                                    {tab.description && <span className="text-muted-foreground block text-xs font-normal">{tab.description}</span>}
                                </span>
                            </Button>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
