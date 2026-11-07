package com.example.whatsapp.dto.inbox;
import jakarta.validation.constraints.NotBlank;
public record ReplyRequest(@NotBlank String message) {}
