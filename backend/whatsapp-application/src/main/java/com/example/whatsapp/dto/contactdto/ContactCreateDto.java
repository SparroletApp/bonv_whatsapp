package com.example.whatsapp.dto.contactdto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ContactCreateDto {

    @NotBlank(message = "Contact name is required")
    @Size(max = 150, message = "Name cannot exceed 150 characters")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String phone;

    @Email(message = "Please enter a valid email address")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @NotEmpty(message = "At least one category ID is required")
    private List<@Positive(message = "Category IDs must be positive") Long> categoryIds;
}