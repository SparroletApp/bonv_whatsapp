package com.example.whatsapp.controller;

import com.example.whatsapp.dto.campaign.*;
import com.example.whatsapp.service.CampaignSender;
import com.example.whatsapp.service.CampaignService;
import com.example.whatsapp.service.MediaStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService service;
    private final CampaignSender sender;
    private final MediaStorageService mediaStorage;


    /** Uploads the header image/video/document and returns its public HTTPS URL. */
    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadMedia(@RequestParam("file") MultipartFile file)
            throws IOException {
        return Map.of("url", mediaStorage.save(file));
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

    @PostMapping
    public ResponseEntity<CampaignResponse> create(@Valid @RequestBody CampaignCreateRequest req) {
        CampaignResponse created = service.create(req);   // committed when this returns

        // Scheduled campaigns are started later by CampaignScheduler
        if (!"SCHEDULED".equals(created.status())) {
            startSending(created.id());
        }

        return ResponseEntity.ok(created);
    }
    /** Restart sending for a campaign whose messages are still PENDING/PROCESSING (e.g. after a redeploy). */
    @PostMapping("/{id}/resume")
    public ResponseEntity<CampaignResponse> resume(@PathVariable("id") Long id) {
        CampaignResponse c = service.get(id);              // 400 "Campaign not found" if the id is wrong
        if (c.pending() == 0) {
            throw new IllegalArgumentException("Nothing left to send for this campaign");
        }
        startSending(id);
        return ResponseEntity.ok(c);
    }

    @PostMapping("/{id}/cancel")
    public CampaignResponse cancel(@PathVariable("id") Long id) {
        return service.cancel(id);
    }

    private void startSending(Long campaignId) {
        try {
            sender.sendAsync(campaignId);                  // runs in the background
        } catch (Exception e) {
            // e.g. executor queue full or missing; the campaign exists, so don't lose it
            log.error("Could not start sending for campaign {}", campaignId, e);
            throw new IllegalStateException(
                    "Campaign was created but sending could not start. Open it and use Resume.");
        }
    }
}