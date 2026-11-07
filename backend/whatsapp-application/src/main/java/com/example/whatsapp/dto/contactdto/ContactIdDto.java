package com.example.whatsapp.dto.contactdto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ContactIdDto {

    @NotNull(message = "Contact ID is required")
    @Positive(message = "Contact ID must be positive")
    private Long id;
}