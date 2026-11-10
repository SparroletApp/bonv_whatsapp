package com.example.whatsapp.dto.campaign;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

public record CampaignCreateRequest(
        @NotBlank String name,
        @NotNull Long templateId,
        @NotEmpty List<Long> categoryIds,
        List<String> variableMapping,
        String headerMediaUrl,
        LocalDateTime scheduledAt
) {}