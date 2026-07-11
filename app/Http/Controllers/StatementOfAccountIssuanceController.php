<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Jobs\GenerateStudentSoaPdfJob;
use App\Models\StatementOfAccountIssuance;
use App\Models\Student;
use App\Services\GeneralSettingsService;
use App\Services\StatementOfAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class StatementOfAccountIssuanceController extends Controller
{
    public function store(Request $request, StatementOfAccountService $service, GeneralSettingsService $settings): JsonResponse
    {
        $validated = $request->validate([
            'school_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'integer', Rule::in([1, 2])],
        ]);
        $student = $this->studentFor($request);
        $result = $service->issue($student, $request->user(), $validated['school_year'], (int) $validated['semester']);
        $issuance = $result['issuance'];
        $filename = mb_strtolower($issuance->document_number).'.pdf';

        GenerateStudentSoaPdfJob::dispatchSync(
            $result['view_data'],
            $filename,
            (int) $request->user()->id,
            $issuance->id,
        );

        $issuance->refresh();

        return response()->json([
            'message' => 'Your official statement is ready to download.',
            'issuance' => $this->resource($issuance),
        ]);
    }

    public function show(Request $request, StatementOfAccountIssuance $issuance): JsonResponse
    {
        $this->authorizeOwnership($request, $issuance);

        return response()->json(['issuance' => $this->resource($issuance->fresh())]);
    }

    public function download(Request $request, StatementOfAccountIssuance $issuance): StreamedResponse
    {
        $this->authorizeOwnership($request, $issuance);
        abort_unless($issuance->status === 'ready' && $issuance->disk && $issuance->pdf_path, 404);
        abort_unless(Storage::disk($issuance->disk)->exists($issuance->pdf_path), 404);

        return Storage::disk($issuance->disk)->download($issuance->pdf_path, mb_strtolower($issuance->document_number).'.pdf');
    }

    private function studentFor(Request $request): Student
    {
        $user = $request->user();

        return Student::query()
            ->where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->firstOrFail();
    }

    private function authorizeOwnership(Request $request, StatementOfAccountIssuance $issuance): void
    {
        abort_unless($this->studentFor($request)->is($issuance->student), 403);
    }

    /** @return array<string, mixed> */
    private function resource(StatementOfAccountIssuance $issuance): array
    {
        return [
            'uuid' => $issuance->uuid,
            'document_number' => $issuance->document_number,
            'status' => $issuance->status,
            'issued_at' => $issuance->issued_at?->format('F d, Y h:i A'),
            'download_url' => $issuance->status === 'ready' ? route('student.tuition.soa.issuances.download', $issuance) : null,
        ];
    }
}
