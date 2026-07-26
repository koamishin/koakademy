<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Administrators\StoreEnrollmentDiscountRequest;
use App\Models\EnrollmentDiscount;
use Illuminate\Http\JsonResponse;

final class AdministratorEnrollmentDiscountController extends Controller
{
    public function store(StoreEnrollmentDiscountRequest $request): JsonResponse
    {
        $discount = EnrollmentDiscount::query()->create($request->validated());

        return response()->json([
            'id' => $discount->id,
            'name' => $discount->name,
            'percentage' => $discount->percentage,
        ], 201);
    }
}
