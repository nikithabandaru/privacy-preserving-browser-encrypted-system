package com.dams.backend.repositories;

import com.dams.backend.models.AssetMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface AssetMetadataRepository extends MongoRepository<AssetMetadata, String> {
    List<AssetMetadata> findByUploadedByAndCategory(String uploadedBy, String category);
    List<AssetMetadata> findByUploadedBy(String uploadedBy);

    @Query("{ 'uploadedBy': ?0, 'category': ?1, $or: [ { 'originalFileName': { $regex: ?2, $options: 'i' } }, { 'tags': { $regex: ?2, $options: 'i' } } ] }")
    List<AssetMetadata> searchAssets(String uploadedBy, String category, String keyword);

    @Query("{ 'uploadedBy': ?0, $or: [ { 'originalFileName': { $regex: ?1, $options: 'i' } }, { 'tags': { $regex: ?1, $options: 'i' } } ] }")
    List<AssetMetadata> searchAllAssets(String uploadedBy, String keyword);
}

