package com.example.whatsapp.service;

import com.example.whatsapp.entity.WhatsappEntity;
import com.example.whatsapp.repository.WhatsappRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private static final Map<String, Integer> RANK = Map.of(
            "PENDING", 0, "PROCESSING", 1, "SENT", 2, "DELIVERED", 3, "READ", 4);

    private final WhatsappRepository repo;
    private final TemplateService templateService;
    private final ObjectMapper mapper;

    public void handle(String rawBody) {
        try {
            JsonNode root = mapper.readTree(rawBody);
            for (JsonNode entry : root.path("entry")) {
                for (JsonNode change : entry.path("changes")) {
                    JsonNode value = change.path("value");
                    switch (change.path("field").asText()) {
                        case "messages" -> {
                            handleStatuses(value.path("statuses"));
                            handleInbound(value);
                        }
                        case "message_template_status_update" -> templateService.applyWebhookStatus(
                                value.path("message_template_id").asText(null),
                                value.path("message_template_name").asText(null),
                                value.path("event").asText(null),
                                value.path("reason").asText(null));
                        default -> log.debug("Ignored webhook field {}", change.path("field").asText());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Webhook processing failed", e);
        }
    }
    private void handleStatuses(JsonNode statuses) {
        for (JsonNode s : statuses) {
            String wamid = s.path("id").asText();
            String status = s.path("status").asText();
            long ts = s.path("timestamp").asLong(0);
            LocalDateTime when = ts > 0 ? toLocal(ts) : LocalDateTime.now();

            repo.findByWhatsappMessageId(wamid).ifPresent(m -> {
                switch (status) {
                    case "sent" -> upgrade(m, "SENT");
                    case "delivered" -> {
                        upgrade(m, "DELIVERED");
                        if (m.getDeliveredAt() == null) m.setDeliveredAt(when);
                    }
                    case "read" -> {
                        upgrade(m, "READ");
                        if (m.getDeliveredAt() == null) m.setDeliveredAt(when);
                        m.setReadAt(when);
                    }
                    case "failed" -> {
                        m.setStatus("FAILED");
                        JsonNode err = s.path("errors").path(0);
                        m.setErrorMessage(err.path("title").asText(err.path("message").asText("Delivery failed")));
                    }
                    default -> { }
                }
                repo.save(m);
            });
        }
    }

    private void upgrade(WhatsappEntity m, String next) {
        int cur = RANK.getOrDefault(m.getStatus(), -1);
        if (RANK.get(next) > cur) m.setStatus(next);     // never go READ -> DELIVERED
    }

    // ---- incoming customer messages ----
    private void handleInbound(JsonNode value) {
        Map<String, String> names = new HashMap<>();
        for (JsonNode c : value.path("contacts")) {
            names.put(c.path("wa_id").asText(), c.path("profile").path("name").asText(null));
        }

        for (JsonNode msg : value.path("messages")) {
            String wamid = msg.path("id").asText();
            if (repo.findByWhatsappMessageId(wamid).isPresent()) continue;   // Meta may retry

            String from = msg.path("from").asText();
            String type = msg.path("type").asText("unknown");

            WhatsappEntity m = new WhatsappEntity();
            m.setDirection("INBOUND");
            m.setStatus("RECEIVED");
            m.setAgentRead(false);
            m.setWhatsappMessageId(wamid);
            m.setRecipientPhone(from);
            String profile = names.get(from);
            m.setRecipientName(profile == null || profile.isBlank() ? from : profile);
            m.setMessageType(type.toUpperCase());
            m.setMessage(extractText(msg, type));
            long ts = msg.path("timestamp").asLong(0);
            if (ts > 0) m.setSentAt(toLocal(ts));
            repo.save(m);
        }
    }

    private String extractText(JsonNode msg, String type) {
        return switch (type) {
            case "text" -> msg.path("text").path("body").asText();
            case "button" -> msg.path("button").path("text").asText();
            case "interactive" -> {
                JsonNode i = msg.path("interactive");
                yield i.path("button_reply").path("title")
                        .asText(i.path("list_reply").path("title").asText("[interactive]"));
            }
            case "image", "video", "document", "audio", "sticker" -> {
                String caption = msg.path(type).path("caption").asText("");
                yield "[" + type + "]" + (caption.isEmpty() ? "" : " " + caption);
            }
            case "location" -> "[location] " + msg.path("location").path("name").asText("");
            default -> "[" + type + " message]";
        };
    }

    private LocalDateTime toLocal(long epochSeconds) {
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSeconds), ZoneId.systemDefault());
    }
}