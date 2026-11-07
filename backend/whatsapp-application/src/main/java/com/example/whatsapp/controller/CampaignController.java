package com.example.whatsapp.controller;

import com.example.whatsapp.dto.campaign.*;
import com.example.whatsapp.service.CampaignSender;
import com.example.whatsapp.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService service;
    private final CampaignSender sender;

    @PostMapping
    public ResponseEntity<CampaignResponse> create(@Valid @RequestBody CampaignCreateRequest req) {
        CampaignResponse created = service.create(req);   // committed here
        sender.sendAsync(created.id());                   // runs in background
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public List<CampaignResponse> list() { return service.list(); }

    @GetMapping("/{id}")
    public CampaignResponse get(@PathVariable Long id) { return service.get(id); }

    @GetMapping("/{id}/messages")
    public List<CampaignMessageDto> messages(@PathVariable Long id) { return service.messages(id); }
}