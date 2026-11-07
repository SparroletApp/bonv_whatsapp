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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private static final Pattern VAR = Pattern.compile("\\{\\{(\\d+)}}");

    private final TemplateRepository repo;
    private final WhatsappClient client;
    private final ObjectMapper mapper;

    @Transactional
    public TemplateResponse create(TemplateCreateRequestDto r) {
        String name = r.name().trim().toLowerCase();
        if (repo.existsByNameAndLanguage(name, r.language())) {
            throw new IllegalArgumentException("A template with this name and language already exists");
        }

        int vars = countVariables(r.body());
        List<String> examples = r.bodyExamples() == null ? List.of() : r.bodyExamples();
        if (vars > 0 && examples.size() < vars) {
            throw new IllegalArgumentException("Provide an example value for each variable ({{1}}..{{" + vars + "}})");
        }

        ObjectNode payload = mapper.createObjectNode();
        payload.put("name", name);
        payload.put("language", r.language());
        payload.put("category", r.category());
        ArrayNode components = payload.putArray("components");

        if (r.headerText() != null && !r.headerText().isBlank()) {
            ObjectNode h = components.addObject();
            h.put("type", "HEADER");
            h.put("format", "TEXT");
            h.put("text", r.headerText());
        }

        ObjectNode body = components.addObject();
        body.put("type", "BODY");
        body.put("text", r.body());
        if (vars > 0) {
            ArrayNode row = body.putObject("example").putArray("body_text").addArray();
            for (int i = 0; i < vars; i++) row.add(examples.get(i));
        }

        if (r.footerText() != null && !r.footerText().isBlank()) {
            ObjectNode f = components.addObject();
            f.put("type", "FOOTER");
            f.put("text", r.footerText());
        }

        ArrayNode btnArray = mapper.createArrayNode();
        if (r.buttons() != null) {
            for (TemplateButtonDto b : r.buttons()) {
                ObjectNode bn = btnArray.addObject();
                bn.put("type", b.type());
                bn.put("text", b.text());
                if ("URL".equals(b.type())) bn.put("url", b.url());
                if ("PHONE_NUMBER".equals(b.type())) bn.put("phone_number", b.phoneNumber());
            }
        }
        if (!btnArray.isEmpty()) {
            ObjectNode bc = components.addObject();
            bc.put("type", "BUTTONS");
            bc.set("buttons", btnArray);
        }

        JsonNode res = client.createTemplate(payload);   // throws with Meta's error message if invalid

        TemplateEntity e = new TemplateEntity();
        e.setName(name);
        e.setLanguage(r.language());
        e.setCategory(r.category());
        e.setHeaderText(r.headerText());
        e.setBody(r.body());
        e.setFooterText(r.footerText());
        e.setButtonsJson(btnArray.isEmpty() ? null : btnArray.toString());
        e.setVariableCount(vars);
        e.setMetaTemplateId(res.path("id").asText(null));
        e.setStatus(res.path("status").asText("PENDING"));
        return map(repo.save(e));
    }

    /** Pull every template from Meta and upsert locally. */
    @Transactional
    public List<TemplateResponse> sync() {
        for (JsonNode t : client.listTemplates()) {
            String name = t.path("name").asText();
            String lang = t.path("language").asText();

            TemplateEntity e = repo.findByNameAndLanguage(name, lang).orElseGet(TemplateEntity::new);
            e.setName(name);
            e.setLanguage(lang);
            e.setCategory(t.path("category").asText("MARKETING"));
            e.setStatus(t.path("status").asText("PENDING"));
            e.setMetaTemplateId(t.path("id").asText(null));
            e.setRejectionReason(t.path("rejected_reason").asText(null));

            for (JsonNode c : t.path("components")) {
                switch (c.path("type").asText()) {
                    case "BODY" -> e.setBody(c.path("text").asText(""));
                    case "HEADER" -> {
                        if ("TEXT".equals(c.path("format").asText())) e.setHeaderText(c.path("text").asText(null));
                    }
                    case "FOOTER" -> e.setFooterText(c.path("text").asText(null));
                    case "BUTTONS" -> e.setButtonsJson(c.path("buttons").toString());
                    default -> { }
                }
            }
            e.setVariableCount(countVariables(e.getBody()));
            repo.save(e);
        }
        return list(null);
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> list(String status) {
        List<TemplateEntity> items = (status == null || status.isBlank())
                ? repo.findAllByOrderByCreatedAtDesc()
                : repo.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        return items.stream().map(this::map).toList();
    }

    /** Called from the webhook when Meta approves / rejects a template. */
    @Transactional
    public void applyWebhookStatus(String metaId, String name, String event, String reason) {
        TemplateEntity e = metaId == null ? null : repo.findByMetaTemplateId(metaId).orElse(null);
        List<TemplateEntity> targets = e != null ? List.of(e) : (name == null ? List.<TemplateEntity>of() : repo.findByName(name));
        for (TemplateEntity t : targets) {
            t.setStatus(event == null ? t.getStatus() : event.toUpperCase());
            t.setRejectionReason("NONE".equalsIgnoreCase(reason) ? null : reason);
            repo.save(t);
        }
    }

    public static int countVariables(String body) {
        if (body == null) return 0;
        Matcher m = VAR.matcher(body);
        int max = 0;
        while (m.find()) max = Math.max(max, Integer.parseInt(m.group(1)));
        return max;
    }

    private TemplateResponse map(TemplateEntity e) {
        return new TemplateResponse(e.getId(), e.getName(), e.getLanguage(), e.getCategory(),
                e.getHeaderText(), e.getBody(), e.getFooterText(), e.getButtonsJson(),
                e.getVariableCount(), e.getStatus(), e.getRejectionReason(), e.getCreatedAt());
    }
}