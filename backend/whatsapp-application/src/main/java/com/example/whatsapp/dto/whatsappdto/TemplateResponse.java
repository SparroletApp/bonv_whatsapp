package com.example.whatsapp.dto.whatsappdto;


import java.time.LocalDateTime;
public record TemplateResponse(
        // Keep all your existing 12 fields in their current order

        Long id,
        String name,
        String language,
        String category,
        String headerText,
        String body,
        String footerText,
        String buttonsJson,
        int parameterCount,
        String status,
        String rejectionReason,
        LocalDateTime createdAt,

        // Add these three fields
        String headerType,
        String headerMediaHandle,
        String headerMediaUrl
) {
}