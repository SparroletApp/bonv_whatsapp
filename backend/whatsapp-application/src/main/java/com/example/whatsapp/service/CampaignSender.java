package com.example.whatsapp.service;

import com.example.whatsapp.client.WhatsappClient;
import com.example.whatsapp.entity.CampaignEntity;
import com.example.whatsapp.entity.WhatsappEntity;
import com.example.whatsapp.repository.CampaignRepository;
import com.example.whatsapp.repository.WhatsappRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CampaignSender {

    private final CampaignRepository campaignRepo;
    private final WhatsappRepository messageRepo;
    private final WhatsappClient client;
    private final ObjectMapper mapper;

    @Async("campaignExecutor")
    public void sendAsync(Long campaignId) {
        CampaignEntity campaign = campaignRepo.findById(campaignId).orElse(null);
        if (campaign == null) return;

        campaign.setStartedAt(LocalDateTime.now());
        campaignRepo.save(campaign);

        List<WhatsappEntity> pending =
                messageRepo.findByCampaignIdAndStatusOrderByIdAsc(campaignId, "PENDING");

        for (WhatsappEntity m : pending) {
            try {
                m.setStatus("PROCESSING");
                messageRepo.save(m);

                List<String> params = mapper.readValue(
                        m.getTemplateParams() == null ? "[]" : m.getTemplateParams(),
                        new TypeReference<List<String>>() {});

                String wamid = client.sendTemplate(
                        m.getRecipientPhone(),
                        m.getTemplateName(),
                        m.getLanguageCode(),
                        params,
                        m.getHeaderType(),
                        m.getHeaderMediaUrl());

                m.setWhatsappMessageId(wamid);
                m.setStatus("SENT");
                m.setSentAt(LocalDateTime.now());
                m.setErrorMessage(null);
            } catch (Exception e) {
                log.warn("Campaign {} – send to {} failed: {}", campaignId, m.getRecipientPhone(), e.getMessage());
                m.setStatus("FAILED");
                String err = e.getMessage();
                m.setErrorMessage(err != null && err.length() > 1000 ? err.substring(0, 1000) : err);
            }
            messageRepo.save(m);

            try {
                Thread.sleep(120);          // ~8 msgs/sec, gentle on Meta's rate limits
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        campaign.setStatus("COMPLETED");
        campaign.setCompletedAt(LocalDateTime.now());
        campaignRepo.save(campaign);
    }
}