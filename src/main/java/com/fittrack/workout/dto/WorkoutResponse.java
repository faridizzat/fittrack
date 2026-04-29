package com.fittrack.workout.dto;

import com.fittrack.workout.WorkoutType;

import java.time.LocalDateTime;

public record WorkoutResponse(
        Long id,
        String name,
        WorkoutType type,
        Integer durationMins,
        String notes,
        LocalDateTime createdAt
) {}
