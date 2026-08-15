package com.dams.backend.services;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.StorageClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URL;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * FirebaseStorageService — uploads/downloads encrypted file blobs to/from Firebase Cloud Storage.
 * Files are stored as raw encrypted bytes. The storage layer never sees plaintext.
 */
@Service
public class FirebaseStorageService {

    @Value("${firebase.storage.bucket}")
    private String storageBucket;

    /**
     * Uploads an encrypted byte array to Firebase Storage.
     * @param encryptedBytes  AES-256-GCM encrypted file content
     * @param category        Folder: images / videos / documents
     * @param originalFilename Original filename (used to determine content type for display)
     * @return Storage path (used as the publicId for later retrieval)
     */
    public String uploadEncryptedFile(byte[] encryptedBytes, String category, String originalFilename) throws IOException {
        String storagePath = category + "/" + UUID.randomUUID() + "_" + originalFilename + ".enc";

        Bucket bucket = StorageClient.getInstance().bucket(storageBucket);
        // Store as octet-stream — encrypted blob has no recognisable mime type
        bucket.create(storagePath, new ByteArrayInputStream(encryptedBytes), "application/octet-stream");

        System.out.println("Uploaded encrypted file to Firebase Storage: " + storagePath);
        return storagePath;
    }

    /**
     * Downloads the encrypted byte array from Firebase Storage.
     * @param storagePath  Path returned by uploadEncryptedFile
     * @return Raw encrypted bytes ready for decryption
     */
    public byte[] downloadEncryptedFile(String storagePath) throws IOException {
        Bucket bucket = StorageClient.getInstance().bucket(storageBucket);
        Blob blob = bucket.get(storagePath);
        if (blob == null || !blob.exists()) {
            throw new IOException("Encrypted file not found in Firebase Storage: " + storagePath);
        }
        return blob.getContent();
    }

    /**
     * Deletes an encrypted file from Firebase Storage.
     */
    public void deleteFile(String storagePath) {
        try {
            Bucket bucket = StorageClient.getInstance().bucket(storageBucket);
            Blob blob = bucket.get(storagePath);
            if (blob != null && blob.exists()) {
                blob.delete();
                System.out.println("Deleted file from Firebase Storage: " + storagePath);
            }
        } catch (Exception e) {
            System.err.println("Error deleting file from Firebase Storage: " + e.getMessage());
        }
    }
}
