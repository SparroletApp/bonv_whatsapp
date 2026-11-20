package com.example.whatsapp.dto.companydto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CompanyResponseDto {

    private Long id;
    private String companyName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}