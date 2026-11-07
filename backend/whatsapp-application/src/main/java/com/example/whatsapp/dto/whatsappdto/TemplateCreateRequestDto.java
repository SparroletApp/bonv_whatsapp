package com.example.whatsapp.dto.whatsappdto;

import jakarta.validation.constraints.*;
import java.util.List;

public record TemplateCreateRequestDto(
        @NotBlank @Pattern(regexp = "^[a-z0-9_]+$",
                message = "Name: lowercase letters, numbers and underscore only") String name,
        @NotBlank String language,
        @NotBlank @Pattern(regexp = "MARKETING|UTILITY", message = "Category must be MARKETING or UTILITY") String category,
        @Size(max = 60) String headerText,
        @NotBlank @Size(max = 1024) String body,
        @Size(max = 60) String footerText,
        List<String> bodyExamples,
        List<TemplateButtonDto> buttons) {}
