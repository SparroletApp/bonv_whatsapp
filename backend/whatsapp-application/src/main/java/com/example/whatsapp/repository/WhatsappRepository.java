package com.example.whatsapp.repository;

import com.example.whatsapp.entity.WhatsappEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhatsappRepository extends JpaRepository<WhatsappEntity, Long> {

    List<WhatsappEntity> findByStatusOrderByCreatedAtDesc(String status);

    List<WhatsappEntity> findAllByOrderByCreatedAtDesc();

    Optional<WhatsappEntity> findByWhatsappMessageId(String whatsappMessageId);

    List<WhatsappEntity> findByCampaignIdOrderByIdAsc(Long campaignId);

    List<WhatsappEntity> findByCampaignIdAndStatusOrderByIdAsc(Long campaignId, String status);

    List<WhatsappEntity> findByRecipientPhoneOrderByCreatedAtAsc(String recipientPhone);

    Optional<WhatsappEntity> findFirstByRecipientPhoneAndDirectionOrderByCreatedAtDesc(
            String recipientPhone, String direction);

    @Query("select m.status, count(m) from WhatsappEntity m where m.campaignId = :cid group by m.status")
    List<Object[]> statusCounts(@Param("cid") Long campaignId);

    @Query(value = "SELECT DISTINCT ON (recipient_phone) * FROM whatsapp_messages " +
            "ORDER BY recipient_phone, created_at DESC", nativeQuery = true)
    List<WhatsappEntity> findLatestPerPhone();

    @Query("select m.recipientPhone, count(m) from WhatsappEntity m " +
            "where m.direction = 'INBOUND' and m.agentRead = false group by m.recipientPhone")
    List<Object[]> unreadCounts();

    @Modifying
    @Query("update WhatsappEntity m set m.agentRead = true " +
            "where m.recipientPhone = :phone and m.direction = 'INBOUND' and m.agentRead = false")
    int markConversationRead(@Param("phone") String phone);
}