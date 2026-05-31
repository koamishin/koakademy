import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import { CheckCircle2, RefreshCw, Scan, School, User, X, XCircle } from "lucide-react";
import * as React from "react";

interface Branding {
    organizationShortName: string;
}

export interface IdCardData {
    type: "student" | "faculty";
    id: string | number;
    name: string;
    email?: string;
    course?: string;
    department?: string;
    status: string;
    school_year?: string;
    year_level?: number;
}

export interface DigitalIdCardProps {
    cardData: IdCardData;
    photoUrl?: string | null;
    qrCode: string;
    isValid: boolean;
    isCompact?: boolean;
    onRefresh?: () => void;
    onExpand?: () => void;
    isRefreshing?: boolean;
    className?: string;
}

export function DigitalIdCard({
    cardData,
    photoUrl,
    qrCode,
    isValid,
    isCompact = false,
    onRefresh,
    isRefreshing = false,
    className,
}: DigitalIdCardProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    if (isCompact) {
        return (
            <CompactSmartCard
                cardData={cardData}
                photoUrl={photoUrl}
                qrCode={qrCode}
                isValid={isValid}
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                className={className}
                setIsOpen={setIsOpen}
                isOpen={isOpen}
            />
        );
    }

    return (
        <CompactSmartCard
            cardData={cardData}
            photoUrl={photoUrl}
            qrCode={qrCode}
            isValid={isValid}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            className={cn("mx-auto w-full max-w-md transform transition-transform duration-300 hover:scale-[1.01]", className)}
            setIsOpen={setIsOpen}
            isOpen={isOpen}
            isFullSize={true}
        />
    );
}

