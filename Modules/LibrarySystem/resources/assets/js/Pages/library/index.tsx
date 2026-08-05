import PortalLayout from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { index as libraryIndex } from "@/routes/library";
import type { User } from "@/types/user";
import { Head, Link, router } from "@inertiajs/react";
import { BookOpen, ChevronLeft, ChevronRight, Heart, LibraryBig, Search, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BookCard, type LibraryBookCardData } from "./components/book-card";

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Filters {
    search: string;
    category_id: number | null;
    year: number | null;
    availability: string;
    collection: string;
    sort: string;
}

interface Props {
    auth: { user: User };
    books: Pagination<LibraryBookCardData>;
    filters: Filters;
    options: {
        categories: { id: number; name: string }[];
        years: number[];
    };
    stats: {
        catalog_books: number;
        available_online: number;
        favorites: number;
    };
}

const numberFormatter = new Intl.NumberFormat();

export default function DigitalLibraryIndex({ auth, books, filters, options, stats }: Props) {
    const [search, setSearch] = useState(filters.search);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => setSearch(filters.search), [filters.search]);
    useEffect(
        () => () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        },
        [],
    );

    const visitWith = (changes: Partial<Filters>) => {
        const next = { ...filters, ...changes };
        router.get(
            libraryIndex.url({
                query: {
                    search: next.search || undefined,
                    category_id: next.category_id || undefined,
                    year: next.year || undefined,
                    availability: next.availability === "all" ? undefined : next.availability,
                    collection: next.collection === "all" ? undefined : next.collection,
                    sort: next.sort === "title" ? undefined : next.sort,
                },
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ["books", "filters", "stats"],
            },
        );
    };

    const updateSearch = (value: string) => {
        setSearch(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => visitWith({ search: value }), 300);
    };

    const clearFilters = () => {
        setSearch("");
        router.get(libraryIndex.url(), {}, { preserveState: true, replace: true });
    };

    const hasFilters =
        filters.search !== "" ||
        filters.category_id !== null ||
        filters.year !== null ||
        filters.availability !== "all" ||
        filters.collection !== "all" ||
        filters.sort !== "title";

    return (
        <PortalLayout user={auth.user}>
            <Head title="Digital Library" />

            <section className="relative overflow-hidden rounded-[2rem] border border-amber-900/15 bg-[#f4ead4] px-5 py-8 text-stone-950 shadow-sm md:px-9 md:py-10 dark:border-amber-200/10 dark:bg-[#18150f] dark:text-amber-50">
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_18%_30%,#92400e_0,transparent_30%),linear-gradient(115deg,transparent_48%,#92400e_49%,transparent_50%)] opacity-[0.14] dark:opacity-[0.2]" />
                <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
                    <div className="max-w-3xl space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-900/20 bg-white/45 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase backdrop-blur-sm dark:border-amber-100/15 dark:bg-black/20">
                            <Sparkles className="size-3.5 text-amber-700 dark:text-amber-300" />
                            KoAkademy Digital Library
                        </div>
                        <div className="space-y-3">
                            <h1 className="max-w-2xl font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
                                Knowledge, kept open for the KoAkademy community.
                            </h1>
                            <p className="max-w-2xl text-sm leading-7 text-stone-700 md:text-base dark:text-amber-100/70">
                                Explore the complete library catalog, save titles for later, and read rights-cleared digital editions from any device.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1">
                        {[
                            { label: "Catalog titles", value: stats.catalog_books, icon: LibraryBig },
                            { label: "Available online", value: stats.available_online, icon: BookOpen },
                            { label: "Your favorites", value: stats.favorites, icon: Heart },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl border border-stone-900/10 bg-white/55 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                            >
                                <div className="flex items-center gap-2">
                                    <stat.icon className="size-4 text-amber-800 dark:text-amber-300" />
                                    <span className="text-xl font-semibold tabular-nums md:text-2xl">{numberFormatter.format(stat.value)}</span>
                                </div>
                                <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-stone-600 uppercase sm:text-xs dark:text-amber-100/55">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Card className="border-border/70 shadow-sm">
                <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(15rem,1.5fr)_repeat(4,minmax(9rem,0.65fr))_auto] lg:items-end">
                    <div className="space-y-2">
                        <Label htmlFor="library-search">Search the catalog</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                id="library-search"
                                value={search}
                                onChange={(event) => updateSearch(event.target.value)}
                                className="pl-9"
                                placeholder="Title, author, ISBN, or call number"
                            />
                        </div>
                    </div>
                    <FilterSelect
                        label="Category"
                        value={filters.category_id ? String(filters.category_id) : "all"}
                        onChange={(value) => visitWith({ category_id: value === "all" ? null : Number(value) })}
                        options={[
                            { value: "all", label: "All categories" },
                            ...options.categories.map((category) => ({ value: String(category.id), label: category.name })),
                        ]}
                    />
                    <FilterSelect
                        label="Year"
                        value={filters.year ? String(filters.year) : "all"}
                        onChange={(value) => visitWith({ year: value === "all" ? null : Number(value) })}
                        options={[
                            { value: "all", label: "All years" },
                            ...options.years.map((year) => ({ value: String(year), label: String(year) })),
                        ]}
                    />
                    <FilterSelect
                        label="Availability"
                        value={filters.availability}
                        onChange={(value) => visitWith({ availability: value })}
                        options={[
                            { value: "all", label: "All books" },
                            { value: "online", label: "Available online" },
                            { value: "catalog", label: "Catalog only" },
                        ]}
                    />
                    <FilterSelect
                        label="Collection"
                        value={filters.collection}
                        onChange={(value) => visitWith({ collection: value })}
                        options={[
                            { value: "all", label: "Entire catalog" },
                            { value: "favorites", label: "My favorites" },
                            { value: "recent", label: "Recently read" },
                        ]}
                    />
                    <div className="flex gap-2">
                        <FilterSelect
                            label="Sort"
                            value={filters.sort}
                            onChange={(value) => visitWith({ sort: value })}
                            options={[
                                { value: "title", label: "Title A–Z" },
                                { value: "year_newest", label: "Newest year" },
                                { value: "year_oldest", label: "Oldest year" },
                                { value: "recently_added", label: "Recently added" },
                            ]}
                        />
                        {hasFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-7 shrink-0"
                                onClick={clearFilters}
                                aria-label="Clear filters"
                            >
                                <X className="size-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <section aria-labelledby="catalog-heading" className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-muted-foreground text-sm">
                            {books.total === 0
                                ? "No matching titles"
                                : `Showing ${numberFormatter.format(books.from ?? 0)}–${numberFormatter.format(books.to ?? 0)} of ${numberFormatter.format(books.total)}`}
                        </p>
                        <h2 id="catalog-heading" className="font-serif text-2xl font-semibold">
                            {filters.collection === "favorites"
                                ? "Your saved shelf"
                                : filters.collection === "recent"
                                  ? "Continue exploring"
                                  : "Library catalog"}
                        </h2>
                    </div>
                </div>

                {books.data.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {books.data.map((book, index) => (
                            <BookCard key={book.id} book={book} priority={index < 4} />
                        ))}
                    </div>
                ) : (
                    <div className="border-border bg-muted/25 flex min-h-72 flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-dashed p-8 text-center">
                        <div className="bg-background flex size-14 items-center justify-center rounded-2xl border shadow-sm">
                            <Search className="text-muted-foreground size-6" />
                        </div>
                        <div className="max-w-md">
                            <h3 className="font-serif text-xl font-semibold">No books match this shelf</h3>
                            <p className="text-muted-foreground mt-2 text-sm leading-6">Try a broader search or clear the current filters.</p>
                        </div>
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                )}

                {books.last_page > 1 && (
                    <nav className="flex items-center justify-between gap-3 border-t pt-5" aria-label="Catalog pagination">
                        <Button variant="outline" disabled={!books.prev_page_url} asChild={Boolean(books.prev_page_url)}>
                            {books.prev_page_url ? (
                                <Link href={books.prev_page_url} preserveScroll>
                                    <ChevronLeft className="size-4" />
                                    Previous
                                </Link>
                            ) : (
                                <span>
                                    <ChevronLeft className="size-4" />
                                    Previous
                                </span>
                            )}
                        </Button>
                        <p className="text-muted-foreground text-sm tabular-nums">
                            Page {books.current_page} of {books.last_page}
                        </p>
                        <Button variant="outline" disabled={!books.next_page_url} asChild={Boolean(books.next_page_url)}>
                            {books.next_page_url ? (
                                <Link href={books.next_page_url} preserveScroll>
                                    Next
                                    <ChevronRight className="size-4" />
                                </Link>
                            ) : (
                                <span>
                                    Next
                                    <ChevronRight className="size-4" />
                                </span>
                            )}
                        </Button>
                    </nav>
                )}
            </section>
        </PortalLayout>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="min-w-0 space-y-2">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
