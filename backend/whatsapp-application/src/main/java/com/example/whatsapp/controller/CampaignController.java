package com.example.whatsapp.controller;

import com.example.whatsapp.dto.campaign.*;
import com.example.whatsapp.service.CampaignSender;
import com.example.whatsapp.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService service;
    private final CampaignSender sender;

    @PostMapping
    public ResponseEntity<CampaignResponse> create(@Valid @RequestBody CampaignCreateRequest req) {
        CampaignResponse created = service.create(req);   // committed when this returns
        startSending(created.id());
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public List<CampaignResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public CampaignResponse get(@PathVariable("id") Long id) {
        return service.get(id);
    }

    @GetMapping("/{id}/messages")
    public List<CampaignMessageDto> messages(@PathVariable("id") Long id) {
        return service.messages(id);
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<CampaignResponse> resume(@PathVariable("id") Long id) {
        CampaignResponse c = service.get(id);              // 400 "Campaign not found" if the id is wrong
        if (c.pending() == 0) {
            throw new IllegalArgumentException("Nothing left to send for this campaign");
        }
        startSending(id);
        return ResponseEntity.ok(c);
    }


    private void startSending(Long campaignId) {
        try {
            sender.sendAsync(campaignId);                  // runs in the background
        } catch (Exception e) {
            log.error("Could not start sending for campaign {}", campaignId, e);
            throw new IllegalStateException(
                    "Campaign was created but sending could not start. Open it and use Resume.");
        }
    }
}