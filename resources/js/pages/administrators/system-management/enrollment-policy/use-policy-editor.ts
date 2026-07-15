import { inheritance, updateDraft } from "@/actions/App/Http/Controllers/AdministratorEnrollmentPolicyController";
import type { FormDataConvertible } from "@inertiajs/core";
import { router } from "@inertiajs/react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { blueprintSteps, configurationFingerprint, copy, mergeConfigurations, sectionIsComplete } from "./configuration";
import type { BlueprintStepId, Configuration, HelpTopic, InheritanceResponse, Policy, PolicyVersion, Simulation } from "./types";

export function usePolicyEditor(policies: Policy[]) {
    const [policyId, setPolicyId] = useState<number | null>(policies[0]?.id ?? null);
    const policy = policies.find((item) => item.id === policyId) ?? policies[0] ?? null;
    const version = useMemo(() => policy?.versions.find((item) => item.state === "draft") ?? policy?.active_version ?? null, [policy]);
    const [localConfiguration, setLocalConfiguration] = useState<Configuration>(
        version?.configuration ? copy(version.configuration) : { schema_version: 1 },
    );
    const [baseline, setBaseline] = useState(configurationFingerprint(localConfiguration));
    const [notes, setNotes] = useState(version?.change_notes ?? "");
    const [baselineNotes, setBaselineNotes] = useState(version?.change_notes ?? "");
    const [inheritanceData, setInheritanceData] = useState<InheritanceResponse>({ configuration: null, layers: [], source_map: {} });
    const [loadingInheritance, setLoadingInheritance] = useState(false);
    const [currentStep, setCurrentStep] = useState<BlueprintStepId>("scope");
    const [simulation, setSimulation] = useState<Simulation | null>(null);
    const [helpTopic, setHelpTopic] = useState<HelpTopic | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const next = version?.configuration ? copy(version.configuration) : { schema_version: 1 };
        setLocalConfiguration(next);
        setBaseline(configurationFingerprint(next));
        setNotes(version?.change_notes ?? "");
        setBaselineNotes(version?.change_notes ?? "");
        setSimulation(null);
        setCurrentStep(version?.state === "draft" ? "scope" : "eligibility");
    }, [version?.id]);

    useEffect(() => {
        if (!policy) {
            setInheritanceData({ configuration: null, layers: [], source_map: {} });
            return;
        }

        const controller = new AbortController();
        setLoadingInheritance(true);
        axios
            .get(inheritance.url(policy.id), { signal: controller.signal })
            .then((response) => setInheritanceData(response.data as InheritanceResponse))
            .catch((error) => {
                if (!axios.isCancel(error)) setInheritanceData({ configuration: null, layers: [], source_map: {} });
            })
            .finally(() => setLoadingInheritance(false));

        return () => controller.abort();
    }, [policy?.id, version?.id]);

    const effectiveConfiguration = useMemo(
        () => mergeConfigurations(inheritanceData.configuration, localConfiguration),
        [inheritanceData.configuration, localConfiguration],
    );
    const dirty = configurationFingerprint(localConfiguration) !== baseline || notes !== baselineNotes;
    const completedSteps = blueprintSteps
        .filter((step) => sectionIsComplete(step.id, effectiveConfiguration) || (step.id === "publish" && Boolean(simulation?.checksum)))
        .map((step) => step.id);

    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (!dirty) return;
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const updateConfiguration = useCallback((next: Configuration | ((current: Configuration) => Configuration)) => {
        setLocalConfiguration((current) => (typeof next === "function" ? next(current) : next));
        setSimulation(null);
    }, []);

    const save = useCallback(
        (continueToNext = false) => {
            if (!policy) return;
            const nextStep = blueprintSteps[blueprintSteps.findIndex((step) => step.id === currentStep) + 1]?.id;
            setSaving(true);
            router.put(
                updateDraft.url(policy.id),
                { configuration: localConfiguration as unknown as FormDataConvertible, change_notes: notes },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setBaseline(configurationFingerprint(localConfiguration));
                        setBaselineNotes(notes);
                        if (continueToNext && nextStep) setCurrentStep(nextStep);
                    },
                    onFinish: () => setSaving(false),
                },
            );
        },
        [currentStep, localConfiguration, notes, policy],
    );

    const openHelp = (topic: HelpTopic) => {
        setHelpTopic(topic);
        setHelpOpen(true);
    };

    return {
        policyId,
        setPolicyId,
        policy,
        version: version as PolicyVersion | null,
        localConfiguration,
        effectiveConfiguration,
        updateConfiguration,
        inheritanceData,
        loadingInheritance,
        notes,
        setNotes,
        dirty,
        saving,
        save,
        currentStep,
        setCurrentStep,
        completedSteps,
        simulation,
        setSimulation,
        helpTopic,
        helpOpen,
        setHelpOpen,
        openHelp,
    };
}
