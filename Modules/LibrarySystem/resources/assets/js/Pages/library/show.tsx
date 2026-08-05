import PortalLayout from "@/components/portal-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { index as libraryIndex } from "@/routes/library";
import { download, favorite, read, unfavorite } from "@/routes/library/books";
import type { User } from "@/types/user";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, BookOpen, Building2, Calendar, Download, FileText, Heart, LibraryBig, MapPin, Scale, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { BookCard, type LibraryBookCardData } from "./components/book-card";
import { BookCover } from "./components/book-cover";

interface BookDetail {
    id: number;
    title: string;
    isbn: string | null;
    call_number: string | null;
    accession_number: string | null;
    author: string | null;
    author_biography: string | null;
    category: string | null;
    category_color: string | null;
    publisher: string | null;
    publication_year: number | null;
    pages: number | null;
    description: string | null;
    location: string | null;
    cover_image_url: string | null;
    available_online: boolean;
    downloads_allowed: boolean;
    rights_basis: string | null;
    rights_holder: string | null;
    license_url: string | null;
    rights_expires_at: string | null;
}

interface Props {
    auth: { user: User };
    book: BookDetail;
    state: {
        is_favorite: boolean;
        last_page: number | null;
        total_pages: number | null;
        last_read_at: string | null;
    };
    related: LibraryBookCardData[];
    takedown_email: string | null;
}

const RIGHTS_LABELS: Record<string, string> = {
    koakademy_owned: "KoAkademy-owned work",
    written_permission: "Written permission",
    licensed: "Licensed distribution",
    open_license: "Open license",
    public_domain: "Public domain",
};

