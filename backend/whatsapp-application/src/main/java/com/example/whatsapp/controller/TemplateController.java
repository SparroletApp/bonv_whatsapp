
package com.example.whatsapp.controller;

import com.example.whatsapp.dto.whatsappdto.TemplateCreateRequestDto;
import com.example.whatsapp.dto.whatsappdto.TemplateResponse;
import com.example.whatsapp.service.TemplateService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService service;

    // ==========================================
    // GET ALL TEMPLATES
    // ==========================================

    @GetMapping
    public ResponseEntity<List<TemplateResponse>> list(
            @RequestParam(required = false) String status
    ) {

        return ResponseEntity.ok(
                service.list(status)
        );
    }

    // ==========================================
    // CREATE WHATSAPP TEMPLATE
    // ==========================================

    @PostMapping
    public ResponseEntity<TemplateResponse> create(
            @Valid @RequestBody TemplateCreateRequestDto req
    ) {

        return ResponseEntity.ok(
                service.create(req)
        );
    }


    @PostMapping(
            value = "/media-sample",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadSample(
            @RequestParam("type") String type,
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        String handle = service.uploadMediaSample(type, file);

        return ResponseEntity.ok(
                Map.of("handle", handle)
        );
    }

    // ==========================================
    // SYNC TEMPLATES FROM META
    // ==========================================

    @PostMapping("/sync")
    public ResponseEntity<List<TemplateResponse>> sync() {

        return ResponseEntity.ok(
                service.sync()
        );
    }
}
