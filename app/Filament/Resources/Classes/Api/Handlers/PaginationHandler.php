<?php

declare(strict_types=1);

namespace App\Filament\Resources\Classes\Api\Handlers;

use App\Filament\Resources\Classes\Api\Transformers\ClassesTransformer;
use App\Filament\Resources\Classes\ClassesResource;
use Illuminate\Http\Request;
use Override;
use Rupadana\ApiService\Http\Handlers;
use Spatie\QueryBuilder\QueryBuilder;

final class PaginationHandler extends Handlers
{
    #[Override]
    public static ?string $uri = '/';

    #[Override]
    public static ?string $resource = ClassesResource::class;

    protected static string $permission = 'ViewAny:Classes';

    /**
     * List of Classes
     *
     * @param  Request  $request
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function handler()
    {
        $query = self::getEloquentQuery();

        $query = QueryBuilder::for($query)
            ->allowedFields($this->getAllowedFields() ?? [])
            ->allowedSorts($this->getAllowedSorts() ?? [])
            ->allowedFilters($this->getAllowedFilters() ?? [])
            ->allowedIncludes($this->getAllowedIncludes() ?? [])
            ->paginate(request()->query('per_page'))
            ->appends(request()->query());

        return ClassesTransformer::collection($query);
    }
}
