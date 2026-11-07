package com.example.whatsapp.controller;

import com.example.whatsapp.dto.whatsappdto.TemplateCreateRequestDto;
import com.example.whatsapp.dto.whatsappdto.TemplateResponse;
import com.example.whatsapp.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService service;

    @GetMapping
    public List<TemplateResponse> list(@RequestParam(required = false) String status) {
        return service.list(status);
    }

    @PostMapping
    public ResponseEntity<TemplateResponse> create(@Valid @RequestBody TemplateCreateRequestDto req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PostMapping("/sync")
    public List<TemplateResponse> sync() {
        return service.sync();
    }
}