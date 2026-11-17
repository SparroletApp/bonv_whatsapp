
package com.example.whatsapp.service;

import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

@Service
@RequiredArgsConstructor
public class GarageStorageService {

    private final S3Client s3Client;

    @Value("${garage.bucket}")
    private String bucket;

    @Value("${garage.public-base-url}")
    private String publicBaseUrl;

    public String uploadImage(MultipartFile file, String folder) {

        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("Image is required");
            }

            String contentType = file.getContentType();

            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Only image files are allowed");
            }

            String originalName = file.getOriginalFilename();
            String extension = "";

            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(
                        originalName.lastIndexOf(".")
                ).toLowerCase();
            }

            String fileName = UUID.randomUUID() + extension;

            String objectKey = folder + "/" + fileName;

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(
                    request,
                    RequestBody.fromInputStream(
                            file.getInputStream(),
                            file.getSize()
                    )
            );

            return objectKey;

        } catch (IOException e) {
            throw new RuntimeException(
                    "Failed to upload image to Garage", e
            );
        }
    }

    public String getPublicUrl(String objectKey) {

        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }

        return publicBaseUrl.replaceAll("/+$", "")
                + "/" + bucket + "/" + objectKey;
    }

    public void deleteImage(String objectKey) {

        if (objectKey == null || objectKey.isBlank()) {
            return;
        }

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build();

        s3Client.deleteObject(request);
    }
}
