package com.example.whatsapp.service;

import com.example.whatsapp.entity.CampaignEntity;
import com.example.whatsapp.repository.CampaignRepository;
import com.example.whatsapp.util.AppTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Every 30 seconds, starts campaigns whose scheduled time has arrived.
 * Also catches up after downtime, because it uses "<=".
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CampaignScheduler {

    private final CampaignRepository campaignRepo;
    private final CampaignSender sender;

    @Scheduled(fixedDelay = 30_000)
    public void startDueCampaigns() {

        LocalDateTime now = AppTime.now();

        for (CampaignEntity c :
                campaignRepo.findByStatusAndScheduledAtLessThanEqual("SCHEDULED", now)) {

            try {
                // claim() flips SCHEDULED -> RUNNING; returns 1 only for the caller that wins,
                // so a campaign can never be started twice (e.g. two server instances).
                if (campaignRepo.claim(c.getId(), now) == 1) {
                    sender.sendAsync(c.getId());
                    log.info("Started scheduled campaign {}", c.getId());
                }
            } catch (Exception e) {
                log.error("Could not start scheduled campaign {}", c.getId(), e);
            }
        }
    }
}