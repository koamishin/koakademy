<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('enrollment_discounts')->insertOrIgnore([
            [
                'name' => 'Academic Discount',
                'normalized_name' => 'academic discount',
                'percentage' => 50,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Full Academic Discount',
                'normalized_name' => 'full academic discount',
                'percentage' => 100,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('enrollment_discounts')
            ->whereIn('normalized_name', ['academic discount', 'full academic discount'])
            ->delete();
    }
};