function CompactSmartCard({ cardData, photoUrl, qrCode, isValid, onRefresh, isRefreshing, className, setIsOpen, isOpen, isFullSize = false }: any) {
    const isStudent = cardData.type === "student";
    const { props } = usePage<{ branding?: Branding }>();
    const orgShortName = props.branding?.organizationShortName || "UNI";

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <div
                        className={cn(
                            "group border-border relative cursor-pointer overflow-hidden rounded-3xl border shadow-sm select-none",
                            "bg-card text-card-foreground", // Strictly using ShadCN theme tokens
                            className,
                        )}
                        onClick={() => setIsOpen(true)}
                    >
                        {/* Subtle Primary Gradient Overlay for Branding */}
                        <div className="from-primary/10 to-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent opacity-50" />

                        {/* Hover Highlight */}
                        <div className="bg-primary/5 pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        {/* Card Content */}
                        <div className="relative flex h-full min-h-[190px] flex-col justify-between p-4 sm:min-h-[220px] sm:p-6">
                            {/* Header: Chip & Organization */}
                            <div className="mb-1 flex items-start justify-between gap-3 sm:mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 border-primary/20 flex h-9 w-9 items-center justify-center rounded-xl border sm:h-10 sm:w-10">
                                        <School className="text-primary h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base leading-none font-bold tracking-tight sm:text-lg">{orgShortName}</span>
                                        <span className="text-muted-foreground mt-0.5 text-[10px] font-medium tracking-widest uppercase">
                                            Official ID
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-primary text-primary-foreground group-hover:bg-primary/90 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-sm transition-colors">
                                    <span className="text-[11px] font-semibold whitespace-nowrap">Tap to Scan</span>
                                    <Scan className="h-3.5 w-3.5" />
                                </div>
                            </div>

                            {/* Middle: Identity Info */}
                            <div className="my-3 flex items-center gap-4 sm:my-4 sm:gap-5">
                                <div className="relative shrink-0">
                                    <div className="border-background ring-primary/10 bg-muted h-16 w-16 overflow-hidden rounded-2xl border-2 shadow-md ring-2 sm:h-20 sm:w-20">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt={cardData.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <User className="text-muted-foreground h-7 w-7 sm:h-8 sm:w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className={cn(
                                            "border-card absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-[2.5px] shadow-md sm:-right-1.5 sm:-bottom-1.5 sm:h-7 sm:w-7",
                                            isValid ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground",
                                        )}
                                    >
                                        {isValid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-lg leading-tight font-bold tracking-tight sm:text-xl">{cardData.name}</h2>
                                    <p className="text-muted-foreground mb-2 truncate text-sm font-medium">
                                        {isStudent ? cardData.course : cardData.department}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="bg-secondary/50 hover:bg-secondary/70 h-6 border-0 px-2 py-0.5 font-mono text-xs"
                                        >
                                            {cardData.id}
                                        </Badge>
                                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 h-6 px-2 text-[10px]">
                                            {isStudent ? "STUDENT" : "FACULTY"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </DialogTrigger>

                {/* Full Screen Overlay */}
                <DialogContent 
                    showCloseButton={false} // Disable default close button since we add our own
                    className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-background/95 backdrop-blur-xl border-0 max-w-[450px] sm:max-w-[400px] w-[95%] sm:w-[90%] rounded-2xl p-0"
                >
                    <DialogTitle className="sr-only">Full Screen ID</DialogTitle>

                    {/* Close Button */}
                    <DialogClose className="bg-muted text-muted-foreground hover:bg-muted/80 absolute top-2 right-2 sm:top-3 sm:right-3 rounded-full p-1 sm:p-1.5 transition-colors z-50">
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </DialogClose>

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="flex w-full flex-col items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-6"
                    >
                        {/* Header Info */}
                        <div className="space-y-1 sm:space-y-1.5 text-center">
                            <div className="border-background ring-border mx-auto mb-1.5 sm:mb-2 h-10 sm:h-12 w-10 sm:w-12 overflow-hidden rounded-full border-2 shadow-md ring-1">
                                {photoUrl ? (
                                    <img src={photoUrl} alt={cardData.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="bg-muted flex h-full w-full items-center justify-center">
                                        <User className="text-muted-foreground h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                )}
                            </div>
                            <h2 className="text-foreground text-lg sm:text-xl font-bold tracking-tight">{cardData.name}</h2>
                            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 h-5.5 sm:h-6 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">
                                {isStudent ? "Student Pass" : "Faculty Pass"}
                            </Badge>
                        </div>

                        {/* High Contrast QR Container */}
                        <div className="relative flex aspect-square w-full max-w-[240px] sm:max-w-[280px] items-center justify-center rounded-lg sm:rounded-xl bg-white p-2.5 sm:p-3 shadow-lg ring-1 ring-black/5">
                            <img 
                                src={qrCode} 
                                alt="Access QR Code" 
                                className="h-full w-full object-contain"
                            />
                            {/* Corner Accents */}
                            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 h-5 sm:h-6 w-5 sm:w-6 rounded-t-md border-t-[2px] border-l-[2px] border-black opacity-10" />
                            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-5 sm:h-6 w-5 sm:w-6 rounded-tr-md border-t-[2px] border-r-[2px] border-black opacity-10" />
                            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 h-5 sm:h-6 w-5 sm:w-6 rounded-bl-md border-b-[2px] border-l-[2px] border-black opacity-10" />
                            <div className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2 h-5 sm:h-6 w-5 sm:w-6 rounded-br-md border-r-[2px] border-b-[2px] border-black opacity-10" />
                        </div>

                        {/* ID Number Display */}
                        <div className="flex flex-col items-center gap-0.5">
                            <p className="text-muted-foreground text-[8px] sm:text-[9px] font-bold tracking-[0.2em] uppercase">ID Number</p>
                            <p className="text-foreground font-mono text-xl sm:text-2xl font-black tracking-widest">{cardData.id}</p>
                        </div>

                        {/* Actions */}
                        {onRefresh && (
                            <Button
                                size="sm"
                                className="h-8 sm:h-9 w-full max-w-xs rounded-full px-4 sm:px-5 font-medium shadow-sm text-xs sm:text-sm"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={cn("mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5", isRefreshing && "animate-spin")} />
                                Refresh Code
                            </Button>
                        )}
                    </motion.div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function DigitalIdCardSkeleton({ isCompact = false }: { isCompact?: boolean }) {
    return (
        <div
            className={cn(
                "bg-card border-border/50 relative overflow-hidden rounded-3xl border shadow-sm",
                isCompact ? "h-[220px]" : "mx-auto h-[240px] w-full max-w-md",
            )}
        >
            <div className="flex h-full flex-col justify-between p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted h-10 w-10 animate-pulse rounded-xl" />
                        <div className="space-y-2">
                            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                            <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                        </div>
                    </div>
                    <div className="bg-muted h-8 w-12 animate-pulse rounded-md" />
                </div>

                <div className="my-4 flex items-center gap-5">
                    <div className="bg-muted h-20 w-20 animate-pulse rounded-2xl" />
                    <div className="flex-1 space-y-3">
                        <div className="bg-muted h-6 w-3/4 animate-pulse rounded" />
                        <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
                        <div className="flex gap-2">
                            <div className="bg-muted h-5 w-16 animate-pulse rounded" />
                            <div className="bg-muted h-5 w-16 animate-pulse rounded" />
                        </div>
                    </div>
                </div>

                <div className="border-border/30 flex items-center justify-between border-t pt-4">
                    <div className="bg-muted h-8 w-24 animate-pulse rounded" />
                    <div className="bg-muted h-8 w-28 animate-pulse rounded-full" />
                </div>
            </div>
        </div>
    );
}

export default DigitalIdCard;
