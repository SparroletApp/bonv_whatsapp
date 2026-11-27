package com.example.whatsapp.dto.userdto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompanyIdDto {

    @NotNull(message = "Company ID is required")
    private Long companyId;
}