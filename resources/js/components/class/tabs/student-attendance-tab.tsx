import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatClassDate } from "@/lib/classroom";
import { CalendarCheck, CheckCircle2, Clock3, UserMinus, UserRoundCheck } from "lucide-react";

interface StudentAttendanceTabProps {
    stats: { present: number; late: number; absent: number; excused: number };
    history: Array<{ id: number; date: string; status: string; remarks: string; topic: string }>;
}

const statusMeta = {
    present: { label: "Present", icon: UserRoundCheck, tone: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300" },
    late: { label: "Late", icon: Clock3, tone: "text-amber-700 bg-amber-500/10 dark:text-amber-300" },
    absent: { label: "Absent", icon: UserMinus, tone: "text-rose-700 bg-rose-500/10 dark:text-rose-300" },
    excused: { label: "Excused", icon: CheckCircle2, tone: "text-blue-700 bg-blue-500/10 dark:text-blue-300" },
};

export function StudentAttendanceTab({ stats, history }: StudentAttendanceTabProps) {
    const total = stats.present + stats.late + stats.absent + stats.excused;
    const rate = total > 0 ? Math.round(((stats.present + stats.late) / total) * 100) : 100;

    return (
        <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="border-border/70 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground text-xs">Attendance rate</p>
                        <p className="text-2xl font-semibold">{rate}%</p>
                    </div>
                    <CalendarCheck className="text-primary size-6" />
                </div>
                <Progress value={rate} className="mt-4 h-2" />
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    {Object.entries(stats).map(([status, value]) => (
                        <div key={status} className="bg-muted/30 rounded-md px-1 py-2">
                            <p className="text-lg font-semibold">{value}</p>
                            <p className="text-muted-foreground truncate text-[10px] capitalize">{status}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="border-border/70 overflow-hidden rounded-lg shadow-sm">
                <div className="border-border/70 border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">Attendance history</h2>
                </div>
                {history.length > 0 ? (
                    <>
                        <div className="divide-border/70 divide-y md:hidden">
                            {history.map((record) => {
                                const meta = statusMeta[record.status as keyof typeof statusMeta] ?? statusMeta.excused;
                                const Icon = meta.icon;
                                return (
                                    <div key={record.id} className="flex items-start gap-3 px-4 py-4">
                                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-md ${meta.tone}`}>
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium">{record.topic || "Class session"}</p>
                                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                                    {meta.label}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground mt-1 text-xs">{formatClassDate(record.date)}</p>
                                            {record.remarks && <p className="text-muted-foreground mt-2 text-sm">{record.remarks}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Topic</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{formatClassDate(record.date)}</TableCell>
                                            <TableCell>{record.topic || "Class session"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {record.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{record.remarks || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <p className="text-muted-foreground px-4 py-10 text-center text-sm">No attendance sessions recorded yet.</p>
                )}
            </Card>
        </div>
    );
}
