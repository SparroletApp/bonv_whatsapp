package com.example.whatsapp.dto.categorydto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryIdDto {

    @NotNull(message = "Category ID is required")
    @Positive(message = "Category ID must be positive")
    private Long id;
}