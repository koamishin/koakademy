<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Override;

final class StatementOfAccountIssuance extends Model
{
    /** @use HasFactory<\Database\Factories\StatementOfAccountIssuanceFactory> */
    use HasFactory;

    #[Override]
    protected $fillable = [
        'uuid', 'student_id', 'enrollment_id', 'tuition_id', 'issued_by',
        'document_number', 'verification_token_hash', 'integrity_signature',
        'snapshot', 'status', 'disk', 'pdf_path', 'pdf_checksum', 'issued_at',
        'revoked_at', 'revocation_reason',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'issued_at' => 'immutable_datetime',
            'revoked_at' => 'immutable_datetime',
        ];
    }
}
