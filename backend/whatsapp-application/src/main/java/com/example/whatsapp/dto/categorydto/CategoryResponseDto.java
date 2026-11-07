package com.example.whatsapp.dto.categorydto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CategoryResponseDto {

    private Long id;
    private String categoryName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}