package com.example.whatsapp.controller;

import com.example.whatsapp.dto.inbox.*;
import com.example.whatsapp.service.InboxService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}