package com.example.whatsapp.dto.campaign;

import java.time.LocalDateTime;

public record CampaignResponse(Long id, String name, String templateName, String status,
                               long total, long pending, long sent, long delivered, long read,
                               long failed, long replied,
                               LocalDateTime createdAt, LocalDateTime completedAt) {}
