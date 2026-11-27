
package com.example.whatsapp.dto.companydto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompanyUpdateDto {

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
}
