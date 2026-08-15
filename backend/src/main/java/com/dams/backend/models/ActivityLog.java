package com.dams.backend.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "activityLogs")
public class ActivityLog {

    @Id
    private String activityId;
    
    private String assetId;
    private String userId;
    private String fileName;
    private String action;
    private boolean encryptedAtRest;
    private Date timestamp;

    public ActivityLog() {}

    public String getActivityId() { return activityId; }
    public void setActivityId(String activityId) { this.activityId = activityId; }

    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public boolean isEncryptedAtRest() { return encryptedAtRest; }
    public void setEncryptedAtRest(boolean encryptedAtRest) { this.encryptedAtRest = encryptedAtRest; }

    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
}
