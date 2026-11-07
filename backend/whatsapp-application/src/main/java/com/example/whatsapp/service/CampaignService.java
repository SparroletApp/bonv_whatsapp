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
        TemplateEntity tpl = templateRepo.findById(req.templateId())
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));
        if (!"APPROVED".equals(tpl.getStatus())) {
            throw new IllegalArgumentException("Template is not approved yet (status: " + tpl.getStatus() + ")");
        }

        List<String> mapping = req.variableMapping() == null ? List.of() : req.variableMapping();
        if (mapping.size() < tpl.getVariableCount()) {
            throw new IllegalArgumentException("Map all " + tpl.getVariableCount() + " template variables");
        }

        List<ContactEntity> contacts = contactRepo.findByCategoryIdIn(req.categoryIds());
        if (contacts.isEmpty()) {
            throw new IllegalArgumentException("Selected categories have no contacts");
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
        for (ContactEntity ct : contacts) {
            List<String> params = new ArrayList<>();
            for (int i = 0; i < tpl.getVariableCount(); i++) params.add(resolve(mapping.get(i), ct));

            WhatsappEntity m = new WhatsappEntity();
            m.setRecipientName(ct.getName());
            m.setRecipientPhone(PhoneUtil.normalize(ct.getPhone()));
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
        for (Object[] r : messageRepo.statusCounts(c.getId())) n.put((String) r[0], (Long) r[1]);

        long pending = n.getOrDefault("PENDING", 0L) + n.getOrDefault("PROCESSING", 0L);
        long read = n.getOrDefault("READ", 0L);
        long delivered = read + n.getOrDefault("DELIVERED", 0L);
        long sent = delivered + n.getOrDefault("SENT", 0L);
        long failed = n.getOrDefault("FAILED", 0L);

        return new CampaignResponse(c.getId(), c.getName(), c.getTemplateName(), c.getStatus(),
                c.getTotalCount(), pending, sent, delivered, read, failed,
                c.getCreatedAt(), c.getCompletedAt());
    }

    private String resolve(String src, ContactEntity c) {
        if (src == null) return "-";
        if (src.startsWith("TEXT:")) return src.substring(5);
        return switch (src) {
            case "NAME" -> c.getName();
            case "PHONE" -> c.getPhone();
            case "EMAIL" -> c.getEmail() == null ? "-" : c.getEmail();
            default -> src;
        };
    }

    private String render(String body, List<String> params) {
        String out = body;
        for (int i = 0; i < params.size(); i++) out = out.replace("{{" + (i + 1) + "}}", params.get(i));
        return out;
    }

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }
}