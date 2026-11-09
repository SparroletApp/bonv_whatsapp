
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class TemplateService {

    private static final Pattern VAR =
            Pattern.compile("\\{\\{(\\d+)}}");

    private static final Pattern ANY_VAR =
            Pattern.compile("\\{\\{([^}]*)}}");

    private static final Pattern START_VAR =
            Pattern.compile("^\\{\\{\\d+}}");

    private static final Pattern END_VAR =
            Pattern.compile("\\{\\{\\d+}}$");

    private static final Pattern NAME_OK =
            Pattern.compile("^[a-z0-9_]+$");

    private static final Pattern PHONE_OK =
            Pattern.compile("^\\+?[0-9]{8,15}$");

    private static final Set<String> BUTTON_TYPES =
            Set.of("QUICK_REPLY", "URL", "PHONE_NUMBER");

    private static final Set<String> HEADER_TYPES =
            Set.of(
                    "NONE",
                    "TEXT",
                    "IMAGE",
                    "VIDEO",
                    "DOCUMENT",
                    "LOCATION"
            );

    private static final Set<String> MEDIA_TYPES =
            Set.of("IMAGE", "VIDEO", "DOCUMENT");

    private final TemplateRepository repo;
    private final WhatsappClient client;
    private final ObjectMapper mapper;
    private final MediaStorageService mediaStorage;

    /*
     * Meta upload handle -> public URL.
     *
     * The handle is returned by Meta during sample upload.
     * The public URL is used later when the campaign sends
     * messages using this template.
     */
    private final Map<String, String> sampleUrls =
            new ConcurrentHashMap<>();

    // ==========================================
    // UPLOAD TEMPLATE SAMPLE MEDIA
    // ==========================================

    public String uploadMediaSample(
            String type,
            MultipartFile file
    ) throws IOException {

        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException(
                    "Media type is required"
            );
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Please select a media file"
            );
        }

        String headerType = type.trim().toUpperCase();

        if (!MEDIA_TYPES.contains(headerType)) {
            throw new IllegalArgumentException(
                    "Supported upload types are IMAGE, VIDEO and DOCUMENT"
            );
        }

        String mimeType = file.getContentType();

        if (mimeType == null) {
            throw new IllegalArgumentException(
                    "Unable to identify file type"
            );
        }

        boolean valid = switch (headerType) {

            case "IMAGE" ->
                    Set.of(
                            "image/jpeg",
                            "image/png"
                    ).contains(mimeType);

            case "VIDEO" ->
                    "video/mp4".equals(mimeType);

            case "DOCUMENT" ->
                    "application/pdf".equals(mimeType);

            default -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException(
                    "Invalid file format for " + headerType
            );
        }

        long maxSize = switch (headerType) {

            case "IMAGE" ->
                    5L * 1024 * 1024;

            case "VIDEO" ->
                    16L * 1024 * 1024;

            case "DOCUMENT" ->
                    100L * 1024 * 1024;

            default -> 0;
        };

        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(
                    "File exceeds the maximum allowed size for "
                            + headerType
            );
        }

        String filename = file.getOriginalFilename();

        if (filename == null || filename.isBlank()) {

            filename = switch (headerType) {
                case "IMAGE" -> "template-sample.jpg";
                case "VIDEO" -> "template-sample.mp4";
                case "DOCUMENT" -> "template-sample.pdf";
                default -> "template-sample";
            };

        } else {

            filename = filename.replaceAll(
                    "[^a-zA-Z0-9._-]",
                    "_"
            );
        }

        log.info(
                "Uploading template sample. Type: {}, Filename: {}, Size: {}",
                headerType,
                filename,
                file.getSize()
        );

        // Upload sample media to Meta
        String handle = client.uploadTemplateSample(
                file.getBytes(),
                mimeType,
                filename
        );

        if (handle == null || handle.isBlank()) {
            throw new IllegalStateException(
                    "Meta did not return a valid media handle"
            );
        }

        /*
         * Save a public copy of the same file.
         *
         * This URL is stored in the template database and
         * reused by campaigns when sending messages.
         *
         * Do not silently ignore a storage failure.
         */
        String publicUrl;

        try {

            publicUrl = mediaStorage.save(file);

            if (publicUrl == null || publicUrl.isBlank()) {
                throw new IllegalStateException(
                        "Media storage did not return a public URL"
                );
            }

            validatePublicMediaUrl(publicUrl);

            if (sampleUrls.size() > 500) {
                sampleUrls.clear();
            }

            sampleUrls.put(handle, publicUrl);

        } catch (Exception ex) {

            log.error(
                    "Could not save public template media",
                    ex
            );

            throw new IllegalStateException(
                    "Media was uploaded to Meta, but could not be saved "
                            + "for campaign reuse: " + ex.getMessage(),
                    ex
            );
        }

        log.info(
                "Template sample uploaded successfully. Public URL saved."
        );

        return handle;
    }

    // ==========================================
    // CREATE TEMPLATE
    // ==========================================

    public TemplateResponse create(TemplateCreateRequestDto r) {

        log.info("Starting WhatsApp template creation");

        if (r == null) {
            throw new IllegalArgumentException(
                    "Template request cannot be empty"
            );
        }

        if (r.name() == null || r.name().isBlank()) {
            throw new IllegalArgumentException(
                    "Template name is required"
            );
        }

        if (r.language() == null || r.language().isBlank()) {
            throw new IllegalArgumentException(
                    "Template language is required"
            );
        }

        if (r.body() == null || r.body().isBlank()) {
            throw new IllegalArgumentException(
                    "Template body is required"
            );
        }

        String name = r.name().trim().toLowerCase();
        String language = r.language().trim();
        String body = r.body().trim();

        String headerText = clean(r.headerText());
        String footerText = clean(r.footerText());

        String category = (
                r.category() == null || r.category().isBlank()
        )
                ? "MARKETING"
                : r.category().trim().toUpperCase();

        String headerType = r.headerType() == null
                || r.headerType().isBlank()
                ? (headerText == null ? "NONE" : "TEXT")
                : r.headerType().trim().toUpperCase();

        if (!NAME_OK.matcher(name).matches()) {
            throw new IllegalArgumentException(
                    "Template name must contain lowercase letters, numbers and underscores only"
            );
        }

        if (name.length() > 150) {
            throw new IllegalArgumentException(
                    "Template name is too long"
            );
        }

        if (!category.equals("MARKETING")
                && !category.equals("UTILITY")) {
            throw new IllegalArgumentException(
                    "Category must be MARKETING or UTILITY"
            );
        }

        if (!HEADER_TYPES.contains(headerType)) {
            throw new IllegalArgumentException(
                    "Unsupported header type: " + headerType
            );
        }

        if (body.length() > 1024) {
            throw new IllegalArgumentException(
                    "Message body is too long (max 1024 characters)"
            );
        }

        if (headerText != null && headerText.length() > 60) {
            throw new IllegalArgumentException(
                    "Header is too long (max 60 characters)"
            );
        }

        if (footerText != null && footerText.length() > 60) {
            throw new IllegalArgumentException(
                    "Footer is too long (max 60 characters)"
            );
        }

        // ==========================================
        // VALIDATE HEADER
        // ==========================================

        String mediaHandle = null;
        String savedMediaUrl = null;

        if (headerType.equals("TEXT")) {

            if (headerText == null) {
                throw new IllegalArgumentException(
                        "Header text is required"
                );
            }

            if (r.headerMediaHandle() != null
                    && !r.headerMediaHandle().isBlank()) {
                throw new IllegalArgumentException(
                        "Media handle is not required for TEXT header"
                );
            }

        } else if (MEDIA_TYPES.contains(headerType)) {

            if (r.headerMediaHandle() == null
                    || r.headerMediaHandle().isBlank()) {
                throw new IllegalArgumentException(
                        "Upload a sample " + headerType.toLowerCase()
                                + " before creating the template"
                );
            }

            mediaHandle = r.headerMediaHandle().trim();

            /*
             * Find the public URL associated with the Meta handle.
             * This is the media URL that campaigns will reuse.
             */
            savedMediaUrl = sampleUrls.get(mediaHandle);

            if (savedMediaUrl == null || savedMediaUrl.isBlank()) {
                throw new IllegalArgumentException(
                        "The uploaded media could not be found. "
                                + "Please upload the template media again."
                );
            }

            validatePublicMediaUrl(savedMediaUrl);

            headerText = null;

        } else {

            headerText = null;

            if (r.headerMediaHandle() != null
                    && !r.headerMediaHandle().isBlank()) {
                throw new IllegalArgumentException(
                        "Media handle is not required for this header type"
                );
            }
        }

        if (headerText != null && headerText.contains("{{")) {
            throw new IllegalArgumentException(
                    "Variables are not supported in the header"
            );
        }

        if (footerText != null && footerText.contains("{{")) {
            throw new IllegalArgumentException(
                    "Variables are not supported in the footer"
            );
        }

        if (repo.existsByNameAndLanguage(name, language)) {
            throw new IllegalArgumentException(
                    "A template with this name and language already exists"
            );
        }

        // ==========================================
        // VARIABLES
        // ==========================================

        validateBodyVariables(body);

        int vars = countVariables(body);

        List<String> examples = new ArrayList<>();

        if (r.bodyExamples() != null) {

            for (String example : r.bodyExamples()) {

                if (example != null && !example.isBlank()) {
                    examples.add(example.trim());
                }
            }
        }

        if (vars > 0 && examples.size() < vars) {
            throw new IllegalArgumentException(
                    "Provide an example value for each variable"
            );
        }

        // ==========================================
        // BUTTONS
        // ==========================================

        List<TemplateButtonDto> buttons =
                r.buttons() == null ? List.of() : r.buttons();

        if (buttons.size() > 3) {
            throw new IllegalArgumentException(
                    "A template can have at most 3 buttons"
            );
        }

        ArrayNode buttonArray = mapper.createArrayNode();

        for (TemplateButtonDto button : buttons) {

            if (button == null) {
                throw new IllegalArgumentException(
                        "Invalid template button"
                );
            }

            String type = button.type() == null
                    ? ""
                    : button.type().trim().toUpperCase();

            String text = button.text() == null
                    ? ""
                    : button.text().trim();

            if (!BUTTON_TYPES.contains(type)) {
                throw new IllegalArgumentException(
                        "Unsupported button type: " + type
                );
            }

            if (text.isEmpty()) {
                throw new IllegalArgumentException(
                        "Every button must have button text"
                );
            }

            if (text.length() > 25) {
                throw new IllegalArgumentException(
                        "Button text is too long (max 25 characters)"
                );
            }

            ObjectNode btn = buttonArray.addObject();

            btn.put("type", type);
            btn.put("text", text);

            if (type.equals("URL")) {

                String url = button.url() == null
                        ? ""
                        : button.url().trim();

                if (url.isEmpty()) {
                    throw new IllegalArgumentException(
                            "URL button requires a URL"
                    );
                }

                try {

                    String scheme = new URI(url).getScheme();

                    if (scheme == null
                            || !(scheme.equalsIgnoreCase("http")
                            || scheme.equalsIgnoreCase("https"))) {

                        throw new IllegalArgumentException(
                                "Button URL must start with http:// or https://"
                        );
                    }

                } catch (URISyntaxException ex) {

                    throw new IllegalArgumentException(
                            "Please enter a valid button URL"
                    );
                }

                btn.put("url", url);
            }

            if (type.equals("PHONE_NUMBER")) {

                String phone = button.phoneNumber() == null
                        ? ""
                        : button.phoneNumber()
                        .replaceAll("[\\s-]", "");

                if (!PHONE_OK.matcher(phone).matches()) {
                    throw new IllegalArgumentException(
                            "Phone button needs a valid number with country code"
                    );
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

        // ==========================================
        // HEADER
        // ==========================================

        if (headerType.equals("TEXT")) {

            ObjectNode header = components.addObject();

            header.put("type", "HEADER");
            header.put("format", "TEXT");
            header.put("text", headerText);

        } else if (MEDIA_TYPES.contains(headerType)) {

            ObjectNode header = components.addObject();

            header.put("type", "HEADER");
            header.put("format", headerType);

            ObjectNode example = header.putObject("example");

            ArrayNode handles = example.putArray("header_handle");

            handles.add(mediaHandle);

        } else if (headerType.equals("LOCATION")) {

            ObjectNode header = components.addObject();

            header.put("type", "HEADER");
            header.put("format", "LOCATION");
        }

        // ==========================================
        // BODY
        // ==========================================

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

        // ==========================================
        // FOOTER
        // ==========================================

        if (footerText != null) {

            ObjectNode footer = components.addObject();

            footer.put("type", "FOOTER");
            footer.put("text", footerText);
        }

        // ==========================================
        // BUTTONS
        // ==========================================

        if (!buttonArray.isEmpty()) {

            ObjectNode buttonComponent = components.addObject();

            buttonComponent.put("type", "BUTTONS");
            buttonComponent.set("buttons", buttonArray);
        }

        log.info(
                "Creating Meta template. Name: {}, Header: {}",
                name,
                headerType
        );

        // ==========================================
        // SEND TO META
        // ==========================================

        JsonNode metaResponse;

        try {

            metaResponse = client.createTemplate(payload);

            log.info(
                    "Meta template response: {}",
                    metaResponse
            );

        } catch (Exception ex) {

            log.error("Meta template creation failed", ex);

            throw new RuntimeException(
                    "Meta template creation failed: " + ex.getMessage(),
                    ex
            );
        }

        if (metaResponse == null || !metaResponse.hasNonNull("id")) {

            throw new RuntimeException(
                    "Meta did not return a valid template ID"
            );
        }

        // ==========================================
        // SAVE DATABASE
        // ==========================================

        TemplateEntity entity = new TemplateEntity();

        entity.setName(name);
        entity.setLanguage(language);
        entity.setCategory(category);

        entity.setHeaderType(headerType);
        entity.setHeaderText(headerText);

        boolean mediaHeader = MEDIA_TYPES.contains(headerType);

        entity.setHeaderMediaHandle(
                mediaHeader ? mediaHandle : null
        );

        // Save the public media URL for future campaigns
        entity.setHeaderMediaUrl(
                mediaHeader ? savedMediaUrl : null
        );

        entity.setBody(body);
        entity.setFooterText(footerText);

        entity.setButtonsJson(
                buttonArray.isEmpty()
                        ? null
                        : buttonArray.toString()
        );

        entity.setVariableCount(vars);

        entity.setMetaTemplateId(
                metaResponse.path("id").asText()
        );

        entity.setStatus(
                metaResponse.path("status")
                        .asText("PENDING")
                        .toUpperCase()
        );

        try {

            TemplateEntity saved = repo.saveAndFlush(entity);

            log.info(
                    "Template saved. Local ID: {}, Meta ID: {}, Media URL saved: {}",
                    saved.getId(),
                    saved.getMetaTemplateId(),
                    saved.getHeaderMediaUrl() != null
            );

            // Remove the temporary mapping after successful persistence
            if (mediaHeader) {
                sampleUrls.remove(mediaHandle);
            }

            return map(saved);

        } catch (Exception ex) {

            log.error(
                    "Meta accepted template but database saving failed",
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
    // VALIDATE PUBLIC MEDIA URL
    // ==========================================

    private void validatePublicMediaUrl(String mediaUrl) {

        if (mediaUrl == null || mediaUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "Template media URL is missing"
            );
        }

        try {

            URI uri = URI.create(mediaUrl);

            if (!"https".equalsIgnoreCase(uri.getScheme())
                    || uri.getHost() == null
                    || uri.getHost().isBlank()) {

                throw new IllegalArgumentException(
                        "Template media URL must be a valid public HTTPS URL"
                );
            }

        } catch (IllegalArgumentException ex) {

            throw new IllegalArgumentException(
                    "Invalid template media URL. Please check your media storage configuration.",
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

        ArrayNode templates = client.listTemplates();

        if (templates == null) {
            throw new RuntimeException(
                    "Meta returned an empty template response"
            );
        }

        int synced = 0;
        int skipped = 0;

        for (JsonNode template : templates) {

            String name = template.path("name").asText("");
            String language = template.path("language").asText("");

            if (name.isBlank() || language.isBlank()) {

                log.warn(
                        "Skipping template with missing name or language: {}",
                        template
                );

                skipped++;
                continue;
            }

            try {

                TemplateEntity entity = repo
                        .findByNameAndLanguage(name, language)
                        .orElseGet(TemplateEntity::new);

                entity.setName(name);
                entity.setLanguage(language);

                entity.setCategory(
                        template.path("category").asText("MARKETING")
                );

                entity.setStatus(
                        template.path("status")
                                .asText("PENDING")
                                .toUpperCase()
                );

                entity.setMetaTemplateId(
                        template.path("id").asText(null)
                );

                entity.setRejectionReason(
                        template.path("rejected_reason").asText(null)
                );

                /*
                 * Preserve local media information.
                 * Meta's template listing does not return the original
                 * uploaded sample media URL.
                 */
                String keepHandle = entity.getHeaderMediaHandle();
                String keepUrl = entity.getHeaderMediaUrl();

                // Reset existing component fields
                entity.setHeaderType("NONE");
                entity.setHeaderText(null);
                entity.setHeaderMediaHandle(null);
                entity.setHeaderMediaUrl(null);

                entity.setFooterText(null);
                entity.setButtonsJson(null);
                entity.setBody("");

                for (JsonNode component : template.path("components")) {

                    switch (component.path("type").asText()) {

                        case "BODY" -> entity.setBody(
                                component.path("text").asText("")
                        );

                        case "HEADER" -> {

                            String format = component.path("format")
                                    .asText("NONE")
                                    .toUpperCase();

                            entity.setHeaderType(format);

                            if (format.equals("TEXT")) {

                                entity.setHeaderText(
                                        component.path("text")
                                                .asText(null)
                                );

                            } else {

                                entity.setHeaderText(null);
                            }

                            // Restore saved media for media headers
                            if (MEDIA_TYPES.contains(format)) {

                                entity.setHeaderMediaHandle(keepHandle);
                                entity.setHeaderMediaUrl(keepUrl);
                            }
                        }

                        case "FOOTER" -> entity.setFooterText(
                                component.path("text").asText(null)
                        );

                        case "BUTTONS" -> entity.setButtonsJson(
                                component.path("buttons").toString()
                        );

                        default -> log.debug(
                                "Ignoring component type: {}",
                                component.path("type").asText()
                        );
                    }
                }

                entity.setVariableCount(
                        countVariables(entity.getBody())
                );

                repo.save(entity);

                synced++;

            } catch (Exception ex) {

                log.error(
                        "Failed to sync template: {} ({})",
                        name,
                        language,
                        ex
                );

                skipped++;
            }
        }

        log.info(
                "Template synchronization completed. Synced: {}, skipped: {}",
                synced,
                skipped
        );

        return list(null);
    }

    // ==========================================
    // LIST TEMPLATES
    // ==========================================

    @Transactional(readOnly = true)
    public List<TemplateResponse> list(String status) {

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
                    "Template status updated: {} - {}",
                    template.getName(),
                    template.getStatus()
            );
        }
    }

    // ==========================================
    // VARIABLE HELPERS
    // ==========================================

    public static int countVariables(String body) {

        if (body == null || body.isBlank()) {
            return 0;
        }

        Matcher matcher = VAR.matcher(body);

        int max = 0;

        while (matcher.find()) {

            max = Math.max(
                    max,
                    Integer.parseInt(matcher.group(1))
            );
        }

        return max;
    }

    private void validateBodyVariables(String body) {

        Matcher any = ANY_VAR.matcher(body);

        Set<Integer> numbers = new TreeSet<>();

        while (any.find()) {

            String token = any.group(1).trim();

            if (!token.matches("\\d{1,3}")) {

                throw new IllegalArgumentException(
                        "Only numbered variables like {{1}} are supported"
                );
            }

            numbers.add(Integer.parseInt(token));
        }

        String stripped = ANY_VAR.matcher(body).replaceAll("");

        if (stripped.contains("{{") || stripped.contains("}}")) {

            throw new IllegalArgumentException(
                    "The message body has an incomplete variable"
            );
        }

        int expected = 1;

        for (int number : numbers) {

            if (number != expected) {

                throw new IllegalArgumentException(
                        "Variables must be sequential: {{1}}, {{2}}, {{3}}..."
                );
            }

            expected++;
        }

        if (!numbers.isEmpty()) {

            if (START_VAR.matcher(body).find()) {

                throw new IllegalArgumentException(
                        "Message body cannot start with a variable"
                );
            }

            if (END_VAR.matcher(body).find()) {

                throw new IllegalArgumentException(
                        "Message body cannot end with a variable"
                );
            }
        }
    }

    // ==========================================
    // CLEAN
    // ==========================================

    private static String clean(String value) {

        return value == null || value.isBlank()
                ? null
                : value.trim();
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
                entity.getCreatedAt(),
                entity.getHeaderType(),
                entity.getHeaderMediaHandle(),
                entity.getHeaderMediaUrl()
        );
    }
}
