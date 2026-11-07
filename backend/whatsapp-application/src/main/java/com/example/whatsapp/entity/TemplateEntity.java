package com.example.whatsapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "whatsapp_templates")
@Getter
@Setter
public class TemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 20)
    private String language;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(length = 255)
    private String headerText;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body = "";

    @Column(length = 255)
    private String footerText;

    @Column(columnDefinition = "TEXT")
    private String buttonsJson;

    @Column(nullable = false)
    private int variableCount;

    @Column(length = 100)
    private String metaTemplateId;

    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
