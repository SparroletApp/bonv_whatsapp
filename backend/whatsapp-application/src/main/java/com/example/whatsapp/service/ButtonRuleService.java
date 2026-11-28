package com.example.whatsapp.service;

import com.example.whatsapp.dto.buttonruledto.ButtonRuleRequestDto;
import com.example.whatsapp.dto.buttonruledto.ButtonRuleResponseDto;
import com.example.whatsapp.dto.buttonruledto.ButtonRulesUpdateRequestDto;
import com.example.whatsapp.entity.TemplateButtonRule;
import com.example.whatsapp.entity.TemplateEntity;
import com.example.whatsapp.repository.TemplateButtonRuleRepository;
import com.example.whatsapp.repository.TemplateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ButtonRuleService {

    private final TemplateRepository templateRepo;
    private final TemplateButtonRuleRepository ruleRepo;
    private final ObjectMapper mapper;

    /**
     * Replaces all button rules of one template.
     */
    @Transactional
    public List<ButtonRuleResponseDto> save(
            Long companyId,
            Long templateId,
            ButtonRulesUpdateRequestDto req
    ) {

        TemplateEntity source = findOwned(templateId, companyId);

        JsonNode buttons = parseButtons(source);

        Set<Integer> seen = new HashSet<>();
        List<TemplateButtonRule> rules = new ArrayList<>();

        for (ButtonRuleRequestDto r : req.rules()) {

            if (!seen.add(r.buttonIndex())) {
                throw new IllegalArgumentException(
                        "Duplicate rule for button " + r.buttonIndex()
                );
            }

            JsonNode button = buttons.path(r.buttonIndex());

            if (button.isMissingNode()
                    || !"QUICK_REPLY".equals(button.path("type").asText())) {
                throw new IllegalArgumentException(
                        "Button " + r.buttonIndex()
                                + " is not a QUICK_REPLY button"
                );
            }

            TemplateEntity target = findOwned(
                    r.targetTemplateId(),
                    companyId
            );

            if (target.getVariableCount() > 0) {
                throw new IllegalArgumentException(
                        "Target template '" + target.getName()
                                + "' has variables. Auto-reply targets must "
                                + "have no variables for now."
                );
            }

            TemplateButtonRule rule = new TemplateButtonRule();
            rule.setCompany(source.getCompany());
            rule.setSourceTemplate(source);
            rule.setButtonIndex(r.buttonIndex());
            rule.setButtonText(button.path("text").asText());
            rule.setTargetTemplate(target);

            rules.add(rule);
        }

        ruleRepo.deleteBySource(templateId);
        ruleRepo.saveAll(rules);

        return get(companyId, templateId);
    }

    @Transactional(readOnly = true)
    public List<ButtonRuleResponseDto> get(
            Long companyId,
            Long templateId
    ) {

        return ruleRepo
                .findBySourceTemplate_IdAndCompany_IdOrderByButtonIndex(
                        templateId,
                        companyId
                )
                .stream()
                .map(r -> new ButtonRuleResponseDto(
                        r.getId(),
                        r.getSourceTemplate().getId(),
                        r.getSourceTemplate().getName(),
                        r.getButtonIndex(),
                        r.getButtonText(),
                        r.getTargetTemplate().getId(),
                        r.getTargetTemplate().getName(),
                        r.getTargetTemplate().getStatus()
                ))
                .toList();
    }

    // -----------------------------------------------------

    private TemplateEntity findOwned(Long id, Long companyId) {

        return templateRepo.findById(id)
                .filter(t -> t.getCompany() != null
                        && t.getCompany().getId().equals(companyId))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Template not found: " + id
                ));
    }

    private JsonNode parseButtons(TemplateEntity template) {

        try {

            return template.getButtonsJson() == null
                    || template.getButtonsJson().isBlank()
                    ? mapper.createArrayNode()
                    : mapper.readTree(template.getButtonsJson());

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Stored buttons are invalid for template "
                            + template.getId(),
                    e
            );
        }
    }
}