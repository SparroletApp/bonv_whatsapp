package com.example.whatsapp.dto.buttonruledto;

public record ButtonRuleResponseDto(
        Long id,
        Long sourceTemplateId,
        String sourceTemplateName,
        int buttonIndex,
        String buttonText,
        Long targetTemplateId,
        String targetTemplateName,
        String targetTemplateStatus   // so the UI can warn if it's not APPROVED
) {}