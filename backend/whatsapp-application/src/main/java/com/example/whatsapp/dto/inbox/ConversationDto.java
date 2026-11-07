package com.example.whatsapp.dto.inbox;

import java.time.LocalDateTime;

public record ConversationDto(String phone, String name, String lastMessage,
                              LocalDateTime lastMessageAt, String lastDirection, long unreadCount) {}
