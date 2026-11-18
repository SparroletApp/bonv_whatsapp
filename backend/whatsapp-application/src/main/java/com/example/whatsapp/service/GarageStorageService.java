package com.example.whatsapp.service;

import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class GarageStorageService {

    private final S3Client s3Client;

    @Value("${garage.bucket}")
    private String bucket;

    @Value("${app.base-url}")
    private String appBaseUrl;

    public String uploadImage(MultipartFile file, String folder) {

        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("Image is required");
            }

            String contentType = file.getContentType();

            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Only image files are allowed");
            }

            String extension = resolveExtension(contentType, file.getOriginalFilename());

            String objectKey = folder + "/" + UUID.randomUUID() + extension;

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

        return appBaseUrl.replaceAll("/+$", "")
                + "/media/" + objectKey;
    }

    public byte[] getObjectBytes(String objectKey) {

        return s3Client.getObjectAsBytes(
                GetObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .build()
        ).asByteArray();
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

    private static String resolveExtension(String contentType, String originalName) {

        switch (contentType.toLowerCase()) {
            case "image/jpeg":
                return ".jpg";
            case "image/png":
                return ".png";
            default:
                break;
        }

        if (originalName != null && originalName.contains(".")) {
            String ext = originalName
                    .substring(originalName.lastIndexOf("."))
                    .toLowerCase();
            if (ext.matches("\\.[a-z0-9]{1,5}")) {
                return ext;
            }
        }

        return "";
    }
}