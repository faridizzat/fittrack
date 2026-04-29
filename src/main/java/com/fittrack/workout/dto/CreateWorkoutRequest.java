package com.fittrack.workout.dto;

import com.fittrack.workout.WorkoutType;

public record CreateWorkoutRequest(
        String name,
        WorkoutType type,
        Integer durationMins,
        String notes
) {}
