package com.example.whatsapp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "meta")
@Getter
@Setter
public class MetaProperties {
    private String appId;
    private String appSecret;
    private String graphVersion = "v23.0";
    private String graphBaseUrl = "https://graph.facebook.com";
    private String webhookVerifyToken;
    private String registrationPin = "123456";
    private String tokenEncryptionKey;
    private String allowedOrigins = "http://localhost:3000";
}
