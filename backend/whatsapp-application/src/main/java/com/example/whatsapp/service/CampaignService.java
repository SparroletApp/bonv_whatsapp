package com.example.whatsapp.service;

import com.example.whatsapp.dto.campaign.*;
import com.example.whatsapp.entity.*;
import com.example.whatsapp.repository.*;
import com.example.whatsapp.util.PhoneUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepo;
    private final TemplateRepository templateRepo;
    private final ContactRepository contactRepo;
    private final WhatsappRepository messageRepo;
    private final ObjectMapper mapper;

    @Transactional
    public CampaignResponse create(CampaignCreateRequest req) {

        // Validate campaign request
        if (req == null) {
            throw new IllegalArgumentException("Campaign request is required");
        }

        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Campaign name is required");
        }

        if (req.templateId() == null) {
            throw new IllegalArgumentException("Please select a template");
        }

        if (req.categoryIds() == null || req.categoryIds().isEmpty()) {
            throw new IllegalArgumentException("Select at least one category");
        }

        // Load template
        TemplateEntity tpl = templateRepo.findById(req.templateId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Template not found"));

        if (!"APPROVED".equalsIgnoreCase(tpl.getStatus())) {
            throw new IllegalArgumentException(
                    "Template is not approved yet. Current status: "
                            + tpl.getStatus()
            );
        }

        String headerMediaUrl = req.headerMediaUrl() == null
                ? null
                : req.headerMediaUrl().trim();

        validateTemplateHeader(tpl, headerMediaUrl);

        int varCount = tpl.getVariableCount();

        List<String> mapping = req.variableMapping() == null
                ? List.of()
                : req.variableMapping();

        if (mapping.size() < varCount) {
            throw new IllegalArgumentException(
                    "Map all " + varCount + " template variables"
            );
        }

        // Load contacts and remove invalid/duplicate phone numbers
        Set<String> seen = new HashSet<>();

        List<ContactEntity> contacts = new ArrayList<>();
        List<String> phones = new ArrayList<>();

        for (ContactEntity ct :
                contactRepo.findByCategoryIdIn(req.categoryIds())) {

            String phone = PhoneUtil.normalize(ct.getPhone());

            if (phone == null || phone.isBlank()) {
                continue;
            }

            if (!seen.add(phone)) {
                continue;
            }

            contacts.add(ct);
            phones.add(phone);
        }

        if (contacts.isEmpty()) {
            throw new IllegalArgumentException(
                    "Selected categories have no contacts with valid phone numbers"
            );
        }

        // Create campaign
        CampaignEntity campaign = new CampaignEntity();

        campaign.setName(req.name().trim());
        campaign.setTemplateId(tpl.getId());
        campaign.setTemplateName(tpl.getName());

        campaign.setCategoryIds(
                req.categoryIds()
                        .stream()
                        .map(String::valueOf)
                        .collect(Collectors.joining(","))
        );

        campaign.setVariableMapping(toJson(mapping));
        campaign.setTotalCount(contacts.size());
        campaign.setStatus("RUNNING");

        campaign = campaignRepo.save(campaign);

        // Prepare outbound messages
        List<WhatsappEntity> messages = new ArrayList<>();

        for (int idx = 0; idx < contacts.size(); idx++) {

            ContactEntity contact = contacts.get(idx);

            // Resolve body variables
            List<String> params = new ArrayList<>();

            for (int i = 0; i < varCount; i++) {
                params.add(resolve(mapping.get(i), contact));
            }

            WhatsappEntity message = new WhatsappEntity();

            message.setRecipientName(contact.getName());
            message.setRecipientPhone(phones.get(idx));

            message.setTemplateName(tpl.getName());
            message.setLanguageCode(tpl.getLanguage());

            message.setMessageType("TEMPLATE");

            message.setMessage(
                    render(tpl.getBody(), params)
            );

            message.setTemplateParams(toJson(params));

            // Header media used when the message is actually sent
            message.setHeaderType(tpl.getHeaderType());
            message.setHeaderMediaUrl(headerMediaUrl);

            message.setCampaignId(campaign.getId());

            message.setDirection("OUTBOUND");
            message.setStatus("PENDING");

            messages.add(message);
        }

        messageRepo.saveAll(messages);

        return toResponse(campaign);
    }

    /**
     * Validate media header configuration.
     *
     * Meta only keeps a sample of the header media for approval, so the
     * real media must be supplied for every campaign as a public HTTPS URL.
     */
    private void validateTemplateHeader(TemplateEntity tpl, String mediaUrl) {

        String headerType = tpl.getHeaderType();

        if (headerType == null || headerType.isBlank()
                || "NONE".equalsIgnoreCase(headerType)
                || "TEXT".equalsIgnoreCase(headerType)) {
            return;
        }

        if ("LOCATION".equalsIgnoreCase(headerType)) {
            throw new IllegalArgumentException(
                    "Location header templates are not supported in campaigns yet");
        }

        if (!List.of("IMAGE", "VIDEO", "DOCUMENT")
                .contains(headerType.toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException(
                    "Unsupported template header type: " + headerType);
        }

        if (mediaUrl == null || mediaUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "This " + headerType + " template needs a header media file. "
                            + "Select a file before launching.");
        }

        URI uri;

        try {
            uri = URI.create(mediaUrl);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid header media URL. Please provide a valid public HTTPS URL.");
        }

        if (!"https".equalsIgnoreCase(uri.getScheme())
                || uri.getHost() == null
                || uri.getHost().isBlank()) {
            throw new IllegalArgumentException(
                    "Header media URL must be a valid public HTTPS URL");
        }
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> list() {

        return campaignRepo.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CampaignResponse get(Long id) {

        CampaignEntity campaign = campaignRepo.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Campaign not found"));

        return toResponse(campaign);
    }

    @Transactional(readOnly = true)
    public List<CampaignMessageDto> messages(Long id) {

        if (!campaignRepo.existsById(id)) {
            throw new IllegalArgumentException("Campaign not found");
        }

        return messageRepo.findByCampaignIdOrderByIdAsc(id)
                .stream()
                .map(m -> new CampaignMessageDto(
                        m.getId(),
                        m.getRecipientName(),
                        m.getRecipientPhone(),
                        m.getStatus(),
                        m.getErrorMessage(),
                        m.getSentAt(),
                        m.getDeliveredAt(),
                        m.getReadAt()
                ))
                .toList();
    }

    private CampaignResponse toResponse(CampaignEntity campaign) {

        Map<String, Long> counts = new HashMap<>();

        for (Object[] row : messageRepo.statusCounts(campaign.getId())) {
            counts.put(
                    String.valueOf(row[0]),
                    ((Number) row[1]).longValue()
            );
        }

        long pending =
                counts.getOrDefault("PENDING", 0L)
                        + counts.getOrDefault("PROCESSING", 0L);

        long read = counts.getOrDefault("READ", 0L);

        long delivered =
                read + counts.getOrDefault("DELIVERED", 0L);

        long sent =
                delivered + counts.getOrDefault("SENT", 0L);

        long failed = counts.getOrDefault("FAILED", 0L);

        long replied = campaign.getCreatedAt() == null
                ? 0L
                : messageRepo.countReplies(
                campaign.getId(),
                campaign.getCreatedAt()
        );

        return new CampaignResponse(
                campaign.getId(),
                campaign.getName(),
                campaign.getTemplateName(),
                campaign.getStatus(),
                campaign.getTotalCount(),
                pending,
                sent,
                delivered,
                read,
                failed,
                replied,
                campaign.getCreatedAt(),
                campaign.getCompletedAt()
        );
    }

    private String resolve(String source, ContactEntity contact) {

        if (source == null || source.isBlank()) {
            return "-";
        }

        if (source.startsWith("TEXT:")) {
            String value = source.substring(5);
            return value.isBlank() ? "-" : value;
        }

        String value = switch (source) {
            case "NAME" -> contact.getName();
            case "PHONE" -> contact.getPhone();
            case "EMAIL" -> contact.getEmail();
            default -> source;
        };

        return value == null || value.isBlank() ? "-" : value;
    }

    private String render(String body, List<String> params) {

        String result = body == null ? "" : body;

        for (int i = 0; i < params.size(); i++) {
            result = result.replace(
                    "{{" + (i + 1) + "}}",
                    params.get(i)
            );
        }

        return result;
    }

    private String toJson(Object value) {

        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException(
                    "Unable to convert campaign data to JSON",
                    ex
            );
        }
    }
}