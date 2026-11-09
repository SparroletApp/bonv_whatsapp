package com.example.whatsapp.service;

import com.example.whatsapp.client.WhatsappClient;
import com.example.whatsapp.dto.inbox.*;
import com.example.whatsapp.entity.WhatsappEntity;
import com.example.whatsapp.repository.WhatsappRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InboxService {

    private static final long WINDOW_HOURS = 24;

    private static final ZoneId INDIA_ZONE =
            ZoneId.of("Asia/Kolkata");

    private final WhatsappRepository repo;
    private final WhatsappClient client;

    private final Clock clock =
            Clock.system(INDIA_ZONE);

    private LocalDateTime currentTime() {
        return LocalDateTime.now(clock);
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> conversations() {

        Map<String, Long> unread = new HashMap<>();

        for (Object[] r : repo.unreadCounts()) {
            unread.put((String) r[0], (Long) r[1]);
        }

        Map<String, LocalDateTime> lastInbound = new HashMap<>();

        for (Object[] r : repo.lastInboundTimes()) {
            lastInbound.put((String) r[0], (LocalDateTime) r[1]);
        }

        return repo.findLatestPerPhone()
                .stream()
                .map(m -> {

                    LocalDateTime inboundTime =
                            lastInbound.get(m.getRecipientPhone());

                    LocalDateTime expiresAt =
                            inboundTime == null
                                    ? null
                                    : inboundTime.plusHours(WINDOW_HOURS);

                    return new ConversationDto(
                            m.getRecipientPhone(),
                            m.getRecipientName(),
                            preview(m),
                            m.getCreatedAt(),
                            m.getDirection(),
                            unread.getOrDefault(
                                    m.getRecipientPhone(), 0L
                            ),
                            inboundTime,
                            expiresAt
                    );
                })
                .sorted(
                        Comparator.comparing(
                                ConversationDto::lastMessageAt
                        ).reversed()
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InboxMessageDto> messages(String phone) {

        return repo.findByRecipientPhoneOrderByCreatedAtAsc(phone)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void markRead(String phone) {
        repo.markConversationRead(phone);
    }

    @Transactional
    public InboxMessageDto reply(String phone, String text) {

        WhatsappEntity lastIn = repo
                .findFirstByRecipientPhoneAndDirectionOrderByCreatedAtDesc(
                        phone, "INBOUND"
                )
                .orElseThrow(() -> new IllegalStateException(
                        "This contact has not messaged you yet. Send a template first."
                ));

        LocalDateTime expiry =
                lastIn.getCreatedAt().plusHours(WINDOW_HOURS);

        if (!currentTime().isBefore(expiry)) {
            throw new IllegalStateException(
                    "The 24-hour reply window is closed. Send an approved template instead."
            );
        }

        WhatsappEntity out = new WhatsappEntity();

        out.setRecipientName(lastIn.getRecipientName());
        out.setRecipientPhone(phone);
        out.setMessage(text);
        out.setMessageType("TEXT");
        out.setDirection("OUTBOUND");
        out.setStatus("PROCESSING");

        try {
            out.setWhatsappMessageId(client.sendText(phone, text));
            out.setStatus("SENT");
            out.setSentAt(currentTime());

        } catch (Exception e) {
            out.setStatus("FAILED");
            out.setErrorMessage(e.getMessage());
        }

        return toDto(repo.save(out));
    }

    private String preview(WhatsappEntity m) {

        if (m.getMessage() != null && !m.getMessage().isBlank()) {
            return m.getMessage();
        }

        return m.getTemplateName() != null
                ? "[template] " + m.getTemplateName()
                : "[" + m.getMessageType() + "]";
    }

    private InboxMessageDto toDto(WhatsappEntity m) {

        return new InboxMessageDto(
                m.getId(),
                m.getDirection(),
                preview(m),
                m.getStatus(),
                m.getTemplateName(),
                m.getMessageType(),
                m.getErrorMessage(),
                m.getCreatedAt()
        );
    }
}