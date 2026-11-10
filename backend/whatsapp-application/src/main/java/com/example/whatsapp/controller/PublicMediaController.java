
package com.example.whatsapp.controller;

import com.example.whatsapp.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
public class PublicMediaController {

    private final MediaStorageService mediaStorageService;

    @GetMapping("/public/media/{filename:.+}")
    public ResponseEntity<Resource> getMedia(
            @PathVariable String filename
    ) {
        try {
            if (filename.contains("/")
                    || filename.contains("\\")
                    || filename.equals(".")
                    || filename.equals("..")) {
                return ResponseEntity.badRequest().build();
            }

            Path directory = mediaStorageService.directory();
            Path file = directory.resolve(filename).normalize();

            if (!file.startsWith(directory)
                    || !Files.isRegularFile(file)
                    || !Files.isReadable(file)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(file.toUri());

            MediaType contentType = MediaTypeFactory
                    .getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);

            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + filename + "\""
                    )
                    .header("X-Content-Type-Options", "nosniff")
                    .cacheControl(
                            CacheControl.maxAge(7, TimeUnit.DAYS)
                                    .cachePublic()
                    )
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
