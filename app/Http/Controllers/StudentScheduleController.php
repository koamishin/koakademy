<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Services\StudentScheduleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class StudentScheduleController extends Controller
{
    public function __invoke(Request $request, StudentScheduleService $scheduleService): Response
    {
        /** @var User $user */
        $user = $request->user();

        // Get the student record linked to this user
        $student = Student::where('email', $user->email)
            ->orWhere('user_id', $user->id)
            ->with(['Course'])
            ->first();

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->getFilamentAvatarUrl(),
            'role' => $user->role?->value ?? 'student',
        ];

        if (! $student) {
            return Inertia::render('student/schedule', [
                'user' => $userData,
                'faculty_data' => [
                    'classes' => [],
                    'stats' => [],
                ],
                'schedule_conflicts' => [],
                'rooms' => [],
            ]);
        }

        $scheduleData = $scheduleService->build($student);

        // Get Rooms for filters
        $rooms = \App\Models\Room::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('student/schedule', [
            'user' => $userData,
            'faculty_data' => [
                'classes' => $scheduleData['classes'],
                'stats' => [],
            ],
            'schedule_conflicts' => $scheduleData['conflicts'],
            'rooms' => $rooms,
        ]);
    }
}
