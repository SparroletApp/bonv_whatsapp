package com.example.whatsapp.dto.campaign;

import java.time.LocalDateTime;

public record CampaignMessageDto(Long id, String recipientName, String recipientPhone,
                                 String status, String errorMessage,
                                 LocalDateTime sentAt, LocalDateTime deliveredAt,
                                 LocalDateTime readAt) {}
