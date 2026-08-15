package com.dams.backend.controllers;

import com.dams.backend.models.AssetMetadata;
import com.dams.backend.services.MongoMetadataService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final MongoMetadataService mongoMetadataService;

    public SearchController(MongoMetadataService mongoMetadataService) {
        this.mongoMetadataService = mongoMetadataService;
    }

    @GetMapping
    public ResponseEntity<?> search(@RequestParam("q") String query) {
        try {
            String uid = SecurityContextHolder.getContext().getAuthentication().getName();
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            List<AssetMetadata> results = mongoMetadataService.searchAllAssetsByUser(uid, query.trim());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
