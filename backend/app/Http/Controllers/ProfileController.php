<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Handle the profile setup submission.
     */
    public function setup(Request $request)
    {
        $validated = $request->validate([
            'display_name' => 'required|string|max:30',
            'avatar' => 'required|string',
        ]);

        $user = $request->user();
        $user->update([
            'display_name' => $validated['display_name'],
            'avatar' => $validated['avatar'],
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => $validated,
        ]);
    }
}
