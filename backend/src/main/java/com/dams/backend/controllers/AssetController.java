package com.dams.backend.controllers;

import com.dams.backend.services.*;
import com.dams.backend.models.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final MongoMetadataService mongoMetadataService;
    private final MongoStorageService mongoStorageService;

    public AssetController(MongoMetadataService mongoMetadataService, MongoStorageService mongoStorageService) {
        this.mongoMetadataService = mongoMetadataService;
        this.mongoStorageService = mongoStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAsset(@RequestParam("file") MultipartFile file, 
                                         @RequestParam(value = "originalType", required = false) String originalType) {
        try {
            String uid = SecurityContextHolder.getContext().getAuthentication().getName();
            String originalFilename = file.getOriginalFilename();
            String contentType = (originalType != null && !originalType.isEmpty()) ? originalType : file.getContentType();

            String category = "documents";
            if (contentType != null) {
                if (contentType.startsWith("image/")) category = "images";
                else if (contentType.startsWith("video/")) category = "videos";
            }

            // ── STEP 1: Upload the client-encrypted file directly to GridFS ───────────
            byte[] encryptedBytes = file.getBytes();
            String mongoFileId = mongoStorageService.uploadEncryptedFile(encryptedBytes, originalFilename, contentType);
            System.out.println("[STORAGE] Uploaded encrypted blob to MongoDB GridFS (Zero-Knowledge) → " + mongoFileId);

            // ── STEP 2: Local Tagging based on filename ──────────────────────────────
            List<String> tags = generateFallbackTags(originalFilename);
            System.out.println("[LOCAL-TAGS] Generated tags from filename: " + tags);

            // ── STEP 3: Save metadata to MongoDB ──────────────────────────────────────
            String assetId = UUID.randomUUID().toString();
            AssetMetadata metadata = new AssetMetadata();
            metadata.setAssetId(assetId);
            metadata.setOriginalFileName(originalFilename);
            metadata.setFileType(contentType);
            metadata.setFileSize(encryptedBytes.length);
            metadata.setCategory(category);
            metadata.setUploadedBy(uid);
            metadata.setUploadDate(new Date());
            metadata.setMongoFileId(mongoFileId);
            metadata.setEncryptedFileKey(null); // No backend envelope encryption key stored
            metadata.setEncryptionAlgo("AES-256-GCM (Client-Side)");
            metadata.setKeyWrapAlgo(null);
            metadata.setStorageBackend("MongoDB-GridFS");
            metadata.setTags(tags);
            metadata.setOcrText(""); // OCR disabled in Zero-Knowledge
            metadata.setEncryptedAtRest(true);
            metadata.setCurrentVersion(1);
            metadata.setStatus("active");

            mongoMetadataService.saveAssetMetadata(metadata);

            // ── STEP 4: Log activity ──────────────────────────────────────────────────
            ActivityLog activity = new ActivityLog();
            activity.setActivityId(UUID.randomUUID().toString());
            activity.setAssetId(assetId);
            activity.setUserId(uid);
            activity.setFileName(originalFilename);
            activity.setAction("Uploaded " + category.substring(0, 1).toUpperCase() + category.substring(1, category.length() - 1));
            activity.setEncryptedAtRest(true);
            activity.setTimestamp(new Date());
            mongoMetadataService.logActivity(activity);

            return ResponseEntity.ok().body(Map.of(
                    "message", "File uploaded successfully (Zero-Knowledge)",
                    "assetId", assetId,
                    "encryptionAlgo", "AES-256-GCM (Client-Side)",
                    "storageBackend", "MongoDB-GridFS"
            ));

        } catch (Exception e) {
            System.err.println("[ERROR] Upload failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAssets(@RequestParam("category") String category,
                                       @RequestParam(value = "search", required = false) String search) {
        try {
            String uid = SecurityContextHolder.getContext().getAuthentication().getName();
            List<AssetMetadata> assets = mongoMetadataService.getAssetsByUser(uid, category, search);
            return ResponseEntity.ok(assets);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/download/{assetId}")
    public ResponseEntity<byte[]> downloadAsset(@PathVariable String assetId) {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            String uid = authentication.getName();
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            AssetMetadata asset = mongoMetadataService.getAssetById(assetId);

            if (asset == null || (!uid.equals(asset.getUploadedBy()) && !isAdmin)) {
                return ResponseEntity.status(403).build();
            }

            String mongoFileId      = asset.getMongoFileId();
            String originalFileName = asset.getOriginalFileName();

            // ── Fetch encrypted blob from MongoDB GridFS ─────────────────────────────
            System.out.println("[DOWNLOAD] Fetching encrypted blob from MongoDB: " + mongoFileId);
            byte[] encryptedBytes = mongoStorageService.downloadEncryptedFile(mongoFileId);
            
            // In Zero-Knowledge, the server ALWAYS returns raw encrypted bytes.
            // Client decrypts using their Vault Key.
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFileName + ".enc\"")
                    .body(encryptedBytes);

        } catch (Exception e) {
            System.err.println("[ERROR] Download failed: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    @DeleteMapping("/{assetId}")
    public ResponseEntity<?> deleteAsset(@PathVariable String assetId) {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            String uid = authentication.getName();
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            AssetMetadata asset = mongoMetadataService.getAssetById(assetId);

            if (asset == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Asset not found"));
            }

            if (!uid.equals(asset.getUploadedBy()) && !isAdmin) {
                return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
            }

            // Delete raw blob from GridFS
            if (asset.getMongoFileId() != null) {
                mongoStorageService.deleteFile(asset.getMongoFileId());
            }

            // Delete metadata
            mongoMetadataService.deleteAssetById(assetId);

            // Log activity
            ActivityLog activity = new ActivityLog();
            activity.setActivityId(UUID.randomUUID().toString());
            activity.setAssetId(assetId);
            activity.setUserId(uid);
            activity.setFileName(asset.getOriginalFileName());
            activity.setAction("Deleted File");
            activity.setEncryptedAtRest(true);
            activity.setTimestamp(new Date());
            mongoMetadataService.logActivity(activity);

            return ResponseEntity.ok().body(Map.of("message", "File deleted successfully"));

        } catch (Exception e) {
            System.err.println("[ERROR] Delete failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private List<String> generateFallbackTags(String filename) {
        if (filename == null) return List.of("untagged");
        String nameWithoutExt = filename.replaceAll("\\.[^.]+$", "").toLowerCase();
        String[] words = nameWithoutExt.split("[\\s\\-_\\.]+");
        return Arrays.stream(words)
                .map(String::trim)
                .filter(w -> !w.isBlank() && w.length() > 1)
                .distinct()
                .limit(5)
                .collect(Collectors.toList());
    }
}
