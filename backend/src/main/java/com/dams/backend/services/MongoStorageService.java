package com.dams.backend.services;

import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * MongoStorageService — stores encrypted file blobs in MongoDB GridFS.
 *
 * GridFS splits large files into 255KB chunks, supporting files up to 16TB.
 * This makes it ideal for storing videos, images, and documents of any size.
 *
 * All files stored here are AES-256-GCM encrypted — MongoDB never sees plaintext.
 */
@Service
public class MongoStorageService {

    private final GridFsTemplate gridFsTemplate;

    public MongoStorageService(GridFsTemplate gridFsTemplate) {
        this.gridFsTemplate = gridFsTemplate;
    }

    /**
     * Upload encrypted bytes to MongoDB GridFS.
     *
     * @param encryptedBytes AES-256-GCM encrypted file content
     * @param filename       Original filename (for reference)
     * @param contentType    MIME type of the original file
     * @return GridFS ObjectId as string (used for retrieval)
     */
    public String uploadEncryptedFile(byte[] encryptedBytes, String filename, String contentType) {
        InputStream inputStream = new ByteArrayInputStream(encryptedBytes);
        // Store as encrypted — content type is octet-stream since it's ciphertext
        ObjectId objectId = gridFsTemplate.store(inputStream, filename + ".enc", "application/octet-stream");
        System.out.println("[MONGO-GRIDFS] Stored encrypted file: " + filename + " → " + objectId.toHexString());
        return objectId.toHexString();
    }

    /**
     * Download encrypted bytes from MongoDB GridFS.
     *
     * @param fileId GridFS ObjectId string
     * @return Raw encrypted bytes
     */
    public byte[] downloadEncryptedFile(String fileId) throws IOException {
        GridFSFile gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(new ObjectId(fileId))));
        if (gridFSFile == null) {
            throw new IOException("Encrypted file not found in MongoDB GridFS: " + fileId);
        }

        GridFsResource resource = gridFsTemplate.getResource(gridFSFile);
        try (InputStream is = resource.getInputStream()) {
            return is.readAllBytes();
        }
    }

    /**
     * Delete an encrypted file from MongoDB GridFS.
     *
     * @param fileId GridFS ObjectId string
     */
    public void deleteFile(String fileId) {
        try {
            gridFsTemplate.delete(new Query(Criteria.where("_id").is(new ObjectId(fileId))));
            System.out.println("[MONGO-GRIDFS] Deleted file: " + fileId);
        } catch (Exception e) {
            System.err.println("[MONGO-GRIDFS] Error deleting file: " + e.getMessage());
        }
    }
}
