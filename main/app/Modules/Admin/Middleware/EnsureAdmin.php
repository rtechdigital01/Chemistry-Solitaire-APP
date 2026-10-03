<?php

namespace App\Modules\Admin\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Blocks non-admin users from every /api/admin/* endpoint that is
 * behind auth:sanctum. Sanctum only proves the token is valid — this
 * additionally requires that the token belongs to an admin account.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'status' => 'Error',
                'message' => 'Admin access required.',
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
