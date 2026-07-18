<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class StudentSchoolOptionService
{
    /**
     * @return array<int, array{name: string, address: string|null}>
     */
    public function search(string $field, string $search): array
    {
        $search = mb_trim($search);

        if (mb_strlen($search) < 1) {
            return [];
        }

        $schoolFields = [
            'elementary_school' => [
                'names' => ['elementary_school'],
                'address' => 'elementary_school_address',
            ],
            'junior_high_school_name' => [
                'names' => ['junior_high_school_name', 'high_school'],
                'address' => 'junior_high_school_address',
            ],
            'high_school' => [
                'names' => ['high_school', 'junior_high_school_name'],
                'address' => 'junior_high_school_address',
            ],
            'senior_high_name' => [
                'names' => ['senior_high_name', 'senior_high_school'],
                'address' => 'senior_high_address',
            ],
            'senior_high_school' => [
                'names' => ['senior_high_school', 'senior_high_name'],
                'address' => 'senior_high_address',
            ],
            'college_school' => [
                'names' => ['college_school'],
                'address' => null,
            ],
            'vocational_school' => [
                'names' => ['vocational_school'],
                'address' => null,
            ],
        ];

        if (! array_key_exists($field, $schoolFields) || ! Schema::hasTable('student_education_info')) {
            return [];
        }

        $config = $schoolFields[$field];
        $nameColumns = collect($config['names'])
            ->filter(fn (string $column): bool => Schema::hasColumn('student_education_info', $column))
            ->values();
        $addressColumn = is_string($config['address']) && Schema::hasColumn('student_education_info', $config['address'])
            ? $config['address']
            : null;

        if ($nameColumns->isEmpty()) {
            return [];
        }

        $like = '%'.mb_strtolower($search).'%';

        return $nameColumns
            ->flatMap(function (string $nameColumn) use ($addressColumn, $like): array {
                $addressSelect = $addressColumn ? $addressColumn.' as address' : 'NULL as address';

                return DB::table('student_education_info')
                    ->selectRaw($nameColumn.' as name, '.$addressSelect)
                    ->whereRaw('LOWER('.$nameColumn.') LIKE ?', [$like])
                    ->whereNotNull($nameColumn)
                    ->where($nameColumn, '!=', '')
                    ->limit(25)
                    ->get()
                    ->all();
            })
            ->map(fn (object $row): array => [
                'name' => mb_trim((string) $row->name),
                'address' => isset($row->address) && mb_trim((string) $row->address) !== ''
                    ? mb_trim((string) $row->address)
                    : null,
            ])
            ->filter(fn (array $option): bool => $option['name'] !== '')
            ->groupBy(fn (array $option): string => mb_strtolower($option['name']))
            ->map(fn ($matches): array => $matches
                ->sortByDesc(fn (array $option): bool => $option['address'] !== null)
                ->first())
            ->sortBy(fn (array $option): string => mb_strtolower($option['name']))
            ->values()
            ->take(20)
            ->all();
    }
}
