package com.example.whatsapp.controller;

import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.example.whatsapp.service.GarageStorageService;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

@RestController
@RequiredArgsConstructor
public class TemplateMediaController {

    private final GarageStorageService storage;

    @GetMapping("/public/template-media/{filename:.+}")
    public ResponseEntity<byte[]> get(@PathVariable String filename) {

        if (!filename.matches("[A-Za-z0-9-]{36}\\.(jpg|png)")) {
            return ResponseEntity.badRequest().build();
        }

        try {
            byte[] data = storage.getObjectBytes("template-media/" + filename);

            MediaType type = filename.endsWith(".png")
                    ? MediaType.IMAGE_PNG
                    : MediaType.IMAGE_JPEG;

            return ResponseEntity.ok()
                    .contentType(type)
                    .header("X-Content-Type-Options", "nosniff")
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                    .body(data);

        } catch (NoSuchKeyException e) {
            return ResponseEntity.notFound().build();
        }
    }
}