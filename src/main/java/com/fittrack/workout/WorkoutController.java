package com.fittrack.workout;

import com.fittrack.user.User;
import com.fittrack.workout.dto.CreateWorkoutRequest;
import com.fittrack.workout.dto.UpdateWorkoutRequest;
import com.fittrack.workout.dto.WorkoutResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;

    @PostMapping
    public ResponseEntity<WorkoutResponse> create(
            @RequestBody CreateWorkoutRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workoutService.create(request, currentUser));
    }

    @GetMapping
    public ResponseEntity<List<WorkoutResponse>> findAll(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(workoutService.findAll(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkoutResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(workoutService.findById(id, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkoutResponse> update(
            @PathVariable Long id,
            @RequestBody UpdateWorkoutRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(workoutService.update(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        workoutService.delete(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
