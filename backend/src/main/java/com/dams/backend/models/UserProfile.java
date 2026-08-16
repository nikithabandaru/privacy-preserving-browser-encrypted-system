package com.dams.backend.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "user_profiles")
public class UserProfile {

    @Id
    private String uid;
    private String email;
    private String displayName;
    private Date lastLoginDate;

    public UserProfile() {
    }

    public UserProfile(String uid, String email, String displayName, Date lastLoginDate) {
        this.uid = uid;
        this.email = email;
        this.displayName = displayName;
        this.lastLoginDate = lastLoginDate;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Date getLastLoginDate() {
        return lastLoginDate;
    }

    public void setLastLoginDate(Date lastLoginDate) {
        this.lastLoginDate = lastLoginDate;
    }
}
