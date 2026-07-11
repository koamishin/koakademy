<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\StatementOfAccountIssuance;
use App\Services\StatementOfAccountService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class StatementOfAccountVerificationController extends Controller
{
    public function __invoke(Request $request, string $token, StatementOfAccountService $service): Response
    {
        $issuance = StatementOfAccountIssuance::query()
            ->where('verification_token_hash', hash('sha256', $token))
            ->first();

        if (! $issuance) {
            return Inertia::render('student/tuition/verify-soa', ['status' => 'invalid']);
        }

        $integrityValid = $service->hasValidIntegrity($issuance);
        $snapshot = $issuance->snapshot;

        return Inertia::render('student/tuition/verify-soa', [
            'status' => ! $integrityValid ? 'integrity_failed' : ($issuance->revoked_at ? 'revoked' : 'valid'),
            'document' => [
                'document_number' => $issuance->document_number,
                'student' => $this->maskName((string) data_get($snapshot, 'student.name', '')),
                'student_number' => $this->maskNumber((string) data_get($snapshot, 'student.student_no', '')),
                'term' => sprintf('%s Semester, A.Y. %s', data_get($snapshot, 'filters.semester') === 1 ? '1st' : '2nd', data_get($snapshot, 'filters.school_year')),
                'assessment' => (float) data_get($snapshot, 'tuition.overall_tuition', 0),
                'payments' => (float) data_get($snapshot, 'tuition.total_paid', 0),
                'balance' => (float) data_get($snapshot, 'tuition.total_balance', 0),
                'currency' => data_get($snapshot, 'currency_code', 'PHP'),
                'issued_at' => $issuance->issued_at?->format('F d, Y h:i A'),
                'school' => data_get($snapshot, 'school.name', ''),
            ],
        ]);
    }

    private function maskName(string $name): string
    {
        return collect(preg_split('/\s+/', mb_trim($name)) ?: [])
            ->map(fn (string $part): string => mb_substr($part, 0, 1).str_repeat('*', max(2, mb_strlen($part) - 1)))
            ->implode(' ');
    }

    private function maskNumber(string $number): string
    {
        return mb_strlen($number) <= 4 ? str_repeat('*', mb_strlen($number)) : mb_substr($number, 0, 2).str_repeat('*', mb_strlen($number) - 4).mb_substr($number, -2);
    }
}
