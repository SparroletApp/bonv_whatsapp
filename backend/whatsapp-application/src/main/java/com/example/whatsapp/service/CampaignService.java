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

        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Campaign name is required");
        }
        if (req.categoryIds() == null || req.categoryIds().isEmpty()) {
            throw new IllegalArgumentException("Select at least one category");
        }

        TemplateEntity tpl = templateRepo.findById(req.templateId())
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (!"APPROVED".equalsIgnoreCase(tpl.getStatus())) {
            throw new IllegalArgumentException(
                    "Template is not approved yet (status: " + tpl.getStatus() + ")");
        }

        int varCount = tpl.getVariableCount();

        List<String> mapping = req.variableMapping() == null ? List.of() : req.variableMapping();
        if (mapping.size() < varCount) {
            throw new IllegalArgumentException("Map all " + varCount + " template variables");
        }

        // load contacts, drop invalid numbers, send once per phone number
        Set<String> seen = new HashSet<>();
        List<ContactEntity> contacts = new ArrayList<>();
        List<String> phones = new ArrayList<>();

        for (ContactEntity ct : contactRepo.findByCategoryIdIn(req.categoryIds())) {
            String phone = PhoneUtil.normalize(ct.getPhone());
            if (phone == null || phone.isBlank()) continue;      // invalid number
            if (!seen.add(phone)) continue;                      // duplicate across categories
            contacts.add(ct);
            phones.add(phone);
        }

        if (contacts.isEmpty()) {
            throw new IllegalArgumentException("Selected categories have no contacts with a valid phone number");
        }

        CampaignEntity c = new CampaignEntity();
        c.setName(req.name().trim());
        c.setTemplateId(tpl.getId());
        c.setTemplateName(tpl.getName());
        c.setCategoryIds(req.categoryIds().stream().map(String::valueOf).collect(Collectors.joining(",")));
        c.setVariableMapping(toJson(mapping));
        c.setTotalCount(contacts.size());
        c.setStatus("RUNNING");
        c = campaignRepo.save(c);

        List<WhatsappEntity> rows = new ArrayList<>();
        for (int idx = 0; idx < contacts.size(); idx++) {
            ContactEntity ct = contacts.get(idx);

            List<String> params = new ArrayList<>();
            for (int i = 0; i < varCount; i++) {
                params.add(resolve(mapping.get(i), ct));
            }

            WhatsappEntity m = new WhatsappEntity();
            m.setRecipientName(ct.getName());
            m.setRecipientPhone(phones.get(idx));
            m.setTemplateName(tpl.getName());
            m.setLanguageCode(tpl.getLanguage());
            m.setMessageType("TEMPLATE");
            m.setMessage(render(tpl.getBody(), params));
            m.setTemplateParams(toJson(params));
            m.setCampaignId(c.getId());
            m.setDirection("OUTBOUND");
            m.setStatus("PENDING");
            rows.add(m);
        }
        messageRepo.saveAll(rows);

        return toResponse(c);
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> list() {
        return campaignRepo.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CampaignResponse get(Long id) {
        return toResponse(campaignRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found")));
    }

    @Transactional(readOnly = true)
    public List<CampaignMessageDto> messages(Long id) {
        return messageRepo.findByCampaignIdOrderByIdAsc(id).stream()
                .map(m -> new CampaignMessageDto(m.getId(), m.getRecipientName(), m.getRecipientPhone(),
                        m.getStatus(), m.getErrorMessage(), m.getSentAt(), m.getDeliveredAt(), m.getReadAt()))
                .toList();
    }

    private CampaignResponse toResponse(CampaignEntity c) {
        Map<String, Long> n = new HashMap<>();
        for (Object[] r : messageRepo.statusCounts(c.getId())) {
            n.put(String.valueOf(r[0]), ((Number) r[1]).longValue());   // safe for Long / BigInteger
        }

        long pending   = n.getOrDefault("PENDING", 0L) + n.getOrDefault("PROCESSING", 0L);
        long read      = n.getOrDefault("READ", 0L);
        long delivered = read + n.getOrDefault("DELIVERED", 0L);   // includes read
        long sent      = delivered + n.getOrDefault("SENT", 0L);   // includes delivered + read
        long failed    = n.getOrDefault("FAILED", 0L);

        long replied = c.getCreatedAt() == null
                ? 0L
                : messageRepo.countReplies(c.getId(), c.getCreatedAt());

        return new CampaignResponse(c.getId(), c.getName(), c.getTemplateName(), c.getStatus(),
                c.getTotalCount(), pending, sent, delivered, read, failed, replied,
                c.getCreatedAt(), c.getCompletedAt());
    }

    private String resolve(String src, ContactEntity c) {
        if (src == null || src.isBlank()) return "-";
        if (src.startsWith("TEXT:")) {
            String t = src.substring(5);
            return t.isBlank() ? "-" : t;
        }
        String v = switch (src) {
            case "NAME"  -> c.getName();
            case "PHONE" -> c.getPhone();
            case "EMAIL" -> c.getEmail();
            default      -> src;
        };
        return (v == null || v.isBlank()) ? "-" : v;      // Meta rejects empty parameters
    }

    private String render(String body, List<String> params) {
        String out = body == null ? "" : body;
        for (int i = 0; i < params.size(); i++) {
            out = out.replace("{{" + (i + 1) + "}}", params.get(i));
        }
        return out;
    }

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }
}