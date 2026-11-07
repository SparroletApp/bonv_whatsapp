package com.example.whatsapp.repository;

import com.example.whatsapp.entity.TemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TemplateRepository extends JpaRepository<TemplateEntity, Long> {
    List<TemplateEntity> findAllByOrderByCreatedAtDesc();
    List<TemplateEntity> findByStatusOrderByCreatedAtDesc(String status);
    boolean existsByNameAndLanguage(String name, String language);
    Optional<TemplateEntity> findByNameAndLanguage(String name, String language);
    Optional<TemplateEntity> findByMetaTemplateId(String metaTemplateId);
    List<TemplateEntity> findByName(String name);
}
