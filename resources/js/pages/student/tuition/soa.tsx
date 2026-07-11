import { show, store } from "@/actions/App/Http/Controllers/StatementOfAccountIssuanceController";
import { Button } from "@/components/ui/button";
import { index as tuitionIndex } from "@/routes/student/tuition";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Download, FileCheck2, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Student { id: number; student_no: string; name: string; course: string }
interface Tuition { total_lectures: number; total_laboratory: number; total_tuition: number; total_miscelaneous_fees: number; discount: number; overall_tuition: number; total_paid: number; total_balance: number }
interface Transaction { id: number; date: string; description: string; amount: number; invoice?: string | null; method?: string | null }
interface School { name: string; address: string; logo: string; tagline: string; email: string; phone: string }
interface Issuance { uuid: string; document_number: string; status: "pending" | "ready" | "failed"; issued_at: string; download_url: string | null }
interface Props { student: Student | null; tuition: Tuition | null; transactions: Transaction[]; filters: { semester: number; school_year: string }; school: School; generated_at: string; currency_code: string; error?: string }

const money = (value: number, currency: string) => new Intl.NumberFormat(currency === "PHP" ? "en-PH" : "en-US", { style: "currency", currency }).format(value || 0);

export default function StatementOfAccount({ student, tuition, transactions, filters, school, generated_at, currency_code, error }: Props) {
    const [issuance, setIssuance] = useState<Issuance | null>(null);
    const [isIssuing, setIsIssuing] = useState(false);
    const [issueError, setIssueError] = useState<string | null>(null);
    const paymentTotal = useMemo(() => transactions.reduce((sum, item) => sum + Number(item.amount), 0), [transactions]);
    const semester = filters.semester === 1 ? "First Semester" : "Second Semester";

    useEffect(() => {
        if (!issuance || issuance.status !== "pending") return;
        const timer = window.setInterval(async () => {
            try {
                const response = await axios.get<{ issuance: Issuance }>(show.url(issuance.uuid));
                setIssuance(response.data.issuance);
            } catch {
                window.clearInterval(timer);
                setIssueError("The generation status could not be refreshed. Reload this page to check again.");
            }
        }, 2500);
        return () => window.clearInterval(timer);
    }, [issuance]);

    const generateOfficialPdf = async () => {
        setIsIssuing(true);
        setIssueError(null);
        try {
            const response = await axios.post<{ issuance: Issuance }>(store.url(), { school_year: filters.school_year, semester: filters.semester });
            setIssuance(response.data.issuance);
        } catch {
            setIssueError("The official PDF could not be queued. Please try again.");
        } finally {
            setIsIssuing(false);
        }
    };

    return <>
        <Head title="Statement of Account" />
        <div className="min-h-screen bg-[#d8dee7] px-3 py-5 text-[#182231] sm:px-6 sm:py-8">
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md border border-slate-300 bg-white p-2 shadow-lg print:hidden">
                <Button variant="outline" size="sm" asChild>
                    <Link href={tuitionIndex.url({ query: { school_year: filters.school_year, semester: filters.semester } })}>
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                </Button>
                {issuance?.status === "ready" && issuance.download_url ?
                    <Button size="sm" asChild><a href={issuance.download_url}><Download className="h-4 w-4" /> Download Official PDF</a></Button> :
                    <Button size="sm" onClick={generateOfficialPdf} disabled={isIssuing || issuance?.status === "pending" || !tuition}>
                        {isIssuing || issuance?.status === "pending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                        {issuance?.status === "pending" ? "Generating..." : "Generate Official PDF"}
                    </Button>}
            </div>

            <main className="soa-page relative mx-auto min-h-[11.69in] w-full max-w-[8.27in] overflow-hidden border border-slate-400 bg-white px-[0.55in] py-[0.45in] shadow-2xl print:min-h-0 print:max-w-none print:border-0 print:shadow-none">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden print:hidden">
                    <span className="-rotate-45 text-[58px] font-bold tracking-[0.14em] text-slate-900/[0.035]">PREVIEW</span>
                </div>
                <header className="relative grid grid-cols-[74px_1fr_74px] items-center border-b-[3px] border-[#1c3557] pb-4 text-center">
                    <img src={school.logo} alt={`${school.name} logo`} className="h-[66px] w-[66px] object-contain" />
                    <div>
                        <p className="text-[8px] tracking-[0.22em] uppercase">Republic of the Philippines</p>
                        <h1 className="mt-1 font-serif text-[17px] leading-tight font-bold uppercase">{school.name}</h1>
                        <p className="mt-1 text-[9px] text-slate-600">{school.address}</p>
                        {(school.email || school.phone) && <p className="text-[8px] text-slate-500">{[school.email, school.phone].filter(Boolean).join(" • ")}</p>}
                    </div>
                    <ShieldCheck className="mx-auto h-9 w-9 text-[#1c3557]" />
                </header>

                <section className="relative mt-5 text-center">
                    <p className="text-[8px] font-semibold tracking-[0.2em] text-[#9a6b1f] uppercase">Office of Finance</p>
                    <h2 className="mt-1 font-serif text-[21px] font-bold tracking-[0.12em] uppercase">Statement of Account</h2>
                    <p className="mt-1 text-[8px] text-slate-500">FINANCIAL RECORD • PREVIEW COPY</p>
                </section>

                <section className="relative mt-5 grid grid-cols-2 border-y border-slate-300 py-2 text-[9px]">
                    <div><span className="text-slate-500 uppercase">Academic term</span><p className="font-semibold">{semester}, A.Y. {filters.school_year}</p></div>
                    <div className="text-right"><span className="text-slate-500 uppercase">Prepared on</span><p className="font-semibold">{generated_at}</p></div>
                </section>

                {error ? <div className="relative mt-8 border border-red-300 bg-red-50 p-5 text-center text-sm text-red-800">{error}</div> : <>
                    <section className="relative mt-4 grid grid-cols-12 border border-slate-400 text-[10px]">
                        <Label>Student number</Label><Value className="col-span-3">{student?.student_no}</Value>
                        <Label>Student name</Label><Value className="col-span-5">{student?.name}</Value>
                        <Label>Program</Label><Value className="col-span-9">{student?.course}</Value>
                    </section>

                    {tuition ? <>
                        <section className="relative mt-5 grid grid-cols-5 gap-5">
                            <div className="col-span-3"><SectionTitle>Assessment breakdown</SectionTitle><table className="official-table"><tbody>
                                <AmountRow label="Lecture fees" value={tuition.total_lectures} currency={currency_code} />
                                <AmountRow label="Laboratory fees" value={tuition.total_laboratory} currency={currency_code} />
                                <AmountRow label="Tuition subtotal" value={tuition.total_tuition} currency={currency_code} strong />
                                <AmountRow label="Miscellaneous fees" value={tuition.total_miscelaneous_fees} currency={currency_code} />
                                <AmountRow label="Total assessment" value={tuition.overall_tuition} currency={currency_code} total />
                            </tbody></table></div>
                            <div className="col-span-2"><SectionTitle>Account summary</SectionTitle>
                                <div className="border border-[#1c3557]">
                                    <Summary label="Assessment" value={money(tuition.overall_tuition, currency_code)} />
                                    <Summary label="Payments" value={money(tuition.total_paid, currency_code)} />
                                    <div className="bg-[#1c3557] px-3 py-3 text-white"><p className="text-[8px] tracking-wider uppercase">Balance due</p><p className="mt-1 font-mono text-[17px] font-bold">{money(tuition.total_balance, currency_code)}</p></div>
                                </div>
                                <div className={`mt-2 border px-2 py-2 text-center text-[8px] font-bold tracking-wide uppercase ${tuition.total_balance > 0 ? "border-amber-500 bg-amber-50 text-amber-900" : "border-emerald-500 bg-emerald-50 text-emerald-900"}`}>{tuition.total_balance > 0 ? "Outstanding balance" : "Account settled"}</div>
                            </div>
                        </section>

                        <section className="relative mt-5"><SectionTitle>Official payment history</SectionTitle><table className="official-table text-[9px]"><thead><tr><th>Date</th><th>Official receipt</th><th>Particulars</th><th className="text-right">Amount</th></tr></thead><tbody>
                            {transactions.length ? transactions.map(item => <tr key={item.id}><td>{item.date}</td><td>{item.invoice || "—"}</td><td>{item.description}</td><td className="text-right font-mono">{money(item.amount, currency_code)}</td></tr>) : <tr><td colSpan={4} className="py-5 text-center text-slate-500">No recorded payments for this term.</td></tr>}
                        </tbody><tfoot><tr><td colSpan={3} className="font-bold uppercase">Recorded payment total</td><td className="text-right font-mono font-bold">{money(paymentTotal, currency_code)}</td></tr></tfoot></table></section>
                    </> : <div className="relative mt-6 border border-slate-300 p-6 text-center text-sm">No assessment record was found for this academic term.</div>}
                </>}

                <section className="relative mt-6 border-t border-slate-300 pt-3 text-[8px] leading-relaxed text-slate-600"><strong className="text-slate-800 uppercase">Certification.</strong> This preview reflects the financial records available at the date shown. Only a server-generated PDF carrying a document number and verifiable QR code is an official school record.</section>
                <section className="relative mt-10 grid grid-cols-3 gap-8 text-center text-[8px]"><Signature label="Prepared by" role="Finance Staff" /><Signature label="Verified by" role="Accounting Officer" /><Signature label="Received by" role="Student / Representative" /></section>

                {issuance && <div className="relative mt-5 flex items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-2 text-[9px] print:hidden">{issuance.status === "ready" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Loader2 className="h-4 w-4 animate-spin text-[#1c3557]" />}<span><strong>{issuance.document_number}</strong> — {issuance.status === "ready" ? "Official PDF ready for download." : "Secure PDF generation in progress."}</span></div>}
                {issueError && <p className="relative mt-3 text-center text-xs text-red-700 print:hidden">{issueError}</p>}
            </main>
        </div>
        <style>{`@page{size:A4;margin:0}.official-table{width:100%;border-collapse:collapse}.official-table td,.official-table th{border:1px solid #94a3b8;padding:6px 8px}.official-table th{background:#eef2f6;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:.04em}@media print{body{background:white}.soa-page{padding:.45in .55in}.print\\:hidden{display:none!important}}`}</style>
    </>;
}

function Label({ children }: { children: React.ReactNode }) { return <div className="col-span-3 border-r border-b border-slate-400 bg-slate-100 px-2 py-2 font-bold uppercase">{children}</div> }
function Value({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <div className={`border-b border-slate-400 px-2 py-2 ${className}`}>{children}</div> }
function SectionTitle({ children }: { children: React.ReactNode }) { return <h3 className="mb-2 border-l-4 border-[#9a6b1f] pl-2 text-[10px] font-bold tracking-[0.08em] uppercase">{children}</h3> }
function AmountRow({ label, value, currency, strong, total }: { label: string; value: number; currency: string; strong?: boolean; total?: boolean }) { return <tr className={total ? "bg-[#e8edf3] font-bold" : strong ? "bg-slate-50 font-semibold" : ""}><td>{label}</td><td className="text-right font-mono">{money(value, currency)}</td></tr> }
function Summary({ label, value }: { label: string; value: string }) { return <div className="flex justify-between border-b border-slate-300 px-3 py-2 text-[9px]"><span>{label}</span><strong className="font-mono">{value}</strong></div> }
function Signature({ label, role }: { label: string; role: string }) { return <div><div className="h-8 border-b border-slate-700" /><p className="mt-1 font-bold uppercase">{label}</p><p className="text-slate-500">{role}</p></div> }
