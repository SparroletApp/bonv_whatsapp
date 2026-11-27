package com.example.whatsapp.repository;

import com.example.whatsapp.entity.CampaignEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface CampaignRepository extends JpaRepository<CampaignEntity, Long> {

    List<CampaignEntity> findAllByOrderByCreatedAtDesc();
    List<CampaignEntity> findByStatusAndScheduledAtLessThanEqual(String status, LocalDateTime now);
    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("update CampaignEntity c set c.status = 'RUNNING', c.startedAt = :now " +
            "where c.id = :id and c.status = 'SCHEDULED'")
    int claim(@Param("id") Long id, @Param("now") LocalDateTime now);


    List<CampaignEntity> findAllByCompany_IdOrderByCreatedAtDesc(Long companyId);
}