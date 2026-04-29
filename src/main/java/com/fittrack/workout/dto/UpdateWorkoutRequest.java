package com.fittrack.workout.dto;

import com.fittrack.workout.WorkoutType;

public record UpdateWorkoutRequest(
        String name,
        WorkoutType type,
        Integer durationMins,
        String notes
) {}
