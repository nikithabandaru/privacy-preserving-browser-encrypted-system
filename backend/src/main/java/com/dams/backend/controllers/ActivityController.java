package com.dams.backend.controllers;

import com.dams.backend.models.ActivityLog;
import com.dams.backend.services.MongoMetadataService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final MongoMetadataService mongoMetadataService;

    public ActivityController(MongoMetadataService mongoMetadataService) {
        this.mongoMetadataService = mongoMetadataService;
    }

    @GetMapping
    public ResponseEntity<?> getActivityLogs() {
        try {
            String uid = SecurityContextHolder.getContext().getAuthentication().getName();
            List<ActivityLog> activityLogs = mongoMetadataService.getActivityLogsByUser(uid);
            
            // Sort by timestamp descending (newest first)
            activityLogs.sort((a, b) -> {
                if (a.getTimestamp() != null && b.getTimestamp() != null) {
                    return b.getTimestamp().compareTo(a.getTimestamp());
                }
                return 0;
            });
            
            return ResponseEntity.ok(activityLogs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
