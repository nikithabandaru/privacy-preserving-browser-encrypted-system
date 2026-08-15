package com.dams.backend.controllers;

import com.dams.backend.models.AssetMetadata;
import com.dams.backend.services.MongoMetadataService;
import com.dams.backend.services.MongoStorageService;
import com.google.firebase.auth.ExportedUserRecord;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.ListUsersPage;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final MongoMetadataService mongoMetadataService;
    private final MongoStorageService mongoStorageService;

    public AdminController(MongoMetadataService mongoMetadataService, MongoStorageService mongoStorageService) {
        this.mongoMetadataService = mongoMetadataService;
        this.mongoStorageService = mongoStorageService;
    }

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        if (!isAdmin()) return ResponseEntity.status(403).body("Access denied");

        try {
            List<Map<String, Object>> usersList = new ArrayList<>();
            ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
            while (page != null) {
                for (ExportedUserRecord user : page.getValues()) {
                    Map<String, Object> u = new HashMap<>();
                    u.put("uid", user.getUid());
                    u.put("email", user.getEmail());
                    u.put("displayName", user.getDisplayName());
                    u.put("creationTimestamp", user.getUserMetadata().getCreationTimestamp());
                    u.put("lastSignInTimestamp", user.getUserMetadata().getLastSignInTimestamp());
                    usersList.add(u);
                }
                page = page.getNextPage();
            }
            return ResponseEntity.ok(usersList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assets")
    public ResponseEntity<?> getAllAssets() {
        if (!isAdmin()) return ResponseEntity.status(403).body("Access denied");

        try {
            List<AssetMetadata> assets = mongoMetadataService.getAllAssetsGlobally();
            return ResponseEntity.ok(assets);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

}
