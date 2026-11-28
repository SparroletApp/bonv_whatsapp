package com.example.whatsapp.dto.buttonruledto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ButtonRuleRequestDto(
        @NotNull @Min(0) @Max(2)
        Integer buttonIndex,        // 0 = first button, 1 = second, 2 = third

        @NotNull
        Long targetTemplateId       // template to send when this button is tapped
) {}