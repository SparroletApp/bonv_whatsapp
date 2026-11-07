package com.example.whatsapp.dto.userdto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserResponseDto {

    private Long id;

    private String name;

    private String email;

    private String phone;

    private String role;

    private Boolean status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}