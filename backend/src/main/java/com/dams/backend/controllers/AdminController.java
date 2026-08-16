package com.dams.backend.controllers;

import com.dams.backend.models.AssetMetadata;
import com.dams.backend.models.UserProfile;
import com.dams.backend.repositories.UserProfileRepository;
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
    private final UserProfileRepository userProfileRepository;

    public AdminController(MongoMetadataService mongoMetadataService, MongoStorageService mongoStorageService, UserProfileRepository userProfileRepository) {
        this.mongoMetadataService = mongoMetadataService;
        this.mongoStorageService = mongoStorageService;
        this.userProfileRepository = userProfileRepository;
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

            // 1. Fetch from MongoDB UserProfiles (real logged-in user emails)
            List<UserProfile> profiles = userProfileRepository.findAll();
            for (UserProfile p : profiles) {
                Map<String, Object> u = new HashMap<>();
                u.put("uid", p.getUid());
                u.put("email", p.getEmail() != null ? p.getEmail() : p.getUid());
                u.put("displayName", p.getDisplayName());
                u.put("creationTimestamp", p.getLastLoginDate() != null ? p.getLastLoginDate().getTime() : System.currentTimeMillis());
                u.put("lastSignInTimestamp", p.getLastLoginDate() != null ? p.getLastLoginDate().getTime() : System.currentTimeMillis());
                userMap.put(p.getUid(), u);
            }

            // 2. Try to fetch from Firebase Auth Admin SDK
            try {
                if (FirebaseAuth.getInstance() != null) {
                    ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
                    while (page != null) {
                        for (ExportedUserRecord user : page.getValues()) {
                            Map<String, Object> u = userMap.getOrDefault(user.getUid(), new HashMap<>());
                            u.put("uid", user.getUid());
                            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                                u.put("email", user.getEmail());
                            }
                            u.put("displayName", user.getDisplayName());
                            u.put("creationTimestamp", user.getUserMetadata().getCreationTimestamp());
                            u.put("lastSignInTimestamp", user.getUserMetadata().getLastSignInTimestamp());
                            userMap.put(user.getUid(), u);
                        }
                        page = page.getNextPage();
                    }
                }
            } catch (Exception e) {
                System.err.println("Firebase listUsers warning: " + e.getMessage());
            }

            // 3. Aggregate all distinct UIDs from MongoDB assets so no uploader is missed
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
