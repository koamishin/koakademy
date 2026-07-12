import AdminLayout from "@/components/administrators/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { students } from "@/routes/administrators/enrollments/api";
import { payments } from "@/routes/administrators/finance";
import { studentDetails, studentTransactions } from "@/routes/administrators/finance/api";
import { store } from "@/routes/administrators/finance/payments";
import type { User } from "@/types/user";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Check,
    ChevronsUpDown,
    CircleDollarSign,
    ExternalLink,
    History,
    Loader2,
    PackagePlus,
    PanelRightClose,
    PanelRightOpen,
    Plus,
    ReceiptText,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface InventoryItem {
    id: number;
    name: string;
    price: number;
    sku: string;
    category: string;
}

interface StudentOption {
    id: number;
    full_name: string;
    email: string;
    course_code: string | null;
    formatted_academic_year: string | null;
}

interface UnpaidEnrollment {
    id: number;
    enrollment_id: number;
    school_year: string;
    semester: number;
    total_amount: number;
    paid: number;
    balance: number;
}

interface StudentFinancialDetails {
    id: number;
    full_name: string;
    student_id: number;
    course: string;
    year_level: number;
    outstanding_balance: number;
    unpaid_enrollments: UnpaidEnrollment[];
}

interface StudentTransactionHistory {
    id: number;
    transaction_number: string | null;
    reference_number: string | null;
    date: string | null;
    time: string | null;
    amount: number;
    payment_method: string | null;
    status: string;
    cashier: string;
    remarks: string | null;
    settlements: Record<string, number>;
    receipt_url: string;
}

interface StudentTransactionHistoryResponse {
    transactions: StudentTransactionHistory[];
    summary: {
        count: number;
        total_paid: number;
    };
}

interface TransactionItem {
    id: string;
    type: "fee" | "item";
    label: string;
    amount: string;
    data: FeeType | InventoryItem;
}

interface FeeType {
    id: string;
    label: string;
}

interface CreatePaymentProps {
    user: User;
    items: InventoryItem[];
    currency: string;
}

interface Branding {
    currency: string;
}

const FEE_TYPES: FeeType[] = [
    { id: "registration_fee", label: "Registration Fee" },
    { id: "miscelanous_fee", label: "Miscellaneous Fee" },
    { id: "diploma_or_certificate", label: "Diploma / Certificate" },
    { id: "transcript_of_records", label: "Transcript of Records" },
    { id: "certification", label: "Certification" },
    { id: "special_exam", label: "Special Exam" },
    { id: "others", label: "Other Fees" },
];

const PAYMENT_METHODS = ["Cash", "GCash", "Maya", "Bank Transfer", "Check"];

