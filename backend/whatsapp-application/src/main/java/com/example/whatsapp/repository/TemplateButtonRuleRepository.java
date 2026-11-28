package com.example.whatsapp.repository;

import com.example.whatsapp.entity.TemplateButtonRule;
import com.example.whatsapp.entity.TemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TemplateButtonRuleRepository
        extends JpaRepository<TemplateButtonRule, Long> {

    Optional<TemplateButtonRule> findBySourceTemplate_IdAndButtonIndexAndCompany_Id(
            Long sourceTemplateId,
            int buttonIndex,
            Long companyId
    );

    List<TemplateButtonRule> findBySourceTemplate_IdAndCompany_IdOrderByButtonIndex(
            Long sourceTemplateId,
            Long companyId
    );

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from TemplateButtonRule r where r.sourceTemplate.id = :id")
    void deleteBySource(@Param("id") Long id);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from TemplateButtonRule r "
            + "where r.sourceTemplate in :templates "
            + "or r.targetTemplate in :templates")
    void deleteByAnyTemplateIn(
            @Param("templates") Collection<TemplateEntity> templates
    );
}