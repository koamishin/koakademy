import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

interface BookCoverProps {
    title: string;
    author?: string | null;
    coverUrl?: string | null;
    className?: string;
    priority?: boolean;
}

const PALETTES = [
    "from-amber-900 via-orange-800 to-amber-950",
    "from-emerald-900 via-teal-800 to-slate-950",
    "from-sky-900 via-blue-800 to-slate-950",
    "from-rose-900 via-red-800 to-stone-950",
    "from-violet-900 via-indigo-800 to-slate-950",
];

function paletteFor(title: string): string {
    const seed = [...title].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return PALETTES[seed % PALETTES.length];
}

export function BookCover({ title, author, coverUrl, className, priority = false }: BookCoverProps) {
    if (coverUrl) {
        return (
            <img
                src={coverUrl}
                alt={`Cover of ${title}`}
                className={cn("h-full w-full object-cover", className)}
                loading={priority ? "eager" : "lazy"}
            />
        );
    }

    return (
        <div
            className={cn(
                "relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br p-5 text-white shadow-inner",
                paletteFor(title),
                className,
            )}
            role="img"
            aria-label={`Decorative cover placeholder for ${title}`}
        >
            <div className="absolute inset-y-0 left-3 w-px bg-white/20" />
            <div className="absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_34%),linear-gradient(115deg,transparent_45%,white_46%,transparent_47%)] opacity-20" />
            <BookOpen className="relative size-5 text-white/75" aria-hidden="true" />
            <div className="relative mt-auto space-y-2">
                <div className="h-px w-10 bg-amber-300/80" />
                <p className="line-clamp-4 font-serif text-lg leading-tight font-semibold text-balance">{title}</p>
                {author && <p className="line-clamp-2 text-[11px] font-medium tracking-[0.18em] text-white/70 uppercase">{author}</p>}
            </div>
        </div>
    );
}
