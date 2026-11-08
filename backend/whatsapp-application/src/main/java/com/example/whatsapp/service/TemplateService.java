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

import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class TemplateService {

    // {{1}}, {{2}} ...
    private static final Pattern VAR = Pattern.compile("\\{\\{(\\d+)}}");
    // any {{ ... }} placeholder, used to reject unsupported ones
    private static final Pattern ANY_VAR = Pattern.compile("\\{\\{([^}]*)}}");
    private static final Pattern START_VAR = Pattern.compile("^\\{\\{\\d+}}");
    private static final Pattern END_VAR = Pattern.compile("\\{\\{\\d+}}$");
    private static final Pattern NAME_OK = Pattern.compile("^[a-z0-9_]+$");
    private static final Pattern PHONE_OK = Pattern.compile("^\\+?[0-9]{8,15}$");

    private static final Set<String> BUTTON_TYPES = Set.of("QUICK_REPLY", "URL", "PHONE_NUMBER");

    private final TemplateRepository repo;
    private final WhatsappClient client;
    private final ObjectMapper mapper;

    // ==========================================
    // CREATE TEMPLATE
    // No @Transactional on purpose: the call to Meta must not hold a database
    // connection open. saveAndFlush runs in its own short transaction.
    // ==========================================

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
        String body = r.body().trim();
        String headerText = clean(r.headerText());
        String footerText = clean(r.footerText());

        String category = (r.category() == null || r.category().isBlank())
                ? "MARKETING"
                : r.category().trim().toUpperCase();

        if (!NAME_OK.matcher(name).matches()) {
            throw new IllegalArgumentException(
                    "Template name must contain lowercase letters, numbers and underscores only");
        }
        if (name.length() > 512) {
            throw new IllegalArgumentException("Template name is too long (max 512 characters)");
        }
        if (!category.equals("MARKETING") && !category.equals("UTILITY")) {
            throw new IllegalArgumentException("Category must be MARKETING or UTILITY");
        }
        if (body.length() > 1024) {
            throw new IllegalArgumentException("Message body is too long (max 1024 characters)");
        }
        if (headerText != null && headerText.length() > 60) {
            throw new IllegalArgumentException("Header is too long (max 60 characters)");
        }
        if (footerText != null && footerText.length() > 60) {
            throw new IllegalArgumentException("Footer is too long (max 60 characters)");
        }
        if (headerText != null && headerText.contains("{{")) {
            throw new IllegalArgumentException("Variables are not supported in the header");
        }
        if (footerText != null && footerText.contains("{{")) {
            throw new IllegalArgumentException("Variables are not supported in the footer");
        }

        log.info("Template name: {}, language: {}", name, language);

        if (repo.existsByNameAndLanguage(name, language)) {
            throw new IllegalArgumentException(
                    "A template with this name and language already exists");
        }

        // ---------- variables ----------

        validateBodyVariables(body);
        int vars = countVariables(body);

        List<String> examples = new ArrayList<>();
        if (r.bodyExamples() != null) {
            for (String e : r.bodyExamples()) {
                if (e != null && !e.isBlank()) {
                    examples.add(e.trim());
                }
            }
        }
        if (vars > 0 && examples.size() < vars) {
            throw new IllegalArgumentException("Provide an example value for each variable");
        }

        // ---------- buttons ----------

        List<TemplateButtonDto> buttons = r.buttons() == null ? List.of() : r.buttons();

        if (buttons.size() > 3) {
            throw new IllegalArgumentException("A template can have at most 3 buttons");
        }

        ArrayNode buttonArray = mapper.createArrayNode();

        for (TemplateButtonDto button : buttons) {

            String type = button.type() == null ? "" : button.type().trim().toUpperCase();
            String text = button.text() == null ? "" : button.text().trim();

            if (!BUTTON_TYPES.contains(type)) {
                throw new IllegalArgumentException("Unsupported button type: " + button.type());
            }
            if (text.isEmpty()) {
                throw new IllegalArgumentException("Every button must have button text");
            }
            if (text.length() > 25) {
                throw new IllegalArgumentException("Button text is too long (max 25 characters): " + text);
            }

            ObjectNode btn = buttonArray.addObject();
            btn.put("type", type);
            btn.put("text", text);

            if (type.equals("URL")) {
                String url = button.url() == null ? "" : button.url().trim();
                if (url.isEmpty()) {
                    throw new IllegalArgumentException("URL button requires a URL");
                }
                try {
                    String scheme = new URI(url).getScheme();
                    if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                        throw new IllegalArgumentException("Button URL must start with http:// or https://");
                    }
                } catch (java.net.URISyntaxException ex) {
                    throw new IllegalArgumentException("Please enter a valid button URL");
                }
                btn.put("url", url);
            }

            if (type.equals("PHONE_NUMBER")) {
                String phone = button.phoneNumber() == null
                        ? ""
                        : button.phoneNumber().replaceAll("[\\s-]", "");
                if (!PHONE_OK.matcher(phone).matches()) {
                    throw new IllegalArgumentException(
                            "Phone button needs a valid number with country code, e.g. +919876543210");
                }
                btn.put("phone_number", phone);
            }
        }

        // ==========================================
        // BUILD META PAYLOAD
        // ==========================================

        ObjectNode payload = mapper.createObjectNode();

        payload.put("name", name);
        payload.put("language", language);
        payload.put("category", category);

        ArrayNode components = payload.putArray("components");

        // HEADER
        if (headerText != null) {
            ObjectNode header = components.addObject();
            header.put("type", "HEADER");
            header.put("format", "TEXT");
            header.put("text", headerText);
        }

        // BODY
        ObjectNode bodyNode = components.addObject();
        bodyNode.put("type", "BODY");
        bodyNode.put("text", body);

        if (vars > 0) {
            ArrayNode row = bodyNode
                    .putObject("example")
                    .putArray("body_text")
                    .addArray();

            for (int i = 0; i < vars; i++) {
                row.add(examples.get(i));
            }
        }

        // FOOTER
        if (footerText != null) {
            ObjectNode footer = components.addObject();
            footer.put("type", "FOOTER");
            footer.put("text", footerText);
        }

        // BUTTONS
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
                    "Meta template creation failed: " + ex.getMessage(), ex);
        }

        if (metaResponse == null || !metaResponse.hasNonNull("id")) {
            log.error("Meta returned an unexpected template response: {}", metaResponse);
            throw new RuntimeException("Meta did not return a valid template ID");
        }

        // ==========================================
        // SAVE TEMPLATE TO DATABASE
        // ==========================================

        TemplateEntity entity = new TemplateEntity();

        entity.setName(name);
        entity.setLanguage(language);
        entity.setCategory(category);
        entity.setHeaderText(headerText);
        entity.setBody(body);
        entity.setFooterText(footerText);
        entity.setButtonsJson(buttonArray.isEmpty() ? null : buttonArray.toString());
        entity.setVariableCount(vars);
        entity.setMetaTemplateId(metaResponse.path("id").asText());
        entity.setStatus(metaResponse.path("status").asText("PENDING").toUpperCase());

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }

        try {
            TemplateEntity saved = repo.saveAndFlush(entity);

            log.info("Template saved successfully. Local ID: {}, Meta ID: {}",
                    saved.getId(), saved.getMetaTemplateId());

            return map(saved);

        } catch (Exception ex) {
            log.error("Meta accepted template, but database save failed. Meta ID: {}",
                    entity.getMetaTemplateId(), ex);

            throw new RuntimeException(
                    "Template was submitted to Meta, but database saving failed: "
                            + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // SYNC TEMPLATES FROM META
    // ==========================================

    @Transactional
    public List<TemplateResponse> sync() {

        log.info("Starting template synchronization from Meta");

        ArrayNode templates = client.listTemplates();

        if (templates == null) {
            throw new RuntimeException("Meta returned an empty template response");
        }

        int synced = 0;
        int skipped = 0;

        for (JsonNode template : templates) {

            String name = template.path("name").asText("");
            String language = template.path("language").asText("");

            if (name.isBlank() || language.isBlank()) {
                log.warn("Skipping template with missing name or language: {}", template);
                skipped++;
                continue;
            }

            try {
                TemplateEntity entity = repo
                        .findByNameAndLanguage(name, language)
                        .orElseGet(TemplateEntity::new);

                entity.setName(name);
                entity.setLanguage(language);
                entity.setCategory(template.path("category").asText("MARKETING"));
                entity.setStatus(template.path("status").asText("PENDING").toUpperCase());
                entity.setMetaTemplateId(template.path("id").asText(null));
                entity.setRejectionReason(template.path("rejected_reason").asText(null));

                // reset parts that may have been removed in Meta
                entity.setHeaderText(null);
                entity.setFooterText(null);
                entity.setButtonsJson(null);
                entity.setBody("");

                for (JsonNode component : template.path("components")) {

                    switch (component.path("type").asText()) {

                        case "BODY" ->
                                entity.setBody(component.path("text").asText(""));

                        case "HEADER" -> {
                            // only TEXT headers; media headers (image/document/video) are not stored
                            if ("TEXT".equals(component.path("format").asText())) {
                                entity.setHeaderText(component.path("text").asText(null));
                            }
                        }

                        case "FOOTER" ->
                                entity.setFooterText(component.path("text").asText(null));

                        case "BUTTONS" ->
                                entity.setButtonsJson(component.path("buttons").toString());

                        default ->
                                log.debug("Ignoring component type: {}",
                                        component.path("type").asText());
                    }
                }

                entity.setVariableCount(countVariables(entity.getBody()));

                if (entity.getCreatedAt() == null) {
                    entity.setCreatedAt(LocalDateTime.now());
                }

                repo.save(entity);
                synced++;

            } catch (Exception ex) {
                // one bad template must not stop the others
                log.error("Failed to sync template: {} ({})", name, language, ex);
                skipped++;
            }
        }

        log.info("Template synchronization completed. Synced: {}, skipped: {}", synced, skipped);

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
                        : repo.findByStatusOrderByCreatedAtDesc(status.toUpperCase());

        return items.stream().map(this::map).toList();
    }

    // ==========================================
    // WEBHOOK STATUS UPDATE
    // ==========================================

    @Transactional
    public void applyWebhookStatus(String metaId, String name, String event, String reason) {

        log.info("Updating template status. Meta ID: {}, Name: {}, Event: {}",
                metaId, name, event);

        TemplateEntity entity = metaId == null
                ? null
                : repo.findByMetaTemplateId(metaId).orElse(null);

        List<TemplateEntity> targets =
                entity != null
                        ? List.of(entity)
                        : (name == null ? List.of() : repo.findByName(name));

        for (TemplateEntity template : targets) {

            if (event != null && !event.isBlank()) {
                template.setStatus(event.toUpperCase());
            }

            template.setRejectionReason(
                    "NONE".equalsIgnoreCase(reason) ? null : reason
            );

            repo.save(template);

            log.info("Template status updated. Name: {}, Status: {}",
                    template.getName(), template.getStatus());
        }
    }

    // ==========================================
    // VARIABLE HELPERS
    // ==========================================

    /** Highest variable number in the body: "Hi {{1}}" -> 1. */
    public static int countVariables(String body) {

        if (body == null || body.isBlank()) {
            return 0;
        }

        Matcher matcher = VAR.matcher(body);
        int max = 0;

        while (matcher.find()) {
            max = Math.max(max, Integer.parseInt(matcher.group(1)));
        }

        return max;
    }

    /** Meta rules: numbered, sequential, not at the very start or end of the body. */
    private void validateBodyVariables(String body) {

        Matcher any = ANY_VAR.matcher(body);
        Set<Integer> numbers = new TreeSet<>();

        while (any.find()) {
            String token = any.group(1).trim();
            if (!token.matches("\\d{1,3}")) {
                throw new IllegalArgumentException(
                        "Only numbered variables like {{1}} are supported");
            }
            numbers.add(Integer.parseInt(token));
        }

        // stray "{{" or "}}" that are not a complete placeholder
        String stripped = ANY_VAR.matcher(body).replaceAll("");
        if (stripped.contains("{{") || stripped.contains("}}")) {
            throw new IllegalArgumentException("The message body has an incomplete variable");
        }

        int expected = 1;
        for (int n : numbers) {
            if (n != expected) {
                throw new IllegalArgumentException(
                        "Variables must be sequential: {{1}}, {{2}}, {{3}}...");
            }
            expected++;
        }

        if (!numbers.isEmpty()) {
            if (START_VAR.matcher(body).find()) {
                throw new IllegalArgumentException("Message body cannot start with a variable");
            }
            if (END_VAR.matcher(body).find()) {
                throw new IllegalArgumentException("Message body cannot end with a variable");
            }
        }
    }

    private static String clean(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }


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