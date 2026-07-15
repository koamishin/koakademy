<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('enrollment_policies')->where('scope_key', $this->globalScopeKey())->exists()) {
            return;
        }

        $settings = DB::table('general_settings')->orderBy('id')->first();
        $moreConfigs = $this->decode($settings?->more_configs ?? null);
        $legacy = data_get($moreConfigs, 'enrollment_pipeline', []);
        $configuration = $this->configuration(is_array($legacy) ? $legacy : [], (bool) ($settings?->online_enrollment_enabled ?? false), $settings?->enrollment_courses ?? null);
        $now = now();

        DB::transaction(function () use ($configuration, $now): void {
            $configuration = $this->migrateRolePermissions($configuration, $now);
            $policyId = DB::table('enrollment_policies')->insertGetId([
                'name' => 'Global enrollment policy (migrated)',
                'scope_key' => $this->globalScopeKey(),
                'is_enabled' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $encoded = json_encode($configuration, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            $versionId = DB::table('enrollment_policy_versions')->insertGetId([
                'enrollment_policy_id' => $policyId,
                'version' => 1,
                'state' => 'published',
                'schema_version' => 1,
                'configuration' => $encoded,
                'checksum' => hash('sha256', $encoded),
                'change_notes' => 'Imported from general_settings.more_configs.enrollment_pipeline.',
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('enrollment_policies')->where('id', $policyId)->update(['active_version_id' => $versionId]);

            $snapshotChecksum = hash('sha256', $encoded.'|'.$versionId);
            $snapshotId = DB::table('enrollment_policy_snapshots')->insertGetId([
                'schema_version' => 1,
                'checksum' => $snapshotChecksum,
                'configuration' => $encoded,
                'source_version_ids' => json_encode([$versionId], JSON_THROW_ON_ERROR),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->backfillEnrollments($snapshotId, $configuration, $now);
        });
    }

    public function down(): void
    {
        // Data is intentionally retained: published versions and enrollment snapshots are historical records.
    }

    /** @return array<string, mixed> */
    private function configuration(array $legacy, bool $onlineEnabled, mixed $courseIds): array
    {
        $legacySteps = is_array($legacy['steps'] ?? null) ? $legacy['steps'] : [];
        if ($legacySteps === []) {
            $legacySteps = [
                ['key' => 'submitted', 'status' => 'Pending', 'label' => 'Submitted', 'action_type' => 'standard', 'next_step_key' => 'academic_verified'],
                ['key' => 'academic_verified', 'status' => 'Verified By Dept Head', 'label' => 'Academic verification', 'action_type' => 'department_verification', 'next_step_key' => 'completed'],
                ['key' => 'completed', 'status' => 'Verified By Cashier', 'label' => 'Completed', 'action_type' => 'cashier_verification', 'next_step_key' => null],
            ];
        }

        $entryKey = (string) ($legacy['entry_step_key'] ?? $legacySteps[0]['key']);
        $completionKey = (string) ($legacy['completion_step_key'] ?? $legacySteps[array_key_last($legacySteps)]['key']);
        $steps = [];

        foreach ($legacySteps as $index => $step) {
            $key = (string) ($step['key'] ?? 'step_'.($index + 1));
            $status = (string) ($step['status'] ?? $step['label'] ?? $key);
            $terminal = $key === $completionKey;
            $nextKey = $step['next_step_key'] ?? ($legacySteps[$index + 1]['key'] ?? null);
            $actions = [];
            if ($key !== $entryKey) {
                $actions[] = [
                    'key' => 'status_'.$key,
                    'handler' => match ($step['action_type'] ?? 'standard') {
                        'department_verification' => 'enrollment.verify_academic',
                        'cashier_verification' => 'enrollment.verify_payment',
                        default => 'enrollment.change_status',
                    },
                    'configuration' => ['status' => $status],
                ];
            }
            if ($terminal) {
                $actions[] = ['key' => 'terminal_outcome', 'handler' => 'enrollment.set_outcome', 'configuration' => ['outcome' => 'completed']];
            }

            $steps[] = [
                'key' => $key,
                'label' => (string) ($step['label'] ?? $status),
                'status' => $status,
                'permission' => 'Update:StudentEnrollment',
                'entry' => $key === $entryKey,
                'terminal' => $terminal,
                'outcome' => $terminal ? 'completed' : null,
                'actions' => $actions,
                'transitions' => $terminal || ! is_string($nextKey) || $nextKey === '' ? [] : [[
                    'key' => 'to_'.$nextKey,
                    'label' => 'Continue',
                    'to' => $nextKey,
                    'fallback' => true,
                    'conditions' => [],
                ]],
                'legacy_allowed_roles' => array_values($step['allowed_roles'] ?? []),
            ];
        }

        $rules = [[
            'key' => 'enrollment_channels',
            'handler' => 'availability.channel',
            'configuration' => ['allowed' => $onlineEnabled ? ['public', 'administrator', 'continuing'] : ['administrator', 'continuing']],
        ], [
            'key' => 'duplicate_period',
            'handler' => 'eligibility.duplicate_enrollment',
            'configuration' => [],
        ]];

        $courses = $this->decode($courseIds);
        if (is_array($courses) && $courses !== []) {
            $rules[] = ['key' => 'allowed_programs', 'handler' => 'eligibility.program', 'configuration' => ['allowed' => array_values($courses)]];
        }

        return [
            'schema_version' => 1,
            'rules' => $rules,
            'requirements' => [],
            'assignment' => ['strategy' => 'assignment.manual', 'configuration' => []],
            'billing' => ['strategy' => 'billing.course_rate', 'configuration' => ['minimum_payment' => ['type' => 'none']], 'allowed_payment_methods' => []],
            'workflow' => ['steps' => $steps],
            'notifications' => [],
            'compatibility' => ['source' => 'general_settings.more_configs.enrollment_pipeline', 'read_only_until' => 'next_release'],
        ];
    }

    /** @param array<string, mixed> $configuration */
    private function backfillEnrollments(int $snapshotId, array $configuration, mixed $now): void
    {
        $stepsByStatus = collect($configuration['workflow']['steps'])->keyBy('status');
        $entryKey = collect($configuration['workflow']['steps'])->firstWhere('entry', true)['key'];
        $terminalKey = collect($configuration['workflow']['steps'])->firstWhere('terminal', true)['key'];
        $seenDeduplicationKeys = [];

        DB::table('student_enrollment')->orderBy('id')->select([
            'id', 'student_id', 'school_id', 'school_year', 'semester', 'status',
        ])->each(function (object $enrollment) use ($snapshotId, $stepsByStatus, $entryKey, $terminalKey, &$seenDeduplicationKeys, $now): void {
            $step = $stepsByStatus->get($enrollment->status);
            $stepKey = $step['key'] ?? match ($enrollment->status) {
                'Pending' => $entryKey,
                'Verified By Dept Head' => 'academic_verified',
                'Verified By Cashier', 'enrolled' => $terminalKey,
                default => null,
            };
            $terminalOutcome = in_array($enrollment->status, ['Verified By Cashier', 'enrolled'], true) ? 'completed' : null;
            $deduplicationKey = hash('sha256', implode('|', [
                (string) $enrollment->student_id,
                (string) $enrollment->school_id,
                (string) $enrollment->school_year,
                (string) $enrollment->semester,
            ]));
            $isDuplicate = isset($seenDeduplicationKeys[$deduplicationKey]);
            $seenDeduplicationKeys[$deduplicationKey] = true;

            DB::table('student_enrollment')->where('id', $enrollment->id)->update([
                'enrollment_policy_snapshot_id' => $snapshotId,
                'current_step_key' => $stepKey,
                'terminal_outcome' => $terminalOutcome,
                'deduplication_key' => $isDuplicate ? null : $deduplicationKey,
            ]);

            if ($stepKey === null || $isDuplicate) {
                DB::table('enrollment_workflow_events')->insert([
                    'student_enrollment_id' => $enrollment->id,
                    'enrollment_policy_snapshot_id' => $snapshotId,
                    'event_type' => 'migration_warning',
                    'from_step_key' => $stepKey,
                    'status' => $enrollment->status,
                    'reason' => $isDuplicate
                        ? 'Duplicate enrollment period retained; canonical deduplication key assigned to the earliest record.'
                        : 'Unknown legacy enrollment status requires manual workflow mapping.',
                    'result' => json_encode(['legacy_status' => $enrollment->status, 'duplicate' => $isDuplicate], JSON_THROW_ON_ERROR),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });
    }

    private function globalScopeKey(): string
    {
        return hash('sha256', 'school:*|student_type:*|course:*|school_year:*|semester:*');
    }

    /** @param array<string, mixed> $configuration @return array<string, mixed> */
    private function migrateRolePermissions(array $configuration, mixed $now): array
    {
        $canAssignPermissions = Schema::hasTable('permissions')
            && Schema::hasTable('roles')
            && Schema::hasTable('role_has_permissions');

        foreach ($configuration['workflow']['steps'] as &$step) {
            $roles = $step['legacy_allowed_roles'] ?? [];
            unset($step['legacy_allowed_roles']);

            if (! $canAssignPermissions || ! is_array($roles) || $roles === []) {
                continue;
            }

            $permissionName = 'TransitionEnrollment:'.$step['key'];
            $permissionId = DB::table('permissions')->where('name', $permissionName)->where('guard_name', 'web')->value('id');
            if (! $permissionId) {
                $permissionId = DB::table('permissions')->insertGetId([
                    'name' => $permissionName,
                    'guard_name' => 'web',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('roles')->whereIn('name', $roles)->where('guard_name', 'web')->pluck('id')->each(
                fn (int $roleId) => DB::table('role_has_permissions')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]),
            );
            $step['permission'] = $permissionName;
        }
        unset($step);

        return $configuration;
    }

    private function decode(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        return json_decode($value, true) ?? $value;
    }
};
