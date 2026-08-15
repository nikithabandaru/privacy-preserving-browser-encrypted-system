package com.dams.backend.services;

import com.dams.backend.models.ActivityLog;
import com.dams.backend.models.AssetMetadata;
import com.dams.backend.repositories.ActivityLogRepository;
import com.dams.backend.repositories.AssetMetadataRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MongoMetadataService {

    private final AssetMetadataRepository assetMetadataRepository;
    private final ActivityLogRepository activityLogRepository;

    public MongoMetadataService(AssetMetadataRepository assetMetadataRepository, ActivityLogRepository activityLogRepository) {
        this.assetMetadataRepository = assetMetadataRepository;
        this.activityLogRepository = activityLogRepository;
    }

    public void saveAssetMetadata(AssetMetadata metadata) {
        assetMetadataRepository.save(metadata);
    }

    public void logActivity(ActivityLog activityLog) {
        activityLogRepository.save(activityLog);
    }

    public List<AssetMetadata> getAssetsByUser(String uid, String category, String search) {
        if (search == null || search.trim().isEmpty()) {
            return assetMetadataRepository.findByUploadedByAndCategory(uid, category);
        } else {
            return assetMetadataRepository.searchAssets(uid, category, search);
        }
    }

    public AssetMetadata getAssetById(String assetId) {
        Optional<AssetMetadata> metadata = assetMetadataRepository.findById(assetId);
        return metadata.orElse(null);
    }

    public List<AssetMetadata> getAllAssetsByUser(String uid) {
        return assetMetadataRepository.findByUploadedBy(uid);
    }

    public List<AssetMetadata> searchAllAssetsByUser(String uid, String search) {
        if (search == null || search.trim().isEmpty()) {
            return assetMetadataRepository.findByUploadedBy(uid);
        }
        return assetMetadataRepository.searchAllAssets(uid, search);
    }

    public List<ActivityLog> getActivityLogsByUser(String uid) {
        return activityLogRepository.findByUserId(uid);
    }

    public List<AssetMetadata> getAllAssetsGlobally() {
        return assetMetadataRepository.findAll();
    }

    public void deleteAssetById(String assetId) {
        assetMetadataRepository.deleteById(assetId);
    }
}
