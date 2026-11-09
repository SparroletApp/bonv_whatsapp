package com.example.whatsapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaStorageService {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "video/mp4", ".mp4",
            "application/pdf", ".pdf"
    );

    private final Path dir;
    private final String baseUrl;

    public MediaStorageService(
            @Value("${app.media.dir:uploads/campaign-media}") String dir,
            @Value("${app.media.public-base-url}") String baseUrl
    ) throws IOException {

        this.dir = Paths.get(dir).toAbsolutePath().normalize();
        Files.createDirectories(this.dir);

        this.baseUrl = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
    }

    /** Saves the file and returns its public HTTPS URL. */
    public String save(MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a file");
        }

        String extension = EXTENSIONS.get(file.getContentType());

        if (extension == null) {
            throw new IllegalArgumentException(
                    "Only JPEG, PNG, MP4 and PDF files are allowed"
            );
        }

        String filename = UUID.randomUUID() + extension;

        try (InputStream in = file.getInputStream()) {
            Files.copy(
                    in,
                    dir.resolve(filename),
                    StandardCopyOption.REPLACE_EXISTING
            );
        }

        return baseUrl + "/public/media/" + filename;
    }

    public Path directory() {
        return dir;
    }
}