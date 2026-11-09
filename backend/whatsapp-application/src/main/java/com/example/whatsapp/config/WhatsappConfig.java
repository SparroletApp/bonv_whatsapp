package com.example.whatsapp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "whatsapp.cloud")
@Getter
@Setter
public class WhatsappConfig {

    private String accessToken;

    private String phoneNumberId;

    private String businessAccountId;

    private String appId;

    private String appSecret;

    private String verifyToken;

    private String apiVersion;

    private String baseUrl;
}