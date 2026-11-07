package com.example.whatsapp.dto.userdto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthResponseDto {

    private String accessToken;

    private UserResponseDto user;
}