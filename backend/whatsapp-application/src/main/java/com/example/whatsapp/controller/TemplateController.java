
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

    @GetMapping
    public ResponseEntity<List<TemplateResponse>> list(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(
                service.listFromMeta(companyId, status)
        );
    }

    @PostMapping
    public ResponseEntity<TemplateResponse> create(
            @RequestHeader("X-Company-Id") Long companyId,
            @Valid @RequestBody TemplateCreateRequestDto req
    ) {
        return ResponseEntity.ok(
                service.create(companyId, req)
        );
    }

    @PostMapping(
            value = "/media-sample",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadSample(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestParam("type") String type,
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        String handle = service.uploadMediaSample(
                companyId,
                type,
                file
        );

        return ResponseEntity.ok(
                Map.of("handle", handle)
        );
    }

    @PostMapping("/sync")
    public ResponseEntity<List<TemplateResponse>> sync(
            @RequestHeader("X-Company-Id") Long companyId
    ) {
        return ResponseEntity.ok(
                service.sync(companyId)
        );
    }
}
