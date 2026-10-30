package com.rtotracker.backend;

import org.jspecify.annotations.NonNull;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<@NonNull ApiError> handleValidation(MethodArgumentNotValidException exception) {
        List<@NonNull String> details = exception.getBindingResult().getFieldErrors().stream()
                .<@NonNull String>map(error -> error.getField() + ": " + error.getDefaultMessage())
                .distinct()
                .toList();
        if (details.isEmpty()) {
            details = exception.getBindingResult().getGlobalErrors().stream()
                    .<@NonNull String>map(error -> {
                        String message = error.getDefaultMessage();
                        return message == null ? "Invalid value" : message;
                    })
                    .toList();
        }
        return ResponseEntity.badRequest().body(new ApiError(
                HttpStatus.BAD_REQUEST.value(), "Bad Request", "Request validation failed", details));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<@NonNull ApiError> handleUnreadableRequest(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(new ApiError(
                HttpStatus.BAD_REQUEST.value(), "Bad Request",
                "Request body is missing, malformed, or does not match the expected JSON format.", List.of()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<@NonNull ApiError> handleResponseStatus(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String reason = exception.getReason();
        if (reason == null) reason = status.getReasonPhrase();
        return ResponseEntity.status(status).body(new ApiError(
                status.value(), status.getReasonPhrase(), reason, List.of()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<@NonNull ApiError> handleDataConflict(DataIntegrityViolationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(
                HttpStatus.CONFLICT.value(), HttpStatus.CONFLICT.getReasonPhrase(),
                "The request conflicts with existing data.", List.of()));
    }

    public record ApiError(int status, String error, String message, List<@NonNull String> details) {
    }
}
