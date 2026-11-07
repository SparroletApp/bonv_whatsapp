
package com.example.whatsapp.controller;

import com.example.whatsapp.dto.whatsappdto.WhatsappRequestDto;
import com.example.whatsapp.dto.whatsappdto.WhatsappResponseDto;
import com.example.whatsapp.service.WhatsappService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/whatsapp")
@RequiredArgsConstructor
public class WhatsappController {

    private final WhatsappService whatsappService;

    @PostMapping("/bulk-send")
    public ResponseEntity<List<WhatsappResponseDto>> sendBulkMessages(
            @Valid
            @RequestBody
            @Size(min = 1, max = 500, message = "Upload between 1 and 500 contacts")
            List<@Valid WhatsappRequestDto> requests) {

        List<WhatsappResponseDto> responses =
                whatsappService.sendBulkMessages(requests);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/all")
    public ResponseEntity<List<WhatsappResponseDto>> getAllMessages() {

        return ResponseEntity.ok(
                whatsappService.getAllMessages()
        );
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<WhatsappResponseDto>> getMessagesByStatus(
            @PathVariable String status) {

        List<String> allowedStatuses = List.of(
                "PENDING", "PROCESSING", "SENT", "DELIVERED", "READ", "FAILED", "RECEIVED");

        if (!allowedStatuses.contains(status.toUpperCase())) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                whatsappService.getMessagesByStatus(status)
        );
    }
}
