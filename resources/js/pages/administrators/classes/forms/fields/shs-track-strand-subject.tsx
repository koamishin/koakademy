import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { route } from "ziggy-js";
import type { EntityOption, ShsSubjectOption, ValueOption } from "../../lib/class-defaults";

type ShsTrackStrandSubjectProps = {
    tracks: EntityOption[];
    gradeLevels: ValueOption[];
    trackId: number | null;
    strandId: number | null;
    subjectCode: string;
    gradeLevel: string;
    onTrackChange: (trackId: number | null) => void;
    onStrandChange: (strandId: number | null) => void;
    onSubjectCodeChange: (subjectCode: string) => void;
    onGradeLevelChange: (gradeLevel: string) => void;
};

type OptionsResponse<T> = { data: T[] };

function isEntityOption(value: unknown): value is EntityOption {
    return typeof value === "object" && value !== null && "id" in value && "label" in value;
}

function isShsSubjectOption(value: unknown): value is ShsSubjectOption {
    return typeof value === "object" && value !== null && "code" in value && "label" in value;
}

async function fetchOptionData<T>(url: string, guard: (value: unknown) => value is T): Promise<T[]> {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const payload = (await response.json()) as Partial<OptionsResponse<unknown>>;
    const rows = Array.isArray(payload.data) ? payload.data : [];

    return rows.filter(guard);
}

export function ShsTrackStrandSubject({
    tracks,
    gradeLevels,
    trackId,
    strandId,
    subjectCode,
    gradeLevel,
    onTrackChange,
    onStrandChange,
    onSubjectCodeChange,
    onGradeLevelChange,
}: ShsTrackStrandSubjectProps): ReactNode {
    const [strands, setStrands] = useState<EntityOption[]>([]);
    const [subjects, setSubjects] = useState<ShsSubjectOption[]>([]);
    const [loadingStrands, setLoadingStrands] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    useEffect(() => {
        if (!trackId) {
            setStrands([]);
            return;
        }

        setLoadingStrands(true);
        fetchOptionData<EntityOption>(route("administrators.classes.options.shs-strands", { track_id: trackId }), isEntityOption)
            .then(setStrands)
            .finally(() => setLoadingStrands(false));
    }, [trackId]);

    useEffect(() => {
        if (!strandId) {
            setSubjects([]);
            return;
        }

        setLoadingSubjects(true);
        fetchOptionData<ShsSubjectOption>(route("administrators.classes.options.shs-subjects", { strand_id: strandId }), isShsSubjectOption)
            .then(setSubjects)
            .finally(() => setLoadingSubjects(false));
    }, [strandId]);

    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
                <Label>SHS Track</Label>
                <Select
                    value={trackId ? String(trackId) : ""}
                    onValueChange={(value) => {
                        onTrackChange(Number(value));
                        onStrandChange(null);
                        onSubjectCodeChange("");
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a track" />
                    </SelectTrigger>
                    <SelectContent>
                        {tracks.map((track) => (
                            <SelectItem key={track.id} value={String(track.id)}>
                                {track.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>SHS Strand</Label>
                <Select
                    value={strandId ? String(strandId) : ""}
                    onValueChange={(value) => {
                        onStrandChange(Number(value));
                        onSubjectCodeChange("");
                    }}
                    disabled={!trackId || loadingStrands}
                >
                    <SelectTrigger className="w-full">
                        {loadingStrands ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading strands</span> : <SelectValue placeholder="Choose a strand" />}
                    </SelectTrigger>
                    <SelectContent>
                        {strands.map((strand) => (
                            <SelectItem key={strand.id} value={String(strand.id)}>
                                {strand.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>SHS Subject</Label>
                <Select value={subjectCode} onValueChange={onSubjectCodeChange} disabled={!strandId || loadingSubjects}>
                    <SelectTrigger className="w-full">
                        {loadingSubjects ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading subjects</span> : <SelectValue placeholder="Choose a subject" />}
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((subject) => (
                            <SelectItem key={subject.code} value={subject.code}>
                                {subject.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Grade level</Label>
                <Select value={gradeLevel} onValueChange={onGradeLevelChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a grade level" />
                    </SelectTrigger>
                    <SelectContent>
                        {gradeLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                                {level.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
