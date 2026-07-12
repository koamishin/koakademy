<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->string('receipt_email_status', 20)->nullable()->index();
            $table->uuid('receipt_email_delivery_id')->nullable();
            $table->string('receipt_email_recipient')->nullable();
            $table->timestamp('receipt_emailed_at')->nullable();
            $table->timestamp('receipt_email_failed_at')->nullable();
            $table->text('receipt_email_error')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->dropColumn([
                'receipt_email_status',
                'receipt_email_delivery_id',
                'receipt_email_recipient',
                'receipt_emailed_at',
                'receipt_email_failed_at',
                'receipt_email_error',
            ]);
        });
    }
};
