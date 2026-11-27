
package com.example.whatsapp.repository;

import com.example.whatsapp.entity.TemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TemplateRepository extends JpaRepository<TemplateEntity, Long> {

    List<TemplateEntity> findAllByCompany_IdOrderByCreatedAtDesc(Long companyId);

    List<TemplateEntity> findByCompany_IdAndStatusOrderByCreatedAtDesc(
            Long companyId,
            String status
    );

    boolean existsByNameAndLanguageAndCompany_Id(
            String name,
            String language,
            Long companyId
    );

    Optional<TemplateEntity> findByNameAndLanguageAndCompany_Id(
            String name,
            String language,
            Long companyId
    );

    Optional<TemplateEntity> findByMetaTemplateIdAndCompany_Id(
            String metaTemplateId,
            Long companyId
    );

    List<TemplateEntity> findByNameAndCompany_Id(
            String name,
            Long companyId
    );

    Optional<TemplateEntity> findByHeaderMediaHandle(String headerMediaHandle);
}
