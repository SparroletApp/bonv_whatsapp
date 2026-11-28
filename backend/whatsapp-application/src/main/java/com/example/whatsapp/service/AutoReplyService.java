package com.example.whatsapp.service;

import com.example.whatsapp.client.WhatsappClient;
import com.example.whatsapp.entity.Company;
import com.example.whatsapp.entity.TemplateButtonRule;
import com.example.whatsapp.entity.TemplateEntity;
import com.example.whatsapp.entity.WhatsappEntity;
import com.example.whatsapp.repository.TemplateButtonRuleRepository;
import com.example.whatsapp.repository.TemplateRepository;
import com.example.whatsapp.repository.WhatsappRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class AutoReplyService {

    // Payload format: TPL:<sourceTemplateId>:BTN:<buttonIndex>
    private static final Pattern PAYLOAD =
            Pattern.compile("^TPL:(\\d+):BTN:(\\d+)$");

    private final TemplateButtonRuleRepository ruleRepo;
    private final TemplateRepository templateRepo;
    private final WhatsappClient client;
    private final WhatsappRepository whatsappRepo;
    private final ObjectMapper mapper;

    /**
     * Payload for each button position of a template.
     * QUICK_REPLY buttons get a payload; URL / PHONE_NUMBER buttons get null.
     * Pass the result as the last argument of WhatsappClient.sendTemplate(...).
     * Optional: the bot also works without payloads (see findRule).
     */
    public List<String> quickReplyPayloads(TemplateEntity template) {

        List<String> result = new ArrayList<>();

        if (template.getButtonsJson() == null
                || template.getButtonsJson().isBlank()) {
            return result;
        }

        try {

            JsonNode buttons = mapper.readTree(template.getButtonsJson());

            for (int i = 0; i < buttons.size(); i++) {

                boolean quickReply = "QUICK_REPLY".equals(
                        buttons.get(i).path("type").asText()
                );

                result.add(
                        quickReply
                                ? "TPL:" + template.getId() + ":BTN:" + i
                                : null
                );
            }

        } catch (Exception e) {

            log.warn(
                    "Could not parse buttons for template {}",
                    template.getId(),
                    e
            );
        }

        return result;
    }

    /**
     * Called from WebhookService when an inbound message has type "button".
     */
    // REQUIRES_NEW: if the auto-reply fails, only this inner transaction rolls
    // back. The already-saved inbound message in the webhook transaction stays.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onButtonClick(Company company, JsonNode msg) {

        String from = msg.path("from").asText();

        JsonNode button = msg.path("button");
        String payload = button.path("payload").asText("");
        String buttonText = button.path("text").asText("");
        String originalWamid = msg.path("context").path("id").asText("");

        log.info(
                "Button tap received. text='{}', payload='{}', replyTo='{}'",
                buttonText,
                payload,
                originalWamid
        );

        Optional<TemplateButtonRule> found =
                findRule(company, payload, buttonText, originalWamid);

        if (found.isEmpty()) {
            log.info("No reply rule matches this button tap");
            return;
        }

        TemplateButtonRule rule = found.get();

        TemplateEntity target = rule.getTargetTemplate();

        if (!"APPROVED".equals(target.getStatus())) {
            log.warn(
                    "Target template {} is {}, not sending",
                    target.getName(),
                    target.getStatus()
            );
            return;
        }

        String headerType = target.getHeaderType();

        String headerMedia = "IMAGE".equals(headerType)
                ? target.getHeaderMediaUrl()
                : null;

        String wamid = client.sendTemplate(
                company,
                from,
                target.getName(),
                target.getLanguage(),
                List.of(),                    // no variables for now
                headerType,
                headerMedia,
                quickReplyPayloads(target)
        );

        saveOutbound(company, from, target, headerType, headerMedia, wamid);

        log.info(
                "Auto-reply sent. Template {} button {} -> {}",
                rule.getSourceTemplate().getName(),
                rule.getButtonIndex(),
                target.getName()
        );
    }

    // -----------------------------------------------------
    // RULE LOOKUP
    // -----------------------------------------------------

    /**
     * 1) Use the payload when the template was sent with one.
     * 2) Otherwise use the id of the message that was answered
     *    (context.id), find which template it was, then match the
     *    tapped button by its text.
     */
    private Optional<TemplateButtonRule> findRule(
            Company company,
            String payload,
            String buttonText,
            String originalWamid
    ) {

        Matcher matcher = PAYLOAD.matcher(payload);

        if (matcher.matches()) {

            return ruleRepo.findBySourceTemplate_IdAndButtonIndexAndCompany_Id(
                    Long.parseLong(matcher.group(1)),
                    Integer.parseInt(matcher.group(2)),
                    company.getId()
            );
        }

        if (originalWamid.isBlank() || buttonText.isBlank()) {
            log.info("Tap has no payload and no reply context, cannot match");
            return Optional.empty();
        }

        WhatsappEntity original = whatsappRepo
                .findByWhatsappMessageId(originalWamid)
                .orElse(null);

        if (original == null || original.getTemplateName() == null) {
            log.info(
                    "Original message {} not found or is not a template",
                    originalWamid
            );
            return Optional.empty();
        }

        TemplateEntity source = templateRepo
                .findByNameAndCompany_Id(
                        original.getTemplateName(),
                        company.getId()
                )
                .stream()
                .filter(t -> original.getLanguageCode() == null
                        || original.getLanguageCode().equals(t.getLanguage()))
                .findFirst()
                .orElse(null);

        if (source == null) {
            log.info(
                    "Template '{}' not found for this company",
                    original.getTemplateName()
            );
            return Optional.empty();
        }

        return ruleRepo
                .findBySourceTemplate_IdAndCompany_IdOrderByButtonIndex(
                        source.getId(),
                        company.getId()
                )
                .stream()
                .filter(r -> buttonText.equalsIgnoreCase(r.getButtonText()))
                .findFirst();
    }

    private void saveOutbound(
            Company company,
            String to,
            TemplateEntity target,
            String headerType,
            String headerMedia,
            String wamid
    ) {

        WhatsappEntity out = new WhatsappEntity();

        out.setCompany(company);
        out.setDirection("OUTBOUND");
        out.setStatus("SENT");
        out.setWhatsappMessageId(wamid);
        out.setRecipientPhone(to);
        out.setRecipientName(to);
        out.setMessageType("TEMPLATE");
        out.setMessage(target.getBody());
        out.setTemplateName(target.getName());
        out.setLanguageCode(target.getLanguage());
        out.setHeaderType(headerType);
        out.setHeaderMediaUrl(headerMedia);
        out.setSentAt(LocalDateTime.now());
        out.setAgentRead(true);

        whatsappRepo.save(out);
    }
}