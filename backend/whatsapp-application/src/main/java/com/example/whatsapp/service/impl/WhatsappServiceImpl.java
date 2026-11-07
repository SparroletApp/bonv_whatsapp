
package com.example.whatsapp.service.impl;

import com.example.whatsapp.config.WhatsappConfig;
import com.example.whatsapp.dto.whatsappdto.WhatsappRequestDto;
import com.example.whatsapp.dto.whatsappdto.WhatsappResponseDto;
import com.example.whatsapp.entity.WhatsappEntity;
import com.example.whatsapp.repository.WhatsappRepository;
import com.example.whatsapp.service.WhatsappService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WhatsappServiceImpl implements WhatsappService {

    private final WhatsappRepository whatsappRepository;
    private final WhatsappConfig whatsappConfig;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Override
    public List<WhatsappResponseDto> sendBulkMessages(
            List<WhatsappRequestDto> requests) {

        List<WhatsappResponseDto> responses = new ArrayList<>();

        for (WhatsappRequestDto request : requests) {

            WhatsappEntity entity = new WhatsappEntity();

            entity.setRecipientName(request.getRecipientName().trim());
            entity.setRecipientPhone(request.getRecipientPhone().trim());
            entity.setMessage(request.getMessage());
            entity.setTemplateName(request.getTemplateName());
            entity.setStatus("PENDING");

            entity = whatsappRepository.save(entity);

            try {

                validateMessage(request);

                entity.setStatus("PROCESSING");
                whatsappRepository.save(entity);

                ObjectNode payload = buildPayload(request);

                String requestBody = objectMapper.writeValueAsString(payload);

                String url = whatsappConfig.getBaseUrl()
                        + "/"
                        + whatsappConfig.getApiVersion()
                        + "/"
                        + whatsappConfig.getPhoneNumberId()
                        + "/messages";

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(30))
                        .header(
                                "Authorization",
                                "Bearer " + whatsappConfig.getAccessToken()
                        )
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> httpResponse = httpClient.send(
                        httpRequest,
                        HttpResponse.BodyHandlers.ofString()
                );

                JsonNode responseJson =
                        objectMapper.readTree(httpResponse.body());

                if (httpResponse.statusCode() >= 200
                        && httpResponse.statusCode() < 300) {

                    String messageId = null;

                    JsonNode messages = responseJson.path("messages");

                    if (messages.isArray() && !messages.isEmpty()) {
                        messageId = messages.get(0)
                                .path("id")
                                .asText(null);
                    }

                    if (messageId == null || messageId.isBlank()) {
                        throw new RuntimeException(
                                "WhatsApp API did not return a message ID"
                        );
                    }

                    entity.setWhatsappMessageId(messageId);
                    entity.setStatus("SENT");
                    entity.setSentAt(LocalDateTime.now());
                    entity.setErrorMessage(null);

                } else {

                    String error = responseJson.path("error")
                            .path("message")
                            .asText(httpResponse.body());

                    entity.setStatus("FAILED");
                    entity.setErrorMessage(error);
                }

            } catch (Exception e) {

                entity.setStatus("FAILED");
                entity.setErrorMessage(e.getMessage());
            }

            WhatsappEntity saved = whatsappRepository.save(entity);

            responses.add(mapResponse(saved));
        }

        return responses;
    }

    private void validateMessage(WhatsappRequestDto request) {

        boolean hasText = request.getMessage() != null
                && !request.getMessage().isBlank();

        boolean hasTemplate = request.getTemplateName() != null
                && !request.getTemplateName().isBlank();

        if (hasText == hasTemplate) {
            throw new IllegalArgumentException(
                    "Provide either a text message or a template name, not both."
            );
        }

        if (hasTemplate &&
                (request.getLanguageCode() == null
                        || request.getLanguageCode().isBlank())) {
            throw new IllegalArgumentException(
                    "Template language code is required."
            );
        }
    }

    private ObjectNode buildPayload(WhatsappRequestDto request) {

        ObjectNode payload = objectMapper.createObjectNode();

        payload.put("messaging_product", "whatsapp");
        payload.put("recipient_type", "individual");

        // WhatsApp expects the country code without a leading +
        payload.put(
                "to",
                request.getRecipientPhone().replaceAll("[^0-9]", "")
        );

        if (request.getTemplateName() != null
                && !request.getTemplateName().isBlank()) {

            payload.put("type", "template");

            ObjectNode template = payload.putObject("template");

            template.put("name", request.getTemplateName());

            ObjectNode language = template.putObject("language");

            language.put("code", request.getLanguageCode());

        } else {

            payload.put("type", "text");

            ObjectNode text = payload.putObject("text");

            text.put("preview_url", false);
            text.put("body", request.getMessage());
        }

        return payload;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WhatsappResponseDto> getAllMessages() {

        return whatsappRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WhatsappResponseDto> getMessagesByStatus(String status) {

        return whatsappRepository
                .findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    private WhatsappResponseDto mapResponse(WhatsappEntity entity) {

        return new WhatsappResponseDto(
                entity.getId(),
                entity.getRecipientName(),
                entity.getRecipientPhone(),
                entity.getStatus(),
                entity.getWhatsappMessageId(),
                entity.getErrorMessage()
        );
    }
}
