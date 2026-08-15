package com.dams.backend.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "assets")
public class AssetMetadata {

    @Id
    private String assetId;
    
    private String originalFileName;
    private String fileType;
    private long fileSize;
    private String category;
    private String uploadedBy;
    private Date uploadDate;
    private String mongoFileId;
    private String encryptedFileKey;
    private String encryptionAlgo;
    private String keyWrapAlgo;
    private String storageBackend;
    private List<String> tags;
    private String ocrText;
    private boolean encryptedAtRest;
    private int currentVersion;
    private String status;

    public AssetMetadata() {
    }

    // Getters and Setters

    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Date getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(Date uploadDate) {
        this.uploadDate = uploadDate;
    }

    public String getMongoFileId() {
        return mongoFileId;
    }

    public void setMongoFileId(String mongoFileId) {
        this.mongoFileId = mongoFileId;
    }

    public String getEncryptedFileKey() {
        return encryptedFileKey;
    }

    public void setEncryptedFileKey(String encryptedFileKey) {
        this.encryptedFileKey = encryptedFileKey;
    }

    public String getEncryptionAlgo() {
        return encryptionAlgo;
    }

    public void setEncryptionAlgo(String encryptionAlgo) {
        this.encryptionAlgo = encryptionAlgo;
    }

    public String getKeyWrapAlgo() {
        return keyWrapAlgo;
    }

    public void setKeyWrapAlgo(String keyWrapAlgo) {
        this.keyWrapAlgo = keyWrapAlgo;
    }

    public String getStorageBackend() {
        return storageBackend;
    }

    public void setStorageBackend(String storageBackend) {
        this.storageBackend = storageBackend;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getOcrText() {
        return ocrText;
    }

    public void setOcrText(String ocrText) {
        this.ocrText = ocrText;
    }

    public boolean isEncryptedAtRest() {
        return encryptedAtRest;
    }

    public void setEncryptedAtRest(boolean encryptedAtRest) {
        this.encryptedAtRest = encryptedAtRest;
    }

    public int getCurrentVersion() {
        return currentVersion;
    }

    public void setCurrentVersion(int currentVersion) {
        this.currentVersion = currentVersion;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
