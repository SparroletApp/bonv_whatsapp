package com.example.whatsapp.dto.whatsappdto;


import java.time.LocalDateTime;
public record TemplateResponse(

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
        String headerType,
        String headerMediaHandle,
        String headerMediaUrl
) {
}