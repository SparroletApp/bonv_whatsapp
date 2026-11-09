package com.example.whatsapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "whatsapp_messages")
@Getter
@Setter
public class WhatsappEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String recipientName;

    @Column(nullable = false, length = 20)
    private String recipientPhone;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 150)
    private String templateName;

    @Column(nullable = false, length = 30)
    private String status = "PENDING";   // PENDING, PROCESSING, SENT, DELIVERED, READ, FAILED, RECEIVED

    @Column(length = 255)
    private String whatsappMessageId;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private LocalDateTime sentAt;

    @Column(nullable = false, length = 10)
    private String direction = "OUTBOUND";   // OUTBOUND / INBOUND

    private Long campaignId;

    @Column(length = 20)
    private String languageCode;

    @Column(columnDefinition = "TEXT")
    private String templateParams;           // JSON array of body variables

    @Column(length = 20)
    private String headerType;               // NONE / TEXT / IMAGE / VIDEO / DOCUMENT

    @Column(length = 1000)
    private String headerMediaUrl;           // https URL or uploaded media ID

    @Column(nullable = false, length = 30)
    private String messageType = "TEXT";

    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;

    @Column(nullable = false)
    private boolean agentRead = true;        // false for unread inbound messages

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String mediaId;
    private String mimeType;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}