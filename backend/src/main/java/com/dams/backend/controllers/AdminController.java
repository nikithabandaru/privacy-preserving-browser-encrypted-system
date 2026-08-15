package com.dams.backend.controllers;

import com.dams.backend.models.AssetMetadata;
import com.dams.backend.services.MongoMetadataService;
import com.dams.backend.services.MongoStorageService;
import com.google.firebase.auth.ExportedUserRecord;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.ListUsersPage;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
            Map<String, Map<String, Object>> userMap = new LinkedHashMap<>();

            // 1. Try to fetch from Firebase Auth Admin SDK
            try {
                if (FirebaseAuth.getInstance() != null) {
                    ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
                    while (page != null) {
                        for (ExportedUserRecord user : page.getValues()) {
                            Map<String, Object> u = new HashMap<>();
                            u.put("uid", user.getUid());
                            u.put("email", (user.getEmail() != null && !user.getEmail().isEmpty()) 
                                    ? user.getEmail() 
                                    : "User (" + user.getUid().substring(0, Math.min(8, user.getUid().length())) + ")");
                            u.put("displayName", user.getDisplayName());
                            u.put("creationTimestamp", user.getUserMetadata().getCreationTimestamp());
                            u.put("lastSignInTimestamp", user.getUserMetadata().getLastSignInTimestamp());
                            userMap.put(user.getUid(), u);
                        }
                        page = page.getNextPage();
                    }
                }
            } catch (Exception e) {
                System.err.println("Firebase listUsers exception, aggregating users from MongoDB: " + e.getMessage());
            }

            // 2. Also aggregate all distinct UIDs from MongoDB assets so no user is ever missed
            List<AssetMetadata> allAssets = mongoMetadataService.getAllAssetsGlobally();
            for (AssetMetadata asset : allAssets) {
                if (asset.getUploadedBy() != null && !userMap.containsKey(asset.getUploadedBy())) {
                    Map<String, Object> u = new HashMap<>();
                    String uid = asset.getUploadedBy();
                    u.put("uid", uid);
                    u.put("email", "User (" + uid.substring(0, Math.min(8, uid.length())) + "...)");
                    u.put("displayName", "User");
                    u.put("creationTimestamp", System.currentTimeMillis());
                    u.put("lastSignInTimestamp", System.currentTimeMillis());
                    userMap.put(uid, u);
                }
            }

            return ResponseEntity.ok(new ArrayList<>(userMap.values()));
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
