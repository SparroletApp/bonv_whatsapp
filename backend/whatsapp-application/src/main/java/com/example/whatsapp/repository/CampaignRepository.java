package com.example.whatsapp.repository;

import com.example.whatsapp.entity.CampaignEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignRepository extends JpaRepository<CampaignEntity, Long> {
    List<CampaignEntity> findAllByOrderByCreatedAtDesc();
}