import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { favorite, show, unfavorite } from "@/routes/library/books";
import { Link, router } from "@inertiajs/react";
import { BookOpen, Bookmark, Heart, LibraryBig } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCover } from "./book-cover";

export interface LibraryBookCardData {
    id: number;
    title: string;
    author: string | null;
    category: string | null;
    category_color: string | null;
    publication_year: number | null;
    description: string;
    cover_image_url: string | null;
    available_online: boolean;
    is_favorite: boolean;
}

export function BookCard({ book, priority = false }: { book: LibraryBookCardData; priority?: boolean }) {
    const [isFavorite, setIsFavorite] = useState(book.is_favorite);
    const [favoritePending, setFavoritePending] = useState(false);

    useEffect(() => setIsFavorite(book.is_favorite), [book.is_favorite]);

    const toggleFavorite = () => {
        const next = !isFavorite;
        setIsFavorite(next);
        setFavoritePending(true);

        const routeDefinition = next ? favorite(book.id) : unfavorite(book.id);
        router.visit(routeDefinition.url, {
            method: routeDefinition.method,
            preserveScroll: true,
            preserveState: true,
            only: ["books", "stats", "state"],
            onError: () => setIsFavorite(!next),
            onFinish: () => setFavoritePending(false),
        });
    };

    return (
        <article className="group border-border/70 bg-card/80 hover:border-primary/35 relative flex min-h-full flex-col overflow-hidden rounded-[1.35rem] border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <Link href={show.url(book.id)} prefetch className="relative block aspect-[3/4] overflow-hidden">
                <BookCover title={book.title} author={book.author} coverUrl={book.cover_image_url} priority={priority} />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 pt-12">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
                            book.available_online
                                ? "border-emerald-300/40 bg-emerald-950/75 text-emerald-100"
                                : "border-white/25 bg-black/45 text-white/85",
                        )}
                    >
                        {book.available_online ? <BookOpen className="size-3.5" /> : <LibraryBig className="size-3.5" />}
                        {book.available_online ? "Available Online" : "Catalog Only"}
                    </span>
                </div>
            </Link>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="space-y-2">
                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                        {book.category && <span className="font-semibold tracking-[0.12em] uppercase">{book.category}</span>}
                        {book.publication_year && (
                            <>
                                <span aria-hidden="true">•</span>
                                <span>{book.publication_year}</span>
                            </>
                        )}
                    </div>
                    <div>
                        <Link href={show.url(book.id)} prefetch className="hover:text-primary transition-colors">
                            <h2 className="line-clamp-2 font-serif text-lg leading-snug font-semibold text-balance">{book.title}</h2>
                        </Link>
                        <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">{book.author || "Unknown author"}</p>
                    </div>
                    <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{book.description || "No description available."}</p>
                </div>

                <div className="mt-auto flex items-center gap-2">
                    <Button asChild size="sm" className="flex-1 gap-2 rounded-xl">
                        <Link href={show.url(book.id)} prefetch>
                            {book.available_online ? <BookOpen className="size-4" /> : <Bookmark className="size-4" />}
                            {book.available_online ? "Open book" : "View details"}
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="rounded-xl"
                        onClick={toggleFavorite}
                        disabled={favoritePending}
                        aria-label={isFavorite ? `Remove ${book.title} from favorites` : `Add ${book.title} to favorites`}
                        aria-pressed={isFavorite}
                    >
                        <Heart className={cn("size-4", isFavorite && "fill-rose-500 text-rose-500")} />
                    </Button>
                </div>
            </div>
        </article>
    );
}
