package com.example.whatsapp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "template_media_sample")
@Getter
@Setter
@NoArgsConstructor
public class TemplateMediaSampleEntity {

    @Id
    @Column(name = "meta_handle", columnDefinition = "text")
    private String metaHandle;

    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(name = "public_url", nullable = false, columnDefinition = "text")
    private String publicUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}