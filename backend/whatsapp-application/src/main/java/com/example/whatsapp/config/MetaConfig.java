package com.example.whatsapp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "meta.whatsapp")
public class MetaConfig {

    private String appId;

    private String appSecret;

    private String graphVersion;
}