function formatCurrency(amount: number, currency: string = "PHP"): string {
    return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-PH", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount || 0);
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

function formatSettlementLabel(key: string): string {
    return key.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function CreatePaymentPage({ user, items, currency: propCurrency }: CreatePaymentProps) {
    const { props } = usePage<{ branding?: Branding }>();
    const currency = props.branding?.currency || propCurrency || "PHP";
    const currencySymbol = currency === "USD" ? "$" : "₱";
    const [studentOpen, setStudentOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState("");
    const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
    const [studentLoading, setStudentLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentFinancialDetails | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearch, setHistorySearch] = useState("");
    const [transactionHistory, setTransactionHistory] = useState<StudentTransactionHistoryResponse>({
        transactions: [],
        summary: { count: 0, total_paid: 0 },
    });
    const [selectedTuitionId, setSelectedTuitionId] = useState("none");
    const [tuitionAmount, setTuitionAmount] = useState("");
    const [otherItems, setOtherItems] = useState<TransactionItem[]>([]);
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [cashReceived, setCashReceived] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const studentSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prefilledStudentRef = useRef(false);

    const selectedEnrollment = useMemo(
        () => selectedStudent?.unpaid_enrollments.find((enrollment) => enrollment.id.toString() === selectedTuitionId),
        [selectedStudent, selectedTuitionId],
    );

    const totalAmount = useMemo(() => {
        const tuition = selectedTuitionId === "none" ? 0 : Number.parseFloat(tuitionAmount) || 0;
        return tuition + otherItems.reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0);
    }, [selectedTuitionId, tuitionAmount, otherItems]);

    const receivedAmount = Number.parseFloat(cashReceived) || 0;
    const changeDue = paymentMethod === "Cash" ? Math.max(receivedAmount - totalAmount, 0) : 0;
    const isCashShort = paymentMethod === "Cash" && totalAmount > 0 && receivedAmount < totalAmount;
    const canSubmit = Boolean(selectedStudent && totalAmount > 0 && !isCashShort && !submitting);
    const filteredTransactionHistory = useMemo(() => {
        const search = historySearch.trim().toLocaleLowerCase();
        if (!search) {
            return transactionHistory.transactions;
        }

        return transactionHistory.transactions.filter((transaction) =>
            [
                transaction.transaction_number,
                transaction.reference_number,
                transaction.date,
                transaction.time,
                transaction.amount.toString(),
                transaction.payment_method,
                transaction.status,
                transaction.cashier,
                transaction.remarks,
                ...Object.keys(transaction.settlements).map(formatSettlementLabel),
            ]
                .filter(Boolean)
                .some((value) => value?.toLocaleLowerCase().includes(search)),
        );
    }, [historySearch, transactionHistory.transactions]);

    const loadStudentOptions = useCallback(async (search: string): Promise<StudentOption[]> => {
        const response = await fetch(students.url({ query: { search } }));
        if (!response.ok) {
            throw new Error("Student search failed");
        }
        return response.json();
    }, []);

    const searchStudents = useCallback(
        (search: string) => {
            if (studentSearchTimeout.current) {
                clearTimeout(studentSearchTimeout.current);
            }
            if (search.length < 2) {
                setStudentOptions([]);
                return;
            }
            studentSearchTimeout.current = setTimeout(async () => {
                setStudentLoading(true);
                try {
                    setStudentOptions(await loadStudentOptions(search));
                } catch {
                    toast.error("Student search failed. Try again.");
                } finally {
                    setStudentLoading(false);
                }
            }, 300);
        },
        [loadStudentOptions],
    );

    const handleSelectStudent = useCallback(async (student: StudentOption) => {
        setStudentOpen(false);
        setStudentSearch("");
        setStudentLoading(true);
        try {
            const response = await fetch(studentDetails.url({ query: { student_id: student.id } }));
            if (!response.ok) {
                throw new Error("Student details failed");
            }
            const details: StudentFinancialDetails = await response.json();
            setSelectedStudent(details);
            setHistoryOpen(true);
            setHistoryLoading(true);
            setHistorySearch("");
            setOtherItems([]);
            setSelectedTuitionId("none");
            setTuitionAmount("");
            setCashReceived("");
            toast.success(`${details.full_name} is ready for payment.`);

            const historyResponse = await fetch(studentTransactions.url(student.id));
            if (!historyResponse.ok) {
                throw new Error("Student history failed");
            }
            setTransactionHistory(await historyResponse.json());
        } catch {
            toast.error("Could not load all student account details.");
        } finally {
            setStudentLoading(false);
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (prefilledStudentRef.current || selectedStudent || typeof window === "undefined") {
            return;
        }
        const studentQuery = new URLSearchParams(window.location.search).get("student");
        if (!studentQuery || studentQuery.length < 2) {
            return;
        }
        prefilledStudentRef.current = true;
        setStudentSearch(studentQuery);
        setStudentLoading(true);
        loadStudentOptions(studentQuery)
            .then((studentResults) => {
                setStudentOptions(studentResults);
                if (studentResults.length === 1) {
                    void handleSelectStudent(studentResults[0]);
                } else {
                    setStudentOpen(true);
                    toast.info("Choose the matching student to continue.");
                }
            })
            .catch(() => toast.error("Could not prefill the student from billing."))
            .finally(() => setStudentLoading(false));
    }, [handleSelectStudent, loadStudentOptions, selectedStudent]);

    const handleTuitionChange = (value: string) => {
        setSelectedTuitionId(value);
        setTuitionAmount("");
    };

    const applyFullBalance = () => {
        if (selectedEnrollment) {
            setTuitionAmount(selectedEnrollment.balance.toFixed(2));
        }
    };

    const addFee = (fee: FeeType) => {
        setOtherItems((currentItems) => [...currentItems, { id: generateId(), type: "fee", label: fee.label, amount: "", data: fee }]);
        setAddItemOpen(false);
    };

    const addInventoryItem = (item: InventoryItem) => {
        setOtherItems((currentItems) => [
            ...currentItems,
            { id: generateId(), type: "item", label: item.name, amount: item.price.toString(), data: item },
        ]);
        setAddItemOpen(false);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSubmit || !selectedStudent) {
            return;
        }

        const paymentItems: Array<Record<string, string | number>> = [];
        if (selectedEnrollment && Number.parseFloat(tuitionAmount) > 0) {
            paymentItems.push({
                type: "tuition",
                name: `Tuition: SY ${selectedEnrollment.school_year} ${selectedEnrollment.semester === 1 ? "1st" : "2nd"} Sem`,
                amount: Number.parseFloat(tuitionAmount),
                tuition_id: selectedEnrollment.id,
            });
        }

        otherItems.forEach((item) => {
            const amount = Number.parseFloat(item.amount);
            if (amount <= 0) {
                return;
            }
            paymentItems.push(
                item.type === "fee"
                    ? { type: "fee", name: item.label, amount, fee_key: item.data.id }
                    : { type: "item", name: item.label, amount, id: item.data.id },
            );
        });

        setSubmitting(true);
        router.post(
            store.url(),
            {
                student_id: selectedStudent.id,
                payment_method: paymentMethod,
                reference_number: referenceNumber,
                remarks,
                items: paymentItems,
            },
            {
                onSuccess: () => toast.success("Payment recorded. Receipt is ready."),
                onError: () => toast.error("Payment could not be recorded. Review the transaction and retry."),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <AdminLayout user={user} title="Receive Payment">
            <Head title="Finance · Receive Payment" />
            <div
                className={cn(
                    "mx-auto grid max-w-[1500px] items-start gap-4 antialiased transition-[grid-template-columns] duration-200",
                    historyOpen && selectedStudent ? "xl:grid-cols-[minmax(0,1fr)_400px]" : "xl:grid-cols-1",
                )}
            >
                <form onSubmit={handleSubmit} className="min-w-0 space-y-4 pb-10">
                    <header className="border-border/70 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1.5">
                            <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase">
                                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                                Payment worksheet
                            </div>
                            <h1 className="text-foreground text-2xl font-bold tracking-tight text-balance sm:text-3xl">Receive a student payment</h1>
                            <p className="text-muted-foreground text-sm text-pretty">
                                A compact entry sheet for reviewing balances and recording a payment.
                            </p>
                        </div>
                        <Button variant="outline" asChild className="min-h-10 self-start active:scale-[0.96] sm:self-auto">
                            <Link href={payments.url()} prefetch>
                                <ArrowLeft data-icon="inline-start" />
                                Payment history
                            </Link>
                        </Button>
                    </header>

                    <Card className="overflow-hidden rounded-xl shadow-xs">
                        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Student account</Label>
                                <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={studentOpen}
                                            className="h-auto min-h-12 w-full justify-between rounded-xl px-3.5 py-2.5 text-left active:scale-[0.96]"
                                        >
                                            {selectedStudent ? (
                                                <span className="flex min-w-0 items-center gap-3">
                                                    <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                                                        {selectedStudent.full_name.charAt(0)}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="text-foreground block truncate font-semibold">
                                                            {selectedStudent.full_name}
                                                        </span>
                                                        <span className="text-muted-foreground block text-xs font-normal">
                                                            {selectedStudent.student_id} · {selectedStudent.course} · Year{" "}
                                                            {selectedStudent.year_level}
                                                        </span>
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground flex items-center gap-3">
                                                    <Search className="size-4" />
                                                    Search by student name or ID
                                                </span>
                                            )}
                                            <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[min(92vw,520px)] rounded-xl p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Type at least 2 characters…"
                                                value={studentSearch}
                                                onValueChange={(value) => {
                                                    setStudentSearch(value);
                                                    searchStudents(value);
                                                }}
                                            />
                                            <CommandList>
                                                {studentLoading ? (
                                                    <div className="text-muted-foreground flex items-center justify-center gap-2 p-6 text-sm">
                                                        <Loader2 className="size-4 animate-spin" />
                                                        Searching students…
                                                    </div>
                                                ) : studentSearch.length < 2 ? (
                                                    <div className="text-muted-foreground p-6 text-center text-sm">
                                                        Enter a name or student ID to start.
                                                    </div>
                                                ) : studentOptions.length === 0 ? (
                                                    <CommandEmpty>No matching students found.</CommandEmpty>
                                                ) : (
                                                    <CommandGroup heading="Students">
                                                        {studentOptions.map((student) => (
                                                            <CommandItem
                                                                key={student.id}
                                                                value={student.id.toString()}
                                                                onSelect={() => void handleSelectStudent(student)}
                                                                className="min-h-12 cursor-pointer gap-3"
                                                            >
                                                                <UserRound className="text-muted-foreground size-4" />
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block truncate font-medium">{student.full_name}</span>
                                                                    <span className="text-muted-foreground block text-xs">
                                                                        {student.course_code || "No course"} ·{" "}
                                                                        {student.formatted_academic_year || "Year not set"}
                                                                    </span>
                                                                </span>
                                                                <Check
                                                                    className={
                                                                        selectedStudent?.id === student.id ? "size-4 opacity-100" : "size-4 opacity-0"
                                                                    }
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {selectedStudent ? (
                                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 lg:min-w-[390px]">
                                    <div className="bg-muted/60 rounded-xl px-4 py-3">
                                        <p className="text-muted-foreground text-xs">Open balances</p>
                                        <p className="mt-1 font-semibold tabular-nums">{selectedStudent.unpaid_enrollments.length}</p>
                                    </div>
                                    <div className="rounded-xl bg-amber-500/10 px-4 py-3">
                                        <p className="text-xs text-amber-700 dark:text-amber-300">Total outstanding</p>
                                        <p className="mt-1 font-bold text-amber-800 tabular-nums dark:text-amber-200">
                                            {formatCurrency(selectedStudent.outstanding_balance, currency)}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label={historyOpen ? "Hide transaction history" : "Show transaction history"}
                                        onClick={() => setHistoryOpen((isOpen) => !isOpen)}
                                        className="size-full min-h-12 min-w-12 active:scale-[0.96]"
                                    >
                                        {historyOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
                                    </Button>
                                </div>
                            ) : (
                                <Badge variant="secondary" className="h-8 px-3">
                                    Waiting for payer
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <section className="space-y-4">
                            <Card className="overflow-hidden rounded-xl shadow-xs">
                                <CardHeader className="border-border/70 flex flex-row items-start justify-between gap-4 border-b">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <ReceiptText className="text-primary size-5" />
                                            Payment entries
                                        </CardTitle>
                                        <CardDescription className="mt-1 text-pretty">
                                            Enter one amount per row. Use the balance shortcut when collecting tuition in full.
                                        </CardDescription>
                                    </div>
                                    <Popover open={addItemOpen} onOpenChange={setAddItemOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" disabled={!selectedStudent} className="min-h-10 active:scale-[0.96]">
                                                <Plus data-icon="inline-start" />
                                                Add charge
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[min(92vw,360px)] rounded-xl p-0" align="end">
                                            <Command>
                                                <CommandInput placeholder="Search fees or items…" />
                                                <CommandList>
                                                    <CommandEmpty>No charge found.</CommandEmpty>
                                                    <CommandGroup heading="School fees">
                                                        {FEE_TYPES.map((fee) => (
                                                            <CommandItem
                                                                key={fee.id}
                                                                onSelect={() => addFee(fee)}
                                                                className="min-h-10 cursor-pointer"
                                                            >
                                                                {fee.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                    <CommandSeparator />
                                                    <CommandGroup heading="Inventory">
                                                        {items.map((item) => (
                                                            <CommandItem
                                                                key={item.id}
                                                                onSelect={() => addInventoryItem(item)}
                                                                className="min-h-11 cursor-pointer"
                                                            >
                                                                <PackagePlus className="size-4" />
                                                                <span className="flex-1">
                                                                    <span className="block">{item.name}</span>
                                                                    <span className="text-muted-foreground text-xs">
                                                                        {item.sku} · {item.category}
                                                                    </span>
                                                                </span>
                                                                <span className="font-medium tabular-nums">
                                                                    {formatCurrency(item.price, currency)}
                                                                </span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </CardHeader>
                                <CardContent className="space-y-0 p-0">
                                    {!selectedStudent ? (
                                        <div className="bg-muted/20 flex min-h-48 flex-col items-center justify-center p-8 text-center">
                                            <span className="bg-background mb-4 flex size-12 items-center justify-center rounded-xl shadow-sm">
                                                <UserRound className="text-muted-foreground size-5" />
                                            </span>
                                            <p className="font-semibold">Select a student first</p>
                                            <p className="text-muted-foreground mt-1 max-w-sm text-sm text-pretty">
                                                The student’s open tuition balances will appear here automatically.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-muted-foreground bg-muted/40 hidden grid-cols-[minmax(0,1fr)_110px_220px_40px] gap-3 border-b px-4 py-2 text-[11px] font-semibold tracking-wide uppercase sm:grid">
                                                <span>Description</span>
                                                <span>Category</span>
                                                <span className="text-right">Amount</span>
                                                <span />
                                            </div>
                                            <div className="grid gap-3 border-b px-4 py-3 sm:grid-cols-[minmax(0,1fr)_110px_220px_40px] sm:items-center">
                                                <div className="space-y-2">
                                                    <Label htmlFor="tuition-select" className="sr-only">
                                                        Tuition enrollment
                                                    </Label>
                                                    <Select value={selectedTuitionId} onValueChange={handleTuitionChange}>
                                                        <SelectTrigger id="tuition-select" className="bg-background h-10">
                                                            <SelectValue placeholder="Choose an open balance" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">No tuition payment</SelectItem>
                                                            {selectedStudent.unpaid_enrollments.map((enrollment) => (
                                                                <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                                                                    SY {enrollment.school_year} · {enrollment.semester === 1 ? "1st" : "2nd"} semester
                                                                    · {formatCurrency(enrollment.balance, currency)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Badge variant="outline" className="w-fit font-normal">
                                                    Tuition
                                                </Badge>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <Label htmlFor="tuition-amount">Amount</Label>
                                                        {selectedEnrollment && (
                                                            <button
                                                                type="button"
                                                                onClick={applyFullBalance}
                                                                className="text-primary min-h-10 px-1 text-xs font-semibold underline-offset-4 hover:underline"
                                                            >
                                                                Use full balance
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold">
                                                            {currencySymbol}
                                                        </span>
                                                        <Input
                                                            id="tuition-amount"
                                                            type="number"
                                                            min="0"
                                                            max={selectedEnrollment?.balance}
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={tuitionAmount}
                                                            onChange={(event) => setTuitionAmount(event.target.value)}
                                                            disabled={!selectedEnrollment}
                                                            className="h-10 pl-8 text-right font-semibold tabular-nums"
                                                        />
                                                    </div>
                                                </div>
                                                <span />
                                            </div>
                                            {otherItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="grid gap-3 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_110px_220px_40px] sm:items-center"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold">{item.label}</p>
                                                        <p className="text-muted-foreground mt-0.5 text-xs capitalize">
                                                            {item.type === "fee" ? "School fee" : "Inventory item"}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary" className="w-fit font-normal">
                                                        {item.type === "fee" ? "Fee" : "Item"}
                                                    </Badge>
                                                    <div className="relative">
                                                        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold">
                                                            {currencySymbol}
                                                        </span>
                                                        <Input
                                                            aria-label={`${item.label} amount`}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.amount}
                                                            onChange={(event) =>
                                                                setOtherItems((currentItems) =>
                                                                    currentItems.map((currentItem) =>
                                                                        currentItem.id === item.id
                                                                            ? { ...currentItem, amount: event.target.value }
                                                                            : currentItem,
                                                                    ),
                                                                )
                                                            }
                                                            className="h-10 pl-8 text-right font-semibold tabular-nums"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Remove ${item.label}`}
                                                        onClick={() =>
                                                            setOtherItems((currentItems) =>
                                                                currentItems.filter((currentItem) => currentItem.id !== item.id),
                                                            )
                                                        }
                                                        className="text-muted-foreground hover:text-destructive size-10 active:scale-[0.96]"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {selectedTuitionId === "none" && otherItems.length === 0 && (
                                                <div className="p-8 text-center">
                                                    <CircleDollarSign className="text-muted-foreground/50 mx-auto size-7" />
                                                    <p className="mt-3 text-sm font-medium">No charges added yet</p>
                                                    <p className="text-muted-foreground mt-1 text-xs">Choose tuition above or add another charge.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl shadow-xs">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <WalletCards className="text-primary size-5" />
                                        Collection details
                                    </CardTitle>
                                    <CardDescription>Capture the channel and the reference needed for reconciliation.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-method">Payment method</Label>
                                        <Select
                                            value={paymentMethod}
                                            onValueChange={(value) => {
                                                setPaymentMethod(value);
                                                setCashReceived("");
                                            }}
                                        >
                                            <SelectTrigger id="payment-method" className="h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_METHODS.map((method) => (
                                                    <SelectItem key={method} value={method}>
                                                        {method}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reference-number">
                                            Reference number <span className="text-muted-foreground font-normal">(optional)</span>
                                        </Label>
                                        <Input
                                            id="reference-number"
                                            value={referenceNumber}
                                            onChange={(event) => setReferenceNumber(event.target.value)}
                                            placeholder={paymentMethod === "Cash" ? "Official receipt / reference" : "Required by your office policy"}
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="remarks">
                                            Remarks <span className="text-muted-foreground font-normal">(optional)</span>
                                        </Label>
                                        <Textarea
                                            id="remarks"
                                            value={remarks}
                                            onChange={(event) => setRemarks(event.target.value)}
                                            placeholder="Add a short reconciliation note…"
                                            className="min-h-20 resize-none"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        <aside>
                            <Card className="overflow-hidden rounded-xl shadow-xs">
                                <CardHeader className="bg-muted/30 border-b">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <CardDescription>Payment summary</CardDescription>
                                            <CardTitle className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                                                {formatCurrency(totalAmount, currency)}
                                            </CardTitle>
                                        </div>
                                        <Badge variant={canSubmit ? "default" : "secondary"}>{canSubmit ? "Ready to record" : "Incomplete"}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)_220px] lg:items-end">
                                    {paymentMethod === "Cash" && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="cash-received">Cash received</Label>
                                                {totalAmount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCashReceived(totalAmount.toFixed(2))}
                                                        className="text-primary min-h-10 px-1 text-xs font-semibold hover:underline"
                                                    >
                                                        Exact amount
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg font-bold">
                                                    {currencySymbol}
                                                </span>
                                                <Input
                                                    id="cash-received"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    inputMode="decimal"
                                                    value={cashReceived}
                                                    onChange={(event) => setCashReceived(event.target.value)}
                                                    placeholder="0.00"
                                                    className="h-12 pl-9 text-right text-xl font-bold tabular-nums"
                                                />
                                            </div>
                                            <div className={isCashShort ? "bg-destructive/10 rounded-xl p-3" : "rounded-xl bg-emerald-500/10 p-3"}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span
                                                        className={
                                                            isCashShort
                                                                ? "text-destructive text-sm font-medium"
                                                                : "text-sm font-medium text-emerald-700 dark:text-emerald-300"
                                                        }
                                                    >
                                                        {isCashShort ? "Still needed" : "Change due"}
                                                    </span>
                                                    <span
                                                        className={
                                                            isCashShort
                                                                ? "text-destructive font-bold tabular-nums"
                                                                : "font-bold text-emerald-700 tabular-nums dark:text-emerald-300"
                                                        }
                                                    >
                                                        {formatCurrency(isCashShort ? totalAmount - receivedAmount : changeDue, currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Payer</span>
                                            <span className="max-w-[220px] truncate font-medium">{selectedStudent?.full_name || "Not selected"}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Charges</span>
                                            <span className="font-medium tabular-nums">
                                                {(selectedTuitionId !== "none" && Number.parseFloat(tuitionAmount) > 0 ? 1 : 0) +
                                                    otherItems.filter((item) => Number.parseFloat(item.amount) > 0).length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Method</span>
                                            <Badge variant="secondary">{paymentMethod}</Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Button type="submit" size="lg" disabled={!canSubmit} className="h-11 w-full active:scale-[0.96]">
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    Recording…
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="size-4" />
                                                    Record payment
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-muted-foreground mt-2 text-center text-xs text-pretty">
                                            Posts immediately and opens the receipt.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </form>
                <aside
                    className={cn(
                        "bg-background flex min-h-0 flex-col overflow-hidden border shadow-lg",
                        historyOpen && selectedStudent
                            ? "fixed inset-0 z-50 h-dvh xl:sticky xl:top-4 xl:z-auto xl:h-[calc(100vh-2rem)] xl:rounded-xl"
                            : "hidden",
                    )}
                >
                    <div className="border-b px-5 py-4 pr-14">
                        <div className="flex items-start gap-3">
                            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                                <History className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="truncate font-semibold">{selectedStudent?.full_name || "Student history"}</h2>
                                <p className="text-muted-foreground text-sm">
                                    {selectedStudent
                                        ? `${selectedStudent.student_id} · ${selectedStudent.course} · Year ${selectedStudent.year_level}`
                                        : "Transaction history"}
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Close transaction history"
                            onClick={() => setHistoryOpen(false)}
                            className="absolute top-3 right-3 size-10 active:scale-[0.96]"
                        >
                            <PanelRightClose className="size-4" />
                        </Button>
                    </div>

                    <div className="bg-muted/25 grid grid-cols-2 border-b">
                        <div className="border-r px-5 py-3">
                            <p className="text-muted-foreground text-xs">Transactions</p>
                            <p className="mt-0.5 font-semibold tabular-nums">{transactionHistory.summary.count}</p>
                        </div>
                        <div className="px-5 py-3">
                            <p className="text-muted-foreground text-xs">Total paid</p>
                            <p className="mt-0.5 font-semibold tabular-nums">{formatCurrency(transactionHistory.summary.total_paid, currency)}</p>
                        </div>
                    </div>

                    <div className="border-b p-4">
                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                value={historySearch}
                                onChange={(event) => setHistorySearch(event.target.value)}
                                placeholder="Search receipt, date, method, cashier, or remarks…"
                                className="h-10 pl-9"
                            />
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {historyLoading ? (
                            <div className="text-muted-foreground flex h-48 items-center justify-center gap-2 text-sm">
                                <Loader2 className="size-4 animate-spin" />
                                Loading transaction history…
                            </div>
                        ) : filteredTransactionHistory.length === 0 ? (
                            <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
                                <ReceiptText className="text-muted-foreground/40 size-7" />
                                <p className="mt-3 text-sm font-medium">{historySearch ? "No matching transactions" : "No payment history yet"}</p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {historySearch
                                        ? "Try a different receipt, date, or keyword."
                                        : "The student’s first recorded payment will appear here."}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredTransactionHistory.map((transaction) => (
                                    <article key={transaction.id} className="space-y-3 px-5 py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-mono text-sm font-semibold">
                                                        #{transaction.transaction_number || transaction.id}
                                                    </p>
                                                    <Badge variant={transaction.status === "paid" ? "default" : "secondary"} className="capitalize">
                                                        {transaction.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    {transaction.date || "Date unavailable"} · {transaction.time || "Time unavailable"}
                                                </p>
                                            </div>
                                            <p className="font-bold tabular-nums">{formatCurrency(transaction.amount, currency)}</p>
                                        </div>
                                        <div className="bg-muted/35 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg p-3 text-xs">
                                            <div>
                                                <p className="text-muted-foreground">Method</p>
                                                <p className="mt-0.5 font-medium">{transaction.payment_method || "Unspecified"}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Cashier</p>
                                                <p className="mt-0.5 truncate font-medium">{transaction.cashier}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Reference</p>
                                                <p className="mt-0.5 font-medium">{transaction.reference_number || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Remarks</p>
                                                <p className="mt-0.5 line-clamp-2 font-medium">{transaction.remarks || "—"}</p>
                                            </div>
                                        </div>
                                        {Object.keys(transaction.settlements).length > 0 && (
                                            <div className="space-y-1.5">
                                                {Object.entries(transaction.settlements).map(([key, amount]) => (
                                                    <div key={key} className="flex items-center justify-between gap-3 text-xs">
                                                        <span className="text-muted-foreground">{formatSettlementLabel(key)}</span>
                                                        <span className="font-medium tabular-nums">{formatCurrency(amount, currency)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <Button variant="ghost" size="sm" asChild className="min-h-10 px-2 active:scale-[0.96]">
                                            <Link href={transaction.receipt_url} prefetch>
                                                <ExternalLink data-icon="inline-start" />
                                                Open receipt
                                            </Link>
                                        </Button>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </AdminLayout>
    );
}
