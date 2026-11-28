package com.example.whatsapp.dto.buttonruledto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ButtonRulesUpdateRequestDto(
        @NotEmpty @Valid
        List<ButtonRuleRequestDto> rules
) {}