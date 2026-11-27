package com.example.whatsapp.dto.inbox;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReplyRequest(
        @NotNull Long companyId,
        @NotBlank String message
) {}
