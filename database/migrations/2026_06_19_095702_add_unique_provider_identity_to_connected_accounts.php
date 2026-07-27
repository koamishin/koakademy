<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('connected_accounts')) {
            Schema::create('connected_accounts', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('provider');
                $table->string('provider_id');
                $table->string('name')->nullable();
                $table->string('nickname')->nullable();
                $table->string('email')->nullable();
                $table->string('telephone')->nullable();
                $table->text('avatar_path')->nullable();
                $table->string('token', 1000);
                $table->string('secret')->nullable();
                $table->string('refresh_token', 1000)->nullable();
                $table->timestampTz('expires_at')->nullable();
                $table->timestampsTz();

                $table->unique(['provider', 'provider_id'], 'connected_accounts_provider_provider_id_unique');
                $table->index(['user_id', 'provider'], 'connected_accounts_user_id_provider_index');
                $table->index(['user_id', 'id']);
            });

            return;
        }

        DB::statement(<<<'SQL'
            DELETE FROM connected_accounts
            WHERE id IN (
                SELECT id
                FROM (
                    SELECT
                        id,
                        ROW_NUMBER() OVER (
                            PARTITION BY provider, provider_id
                            ORDER BY updated_at DESC, id DESC
                        ) AS duplicate_position
                    FROM connected_accounts
                ) duplicates
                WHERE duplicate_position > 1
            )
        SQL);

        Schema::table('connected_accounts', function (Blueprint $table): void {
            $table->unique(['provider', 'provider_id'], 'connected_accounts_provider_provider_id_unique');
            $table->index(['user_id', 'provider'], 'connected_accounts_user_id_provider_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('connected_accounts', function (Blueprint $table): void {
            $table->dropUnique('connected_accounts_provider_provider_id_unique');
            $table->dropIndex('connected_accounts_user_id_provider_index');
        });
    }
};
