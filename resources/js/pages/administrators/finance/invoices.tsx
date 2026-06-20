import AdminLayout from "@/components/administrators/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User } from "@/types/user";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { AlertCircle, ClipboardList, FileSpreadsheet, ReceiptText, Search, WalletCards } from "lucide-react";
import { FormEvent, useState } from "react";
import { route } from "ziggy-js";

interface InvoiceItem {
    id: number;
    invoice_number: string;
    student_id: string;
    student_name: string;
    course: string;
    year_level: string | number;
    total_amount: number;
    balance: number;
    status: string;
    date: string;
    payment_progress: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface InvoicesProps {
    user: User;
    invoices: {
        data: InvoiceItem[];
        links: PaginationLink[];
    };
    summary: {
        total_billings: number;
        total_assessed: number;
        total_outstanding: number;
        paid_count: number;
        unpaid_count: number;
    };
    filters: {
        search: string;
        status: string;
    };
}

interface Branding {
    currency: string;
}

export default function InvoicesPage({ user, invoices, summary, filters }: InvoicesProps) {
    const { props } = usePage<{ branding?: Branding }>();
    const currency = props.branding?.currency || "PHP";
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "all");

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-PH", {
            style: "currency",
            currency,
        }).format(amount || 0);

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            route("administrators.finance.invoices"),
            {
                search: search || undefined,
                status: status === "all" ? undefined : status,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("all");
        router.get(route("administrators.finance.invoices"), {}, { preserveScroll: true, replace: true });
    };

    return (
        <AdminLayout user={user} title="Billing Desk">
            <Head title="Finance - Billing" />

            <div className="space-y-6">
                <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing Desk</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Review enrollment billings before payment intake, identify unpaid accounts, and hand off students to cashier.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="outline" disabled className="gap-2">
                            <FileSpreadsheet className="size-4" />
                            Export
                        </Button>
                        <Button asChild className="gap-2">
                            <Link href={route("administrators.finance.payments.create")}>
                                <ReceiptText className="size-4" />
                                Receive Payment
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <SummaryCard icon={ClipboardList} label="Billings" value={String(summary.total_billings)} detail="Enrollment billing records" />
                    <SummaryCard icon={WalletCards} label="Assessed" value={formatCurrency(summary.total_assessed)} detail="Total charges in view" />
                    <SummaryCard icon={AlertCircle} label="Outstanding" value={formatCurrency(summary.total_outstanding)} detail={`${summary.unpaid_count} unpaid accounts`} />
                    <SummaryCard icon={ReceiptText} label="Paid" value={String(summary.paid_count)} detail="Accounts cleared" />
                </section>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <CardTitle>Student Billing Statements</CardTitle>
                                <CardDescription>Filter by student or status before sending a payer to the cashier.</CardDescription>
                            </div>
                            <form onSubmit={submitFilters} className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_150px_auto_auto]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search student or ID"
                                        className="pl-9"
                                    />
                                </div>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All status</SelectItem>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit">Apply</Button>
                                <Button type="button" variant="ghost" onClick={resetFilters}>
                                    Reset
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Billing</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Payment Progress</TableHead>
                                    <TableHead className="text-right">Assessed</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.data.length > 0 ? (
                                    invoices.data.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>
                                                <div className="font-mono text-xs font-semibold">{invoice.invoice_number}</div>
                                                <div className="text-xs text-muted-foreground">{invoice.date}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{invoice.student_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {invoice.student_id} · {invoice.course} · Year {invoice.year_level}
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-40">
                                                <div className="flex items-center gap-2">
                                                    <Progress value={invoice.payment_progress} className="h-2" />
                                                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                                                        {invoice.payment_progress}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                                            <TableCell className="text-right font-semibold text-amber-600">{formatCurrency(invoice.balance)}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>{invoice.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild size="sm" variant={invoice.status === "Paid" ? "outline" : "default"}>
                                                    <Link href={route("administrators.finance.payments.create", { query: { student: invoice.student_id } })}>
                                                        {invoice.status === "Paid" ? "New receipt" : "Collect"}
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            No billing records match the current filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">Showing {invoices.data.length} billing records on this page</p>
                            <div className="flex flex-wrap gap-1">
                                {invoices.links.map((link) => (
                                    <Button key={link.label} asChild={Boolean(link.url)} disabled={!link.url} variant={link.active ? "default" : "outline"} size="sm">
                                        {link.url ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: typeof ClipboardList;
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    );
}
