import AdminLayout from "@/components/administrators/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User } from "@/types/user";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Banknote, FileSpreadsheet, Plus, Receipt, Search, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { route } from "ziggy-js";

interface PaymentItem {
    id: number;
    transaction_number: string;
    student_id: string;
    student_name: string;
    amount: number;
    method: string | null;
    status: string;
    date: string;
    cashier: string;
    description: string | null;
    receipt_url: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaymentsProps {
    user: User;
    payments: {
        data: PaymentItem[];
        links: PaginationLink[];
    };
    summary: {
        total_transactions: number;
        total_collected: number;
        today_transactions: number;
        today_collected: number;
        payment_methods: string[];
    };
    filters: {
        search: string;
        method: string;
        status: string;
    };
}

interface Branding {
    currency: string;
}

export default function PaymentsPage({ user, payments, summary, filters }: PaymentsProps) {
    const { props } = usePage<{ branding?: Branding }>();
    const currency = props.branding?.currency || "PHP";
    const [search, setSearch] = useState(filters.search || "");
    const [method, setMethod] = useState(filters.method || "all");
    const [status, setStatus] = useState(filters.status || "all");

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-PH", {
            style: "currency",
            currency,
        }).format(amount || 0);

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route("administrators.finance.payments"),
            {
                search: search || undefined,
                method: method === "all" ? undefined : method,
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
        setMethod("all");
        setStatus("all");
        router.get(route("administrators.finance.payments"), {}, { preserveScroll: true, replace: true });
    };

    return (
        <AdminLayout user={user} title="Payment Desk">
            <Head title="Finance - Payments" />

            <div className="space-y-6">
                <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Desk</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Search receipts, verify cashier entries, and continue payment intake from one operational list.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="outline" disabled className="gap-2">
                            <FileSpreadsheet className="size-4" />
                            Export
                        </Button>
                        <Button asChild className="gap-2">
                            <Link href={route("administrators.finance.payments.create")}>
                                <Plus className="size-4" />
                                Receive Payment
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <SummaryCard icon={Banknote} label="Filtered collection" value={formatCurrency(summary.total_collected)} detail={`${summary.total_transactions} receipts`} />
                    <SummaryCard icon={Receipt} label="Today collected" value={formatCurrency(summary.today_collected)} detail={`${summary.today_transactions} receipts today`} />
                    <SummaryCard icon={UserRound} label="Payment channels" value={String(summary.payment_methods.length)} detail="Methods represented in this result set" />
                </section>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <CardTitle>Receipts and Transactions</CardTitle>
                                <CardDescription>Use student ID, name, receipt number, reference, or remarks to find a payment.</CardDescription>
                            </div>
                            <form onSubmit={submitFilters} className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_140px_auto_auto]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search receipt or student"
                                        className="pl-9"
                                    />
                                </div>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All methods</SelectItem>
                                        {summary.payment_methods.map((paymentMethod) => (
                                            <SelectItem key={paymentMethod} value={paymentMethod}>
                                                {paymentMethod}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All status</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="void">Void</SelectItem>
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
                                    <TableHead>Receipt</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Cashier</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.data.length > 0 ? (
                                    payments.data.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                <div className="font-mono text-xs font-semibold">{payment.transaction_number}</div>
                                                <div className="text-xs text-muted-foreground">{payment.date}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{payment.student_name}</div>
                                                <div className="text-xs text-muted-foreground">{payment.student_id}</div>
                                            </TableCell>
                                            <TableCell>{payment.cashier}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{payment.method || "Unspecified"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(payment.amount)}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={payment.status === "paid" ? "default" : "secondary"}>{payment.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild size="sm" variant="ghost" className="gap-2">
                                                    <Link href={payment.receipt_url}>
                                                        <Receipt className="size-4" />
                                                        Receipt
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            No payments match the current filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">Showing {payments.data.length} receipts on this page</p>
                            <div className="flex flex-wrap gap-1">
                                {payments.links.map((link) => (
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
    icon: typeof Banknote;
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
