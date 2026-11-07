package com.example.whatsapp.dto.userdto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserIdDto {

    @NotNull(message = "User ID is required")
    private Long id;
}