package com.example.whatsapp.controller;

import com.example.whatsapp.dto.inbox.*;
import com.example.whatsapp.service.InboxService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/inbox")
@RequiredArgsConstructor
public class InboxController {

    private final InboxService service;

    @GetMapping("/conversations")
    public List<ConversationDto> conversations() { return service.conversations(); }

    @GetMapping("/conversations/{phone}/messages")
    public List<InboxMessageDto> messages(@PathVariable String phone) { return service.messages(phone); }

    @PostMapping("/conversations/{phone}/read")
    public ResponseEntity<Void> markRead(@PathVariable String phone) {
        service.markRead(phone);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/conversations/{phone}/reply")
    public InboxMessageDto reply(@PathVariable String phone, @Valid @RequestBody ReplyRequest req) {
        return service.reply(phone, req.message());
    }

    @PostMapping(value = "/conversations/{phone}/reply-media",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public InboxMessageDto replyMedia(@PathVariable String phone,
                                      @RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "caption", required = false) String caption) {
        return service.replyMedia(phone, file, caption);
    }

    @GetMapping("/media/{mediaId}")
    public ResponseEntity<byte[]> media(@PathVariable String mediaId) {
        var f = service.media(mediaId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.mimeType()))
                .header("Cache-Control", "private, max-age=3600")
                .body(f.data());
    }

    @PostMapping("/conversations/{phone}/send-template")
    public ResponseEntity<?> sendTemplate(
            @PathVariable String phone,
            @RequestBody InboxTemplateRequestDto request
    ) {
        return ResponseEntity.ok(
                inboxService.sendTemplate(phone, request)
        );
    }
}