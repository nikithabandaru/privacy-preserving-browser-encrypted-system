package com.dams.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.storage.bucket:ai-digital-9a2fe.firebasestorage.app}")
    private String storageBucket;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = null;

                // 1. Check environment variable FIREBASE_CREDENTIALS first (for production deployment)
                String envCredentials = System.getenv("FIREBASE_CREDENTIALS");
                if (envCredentials != null && !envCredentials.trim().isEmpty()) {
                    serviceAccount = new ByteArrayInputStream(envCredentials.getBytes(StandardCharsets.UTF_8));
                } else {
                    // 2. Fallback to classpath resource for local development
                    ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                    if (resource.exists()) {
                        serviceAccount = resource.getInputStream();
                    }
                }

                if (serviceAccount != null) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .setProjectId("ai-digital-9a2fe")
                            .build();

                    FirebaseApp.initializeApp(options);
                    System.out.println("Firebase Admin SDK initialized successfully.");
                } else {
                    System.err.println("WARNING: No Firebase service account credentials found. Set FIREBASE_CREDENTIALS env var.");
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to initialize Firebase Admin SDK: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
