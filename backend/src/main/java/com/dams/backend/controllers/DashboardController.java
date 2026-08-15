package com.dams.backend.controllers;

import com.dams.backend.models.ActivityLog;
import com.dams.backend.models.AssetMetadata;
import com.dams.backend.services.MongoMetadataService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final MongoMetadataService mongoMetadataService;

    public DashboardController(MongoMetadataService mongoMetadataService) {
        this.mongoMetadataService = mongoMetadataService;
    }

    @GetMapping
    public ResponseEntity<?> getDashboardStats() {
        try {
            String uid = SecurityContextHolder.getContext().getAuthentication().getName();
            
            List<AssetMetadata> allAssets = mongoMetadataService.getAllAssetsByUser(uid);
            List<ActivityLog> activityLogs = mongoMetadataService.getActivityLogsByUser(uid);

            // Calculate stats
            long totalAssets = allAssets.size();
            long imagesCount = allAssets.stream().filter(a -> "images".equals(a.getCategory())).count();
            long videosCount = allAssets.stream().filter(a -> "videos".equals(a.getCategory())).count();
            long documentsCount = allAssets.stream().filter(a -> "documents".equals(a.getCategory())).count();

            // Sort assets by uploadDate descending
            allAssets.sort((a, b) -> {
                Object dateA = a.getUploadDate();
                Object dateB = b.getUploadDate();
                if (dateA != null && dateB != null) {
                    return dateB.toString().compareTo(dateA.toString());
                }
                return 0;
            });
            List<AssetMetadata> recentUploads = allAssets.stream().limit(5).collect(Collectors.toList());

            // Sort logs by timestamp descending
            activityLogs.sort((a, b) -> {
                Object dateA = a.getTimestamp();
                Object dateB = b.getTimestamp();
                if (dateA != null && dateB != null) {
                    return dateB.toString().compareTo(dateA.toString());
                }
                return 0;
            });
            List<ActivityLog> recentActivity = activityLogs.stream().limit(5).collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("totalAssets", totalAssets);
            response.put("imagesCount", imagesCount);
            response.put("videosCount", videosCount);
            response.put("documentsCount", documentsCount);
            response.put("recentUploads", recentUploads);
            response.put("recentActivity", recentActivity);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
