package com.example.whatsapp.repository;

import com.example.whatsapp.entity.TemplateMediaSampleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateMediaSampleRepository
        extends JpaRepository<TemplateMediaSampleEntity, String> {
}