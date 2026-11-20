
package com.example.whatsapp.dto.companydto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CompanyResponseDto {

    private Long id;
    private String companyName;
    private String mailUsername;
    private String mailPassword;
    private String whatsappAccessToken;
    private String whatsappApiVersion;
    private String whatsappAppId;
    private String whatsappBusinessAccountId;
    private String whatsappPhoneNumberId;
    private String whatsappVerifyToken;
    private String whatsappAppSecret;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
