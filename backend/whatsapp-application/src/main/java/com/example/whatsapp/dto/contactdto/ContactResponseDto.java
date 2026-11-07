package com.example.whatsapp.dto.contactdto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ContactResponseDto {

    private Long id;

    private String name;

    private String phone;

    private String email;

    private Long categoryId;

    private String categoryName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}