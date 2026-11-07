
package com.example.whatsapp.service;

import com.example.whatsapp.client.WhatsappClient;
import com.example.whatsapp.dto.whatsappdto.TemplateButtonDto;
import com.example.whatsapp.dto.whatsappdto.TemplateCreateRequestDto;
import com.example.whatsapp.dto.whatsappdto.TemplateResponse;
import com.example.whatsapp.entity.TemplateEntity;
import com.example.whatsapp.repository.TemplateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class TemplateService {

    private static final Pattern VAR =
            Pattern.compile("\\{\\{(\\d+)}}");

    private final TemplateRepository repo;
    private final WhatsappClient client;
    private final ObjectMapper mapper;

    // ==========================================
    // CREATE TEMPLATE
    // ==========================================

    @Transactional
    public TemplateResponse create(TemplateCreateRequestDto r) {

        log.info("Starting WhatsApp template creation");

        if (r == null) {
            throw new IllegalArgumentException("Template request cannot be empty");
        }

        if (r.name() == null || r.name().isBlank()) {
            throw new IllegalArgumentException("Template name is required");
        }

        if (r.language() == null || r.language().isBlank()) {
            throw new IllegalArgumentException("Template language is required");
        }

        if (r.body() == null || r.body().isBlank()) {
            throw new IllegalArgumentException("Template body is required");
        }

        String name = r.name().trim().toLowerCase();
        String language = r.language().trim();

        log.info("Template name: {}, language: {}", name, language);

        if (repo.existsByNameAndLanguage(name, language)) {
            throw new IllegalArgumentException(
                    "A template with this name and language already exists"
            );
        }

        int vars = countVariables(r.body());

        List<String> examples = r.bodyExamples() == null
                ? List.of()
                : r.bodyExamples();

        if (vars > 0 && examples.size() < vars) {
            throw new IllegalArgumentException(
                    "Provide an example value for each variable"
            );
        }

        // ==========================================
        // BUILD META PAYLOAD
        // ==========================================

        ObjectNode payload = mapper.createObjectNode();

        payload.put("name", name);
        payload.put("language", language);
        payload.put("category", r.category());

        ArrayNode components = payload.putArray("components");

        // HEADER

        if (r.headerText() != null && !r.headerText().isBlank()) {

            ObjectNode header = components.addObject();

            header.put("type", "HEADER");
            header.put("format", "TEXT");
            header.put("text", r.headerText());
        }

        // BODY

        ObjectNode body = components.addObject();

        body.put("type", "BODY");
        body.put("text", r.body());

        if (vars > 0) {

            ArrayNode row = body
                    .putObject("example")
                    .putArray("body_text")
                    .addArray();

            for (int i = 0; i < vars; i++) {
                row.add(examples.get(i));
            }
        }

        // FOOTER

        if (r.footerText() != null && !r.footerText().isBlank()) {

            ObjectNode footer = components.addObject();

            footer.put("type", "FOOTER");
            footer.put("text", r.footerText());
        }

        // BUTTONS

        ArrayNode buttonArray = mapper.createArrayNode();

        if (r.buttons() != null) {

            for (TemplateButtonDto button : r.buttons()) {

                ObjectNode btn = buttonArray.addObject();

                btn.put("type", button.type());
                btn.put("text", button.text());

                if ("URL".equals(button.type())) {
                    btn.put("url", button.url());
                }

                if ("PHONE_NUMBER".equals(button.type())) {
                    btn.put("phone_number", button.phoneNumber());
                }
            }
        }

        if (!buttonArray.isEmpty()) {

            ObjectNode buttonComponent = components.addObject();

            buttonComponent.put("type", "BUTTONS");
            buttonComponent.set("buttons", buttonArray);
        }

        log.info("Meta template payload prepared for: {}", name);

        // ==========================================
        // SEND TEMPLATE TO META
        // ==========================================

        JsonNode metaResponse;

        try {

            metaResponse = client.createTemplate(payload);

            log.info("Meta template response received: {}", metaResponse);

        } catch (Exception ex) {

            log.error("Meta template creation failed", ex);

            throw new RuntimeException(
                    "Meta template creation failed: " + ex.getMessage(),
                    ex
            );
        }

        if (metaResponse == null || !metaResponse.hasNonNull("id")) {

            log.error("Meta returned an unexpected template response: {}", metaResponse);

            throw new RuntimeException(
                    "Meta did not return a valid template ID"
            );
        }

        // ==========================================
        // SAVE TEMPLATE TO DATABASE
        // ==========================================

        TemplateEntity entity = new TemplateEntity();

        entity.setName(name);
        entity.setLanguage(language);
        entity.setCategory(r.category());
        entity.setHeaderText(r.headerText());
        entity.setBody(r.body());
        entity.setFooterText(r.footerText());

        entity.setButtonsJson(
                buttonArray.isEmpty() ? null : buttonArray.toString()
        );

        entity.setVariableCount(vars);

        entity.setMetaTemplateId(
                metaResponse.path("id").asText()
        );

        entity.setStatus(
                metaResponse.path("status").asText("PENDING")
        );

        try {

            TemplateEntity saved = repo.saveAndFlush(entity);

            log.info(
                    "Template saved successfully. Local ID: {}, Meta ID: {}",
                    saved.getId(),
                    saved.getMetaTemplateId()
            );

            return map(saved);

        } catch (Exception ex) {

            log.error(
                    "Meta accepted template, but PostgreSQL save failed. Meta ID: {}",
                    entity.getMetaTemplateId(),
                    ex
            );

            throw new RuntimeException(
                    "Template was submitted to Meta, but database saving failed: "
                            + ex.getMessage(),
                    ex
            );
        }
    }

    // ==========================================
    // SYNC TEMPLATES FROM META
    // ==========================================

    @Transactional
    public List<TemplateResponse> sync() {

        log.info("Starting template synchronization from Meta");

        List<JsonNode> templates = client.listTemplates();

        if (templates == null) {
            throw new RuntimeException("Meta returned an empty template response");
        }

        for (JsonNode template : templates) {

            String name = template.path("name").asText();
            String language = template.path("language").asText();

            if (name.isBlank() || language.isBlank()) {
                log.warn("Skipping template with missing name or language: {}", template);
                continue;
            }

            log.info("Syncing template: {}", name);

            TemplateEntity entity = repo
                    .findByNameAndLanguage(name, language)
                    .orElseGet(TemplateEntity::new);

            entity.setName(name);
            entity.setLanguage(language);

            entity.setCategory(
                    template.path("category").asText("MARKETING")
            );

            entity.setStatus(
                    template.path("status").asText("PENDING")
            );

            entity.setMetaTemplateId(
                    template.path("id").asText(null)
            );

            entity.setRejectionReason(
                    template.path("rejected_reason").asText(null)
            );

            for (JsonNode component : template.path("components")) {

                switch (component.path("type").asText()) {

                    case "BODY" ->
                            entity.setBody(
                                    component.path("text").asText("")
                            );

                    case "HEADER" -> {

                        if ("TEXT".equals(
                                component.path("format").asText()
                        )) {
                            entity.setHeaderText(
                                    component.path("text").asText(null)
                            );
                        }
                    }

                    case "FOOTER" ->
                            entity.setFooterText(
                                    component.path("text").asText(null)
                            );

                    case "BUTTONS" ->
                            entity.setButtonsJson(
                                    component.path("buttons").toString()
                            );

                    default -> {
                        log.debug(
                                "Ignoring component type: {}",
                                component.path("type").asText()
                        );
                    }
                }
            }

            entity.setVariableCount(
                    countVariables(entity.getBody())
            );

            try {
                repo.save(entity);
            } catch (Exception ex) {
                log.error("Failed to sync template: {}", name, ex);
                throw ex;
            }
        }

        log.info("Template synchronization completed");

        return list(null);
    }

    // ==========================================
    // LIST TEMPLATES
    // ==========================================

    @Transactional(readOnly = true)
    public List<TemplateResponse> list(String status) {

        log.info("Fetching templates. Status filter: {}", status);

        List<TemplateEntity> items =
                (status == null || status.isBlank())
                        ? repo.findAllByOrderByCreatedAtDesc()
                        : repo.findByStatusOrderByCreatedAtDesc(
                        status.toUpperCase()
                );

        return items.stream()
                .map(this::map)
                .toList();
    }

    // ==========================================
    // WEBHOOK STATUS UPDATE
    // ==========================================

    @Transactional
    public void applyWebhookStatus(
            String metaId,
            String name,
            String event,
            String reason
    ) {

        log.info(
                "Updating template status. Meta ID: {}, Name: {}, Event: {}",
                metaId,
                name,
                event
        );

        TemplateEntity entity = metaId == null
                ? null
                : repo.findByMetaTemplateId(metaId).orElse(null);

        List<TemplateEntity> targets =
                entity != null
                        ? List.of(entity)
                        : (name == null
                        ? List.of()
                        : repo.findByName(name));

        for (TemplateEntity template : targets) {

            if (event != null && !event.isBlank()) {
                template.setStatus(event.toUpperCase());
            }

            template.setRejectionReason(
                    "NONE".equalsIgnoreCase(reason)
                            ? null
                            : reason
            );

            repo.save(template);

            log.info(
                    "Template status updated. Name: {}, Status: {}",
                    template.getName(),
                    template.getStatus()
            );
        }
    }

    // ==========================================
    // COUNT VARIABLES
    // ==========================================

    public static int countVariables(String body) {

        if (body == null || body.isBlank()) {
            return 0;
        }

        Matcher matcher = VAR.matcher(body);

        int max = 0;

        while (matcher.find()) {

            int number = Integer.parseInt(matcher.group(1));

            max = Math.max(max, number);
        }

        return max;
    }

    // ==========================================
    // ENTITY TO RESPONSE
    // ==========================================

    private TemplateResponse map(TemplateEntity entity) {

        return new TemplateResponse(
                entity.getId(),
                entity.getName(),
                entity.getLanguage(),
                entity.getCategory(),
                entity.getHeaderText(),
                entity.getBody(),
                entity.getFooterText(),
                entity.getButtonsJson(),
                entity.getVariableCount(),
                entity.getStatus(),
                entity.getRejectionReason(),
                entity.getCreatedAt()
        );
    }
}
