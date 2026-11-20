
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
    public List<ConversationDto> conversations(
            @RequestParam Long companyId
    ) {
        return service.conversations(companyId);
    }

    @GetMapping("/conversations/{phone}/messages")
    public List<InboxMessageDto> messages(
            @RequestParam Long companyId,
            @PathVariable String phone
    ) {
        return service.messages(companyId, phone);
    }

    @PostMapping("/conversations/{phone}/read")
    public ResponseEntity<Void> markRead(
            @RequestParam Long companyId,
            @PathVariable String phone
    ) {
        service.markRead(companyId, phone);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/conversations/{phone}/reply")
    public InboxMessageDto reply(
            @PathVariable String phone,
            @Valid @RequestBody ReplyRequest req
    ) {
        return service.reply(req.companyId(), phone, req.message());
    }

    @PostMapping(
            value = "/conversations/{phone}/reply-media",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public InboxMessageDto replyMedia(
            @PathVariable String phone,
            @RequestParam Long companyId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption
    ) {
        return service.replyMedia(companyId, phone, file, caption);
    }

    @GetMapping("/media/{mediaId}")
    public ResponseEntity<byte[]> media(
            @RequestParam Long companyId,
            @PathVariable String mediaId
    ) {
        var f = service.media(companyId, mediaId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.mimeType()))
                .header("Cache-Control", "private, max-age=3600")
                .body(f.data());
    }

    @PostMapping("/conversations/{phone}/send-template")
    public ResponseEntity<InboxMessageDto> sendTemplate(
            @PathVariable String phone,
            @Valid @RequestBody InboxTemplateRequestDto request
    ) {
        return ResponseEntity.ok(
                service.sendTemplate(request.getCompanyId(), phone, request)
        );
    }
}
