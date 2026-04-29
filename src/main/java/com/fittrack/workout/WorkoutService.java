package com.fittrack.workout;

import com.fittrack.exception.WorkoutNotFoundException;
import com.fittrack.user.User;
import com.fittrack.workout.dto.CreateWorkoutRequest;
import com.fittrack.workout.dto.UpdateWorkoutRequest;
import com.fittrack.workout.dto.WorkoutResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutRepository workoutRepository;

    public WorkoutResponse create(CreateWorkoutRequest request, User user) {
        Workout workout = Workout.builder()
                .user(user)
                .name(request.name())
                .type(request.type())
                .durationMins(request.durationMins())
                .notes(request.notes())
                .build();

        Workout saved = workoutRepository.save(workout);
        return toResponse(saved);
    }

    public List<WorkoutResponse> findAll(User user) {
        return workoutRepository.findAllByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public WorkoutResponse findById(Long id, User user) {
        Workout workout = workoutRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new WorkoutNotFoundException(id));
        return toResponse(workout);
    }

    public WorkoutResponse update(Long id, UpdateWorkoutRequest request, User user) {
        Workout workout = workoutRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new WorkoutNotFoundException(id));

        if (request.name() != null) {
            workout.setName(request.name());
        }
        if (request.type() != null) {
            workout.setType(request.type());
        }
        if (request.durationMins() != null) {
            workout.setDurationMins(request.durationMins());
        }
        if (request.notes() != null) {
            workout.setNotes(request.notes());
        }

        Workout updated = workoutRepository.save(workout);
        return toResponse(updated);
    }

    public void delete(Long id, User user) {
        Workout workout = workoutRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new WorkoutNotFoundException(id));
        workoutRepository.delete(workout);
    }

    private WorkoutResponse toResponse(Workout workout) {
        return new WorkoutResponse(
                workout.getId(),
                workout.getName(),
                workout.getType(),
                workout.getDurationMins(),
                workout.getNotes(),
                workout.getCreatedAt()
        );
    }
}
