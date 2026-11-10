package com.example.whatsapp.dto.contactdto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ContactResponseDto {

    private Long id;

    private String name;

    private String phone;

    private String email;

    private List<Long> categoryIds;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}