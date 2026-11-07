package com.example.whatsapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns")
@Getter
@Setter
public class CampaignEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private Long templateId;

    @Column(nullable = false, length = 150)
    private String templateName;

    @Column(length = 500)
    private String categoryIds;              // "1,2,3"

    @Column(columnDefinition = "TEXT")
    private String variableMapping;          // JSON array

    @Column(nullable = false, length = 30)
    private String status = "RUNNING";       // RUNNING, COMPLETED

    @Column(nullable = false)
    private int totalCount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }
}
