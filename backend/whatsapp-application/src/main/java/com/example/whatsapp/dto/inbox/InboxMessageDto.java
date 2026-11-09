package com.example.whatsapp.dto.inbox;

import java.time.LocalDateTime;

public record InboxMessageDto(
        Long id, String direction, String text, String status,
        String templateName, String messageType, String errorMessage,
        LocalDateTime createdAt,
        String mediaId, String mimeType
) {}