export default function DigitalLibraryShow({ auth, book, state, related, takedown_email }: Props) {
    const [isFavorite, setIsFavorite] = useState(state.is_favorite);
    const progress = state.last_page && state.total_pages ? Math.min(100, Math.round((state.last_page / state.total_pages) * 100)) : null;

    const toggleFavorite = () => {
        const next = !isFavorite;
        setIsFavorite(next);
        const routeDefinition = next ? favorite(book.id) : unfavorite(book.id);
        router.visit(routeDefinition.url, {
            method: routeDefinition.method,
            preserveScroll: true,
            preserveState: true,
            only: ["state"],
            onError: () => setIsFavorite(!next),
        });
    };

    return (
        <PortalLayout user={auth.user}>
            <Head title={book.title} />

            <Button variant="ghost" className="w-fit gap-2" asChild>
                <Link href={libraryIndex.url()}>
                    <ArrowLeft className="size-4" />
                    Back to Digital Library
                </Link>
            </Button>

            <section className="relative overflow-hidden rounded-[2rem] border bg-[#f3ead8] p-5 text-stone-950 shadow-sm md:p-8 dark:bg-[#18150f] dark:text-amber-50">
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_80%_15%,#b45309_0,transparent_34%)] opacity-15" />
                <div className="relative grid gap-8 lg:grid-cols-[minmax(15rem,20rem)_1fr]">
                    <div className="mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-l-md rounded-r-2xl border border-black/15 shadow-2xl">
                        <BookCover title={book.title} author={book.author} coverUrl={book.cover_image_url} priority />
                    </div>

                    <div className="flex flex-col justify-center gap-6">
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {book.category && (
                                    <Badge className="bg-stone-900 text-white hover:bg-stone-800 dark:bg-amber-100 dark:text-stone-950">
                                        {book.category}
                                    </Badge>
                                )}
                                <Badge variant="outline" className="border-stone-800/25 dark:border-amber-100/25">
                                    {book.available_online ? "Available Online" : "Catalog Only"}
                                </Badge>
                            </div>
                            <div>
                                <h1 className="max-w-4xl font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
                                    {book.title}
                                </h1>
                                <p className="mt-3 text-lg text-stone-700 dark:text-amber-100/70">
                                    {book.author ? `by ${book.author}` : "Author unavailable"}
                                </p>
                            </div>
                            <p className="max-w-3xl text-sm leading-7 text-stone-700 md:text-base dark:text-amber-100/70">
                                {book.description || "No description is available for this catalog entry."}
                            </p>
                        </div>

                        {progress !== null && book.available_online && (
                            <div className="max-w-xl space-y-2">
                                <div className="flex justify-between text-xs font-semibold tracking-[0.12em] uppercase">
                                    <span>Reading progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-stone-900/10 dark:bg-white/10">
                                    <div className="h-full rounded-full bg-amber-700 dark:bg-amber-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {book.available_online ? (
                                <Button
                                    size="lg"
                                    className="gap-2 rounded-xl bg-stone-950 text-white hover:bg-stone-800 dark:bg-amber-100 dark:text-stone-950 dark:hover:bg-amber-200"
                                    asChild
                                >
                                    <Link href={read.url(book.id)}>
                                        <BookOpen className="size-5" />
                                        {state.last_page && state.last_page > 1 ? `Continue on page ${state.last_page}` : "Read online"}
                                    </Link>
                                </Button>
                            ) : (
                                <Button size="lg" disabled className="gap-2 rounded-xl">
                                    <LibraryBig className="size-5" />
                                    Digital copy unavailable
                                </Button>
                            )}
                            {book.available_online && book.downloads_allowed && (
                                <Button size="lg" variant="outline" className="gap-2 rounded-xl border-stone-800/20 dark:border-amber-100/20" asChild>
                                    <a href={download.url(book.id)}>
                                        <Download className="size-5" />
                                        Download PDF
                                    </a>
                                </Button>
                            )}
                            <Button
                                size="lg"
                                variant="outline"
                                className="gap-2 rounded-xl border-stone-800/20 dark:border-amber-100/20"
                                onClick={toggleFavorite}
                            >
                                <Heart className={`size-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                                {isFavorite ? "Saved to favorites" : "Save for later"}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl">Catalog details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            <Detail icon={UserRound} label="Author" value={book.author} />
                            <Detail icon={Building2} label="Publisher" value={book.publisher} />
                            <Detail icon={Calendar} label="Publication year" value={book.publication_year?.toString()} />
                            <Detail icon={FileText} label="Length" value={book.pages ? `${book.pages} pages` : null} />
                            <Detail icon={MapPin} label="Shelf location" value={book.location} />
                            <Detail icon={LibraryBig} label="Call number" value={book.call_number} />
                            <Detail icon={ShieldCheck} label="Accession number" value={book.accession_number} />
                            <Detail icon={BookOpen} label="ISBN" value={book.isbn} />
                        </CardContent>
                    </Card>

                    {book.author_biography && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-serif text-2xl">About the author</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-7">{book.author_biography}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card className="h-fit border-amber-800/20 bg-amber-50/60 dark:border-amber-200/10 dark:bg-amber-950/10">
                    <CardHeader>
                        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-800/10 text-amber-800 dark:bg-amber-200/10 dark:text-amber-200">
                            <Scale className="size-5" />
                        </div>
                        <CardTitle className="font-serif">Digital use & rights</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground space-y-4 text-sm leading-6">
                        {book.available_online ? (
                            <>
                                <p>
                                    This edition is available to authenticated KoAkademy users under{" "}
                                    <strong className="text-foreground">
                                        {book.rights_basis ? RIGHTS_LABELS[book.rights_basis] : "documented permission"}
                                    </strong>
                                    .
                                </p>
                                {book.rights_holder && (
                                    <p>
                                        Rights holder: <span className="text-foreground">{book.rights_holder}</span>
                                    </p>
                                )}
                                {book.license_url && (
                                    <a href={book.license_url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                                        Review license terms
                                    </a>
                                )}
                                <p>
                                    {book.downloads_allowed
                                        ? "Downloads are permitted for this title. Redistribution may still be restricted."
                                        : "Online reading is permitted; downloads and redistribution are not authorized."}
                                </p>
                            </>
                        ) : (
                            <p>No rights-cleared digital edition has been published for this catalog record.</p>
                        )}
                        {takedown_email && (
                            <p className="border-t pt-4">
                                Rights concern? Contact{" "}
                                <a href={`mailto:${takedown_email}`} className="text-primary underline underline-offset-4">
                                    {takedown_email}
                                </a>
                                .
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {related.length > 0 && (
                <section className="space-y-4" aria-labelledby="related-heading">
                    <div>
                        <p className="text-primary text-xs font-semibold tracking-[0.15em] uppercase">From the same shelf</p>
                        <h2 id="related-heading" className="font-serif text-2xl font-semibold">
                            Related books
                        </h2>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {related.map((relatedBook) => (
                            <BookCard key={relatedBook.id} book={relatedBook} />
                        ))}
                    </div>
                </section>
            )}
        </PortalLayout>
    );
}

function Detail({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value?: string | null }) {
    return (
        <div className="flex gap-3">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Icon className="text-muted-foreground size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">{label}</p>
                <p className="mt-1 text-sm font-medium break-words">{value || "Not recorded"}</p>
            </div>
        </div>
    );
}
