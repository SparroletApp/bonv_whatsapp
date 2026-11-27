package com.example.whatsapp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "companies")
@Getter
@Setter
public class Company extends BaseEntity {

    @Column(name = "company_name", nullable = false, unique = true, length = 150)
    private String companyName;

    @Column(name = "mail_username", length = 255)
    private String mailUsername;

    @Column(name = "mail_password", length = 500)
    private String mailPassword;

    @Column(name = "whatsapp_access_token", columnDefinition = "TEXT")
    private String whatsappAccessToken;

    @Column(name = "whatsapp_api_version", length = 50)
    private String whatsappApiVersion;

    @Column(name = "whatsapp_app_id", length = 100)
    private String whatsappAppId;

    @Column(name = "whatsapp_business_account_id", length = 100)
    private String whatsappBusinessAccountId;

    @Column(name = "whatsapp_phone_number_id", length = 100)
    private String whatsappPhoneNumberId;

    @Column(name = "whatsapp_verify_token", length = 500)
    private String whatsappVerifyToken;

    @Column(name = "whatsapp_app_secret", length = 500)
    private String whatsappAppSecret;

}