
package com.example.whatsapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${garage.endpoint}")
    private String endpoint;

    @Value("${garage.access-key}")
    private String accessKey;

    @Value("${garage.secret-key}")
    private String secretKey;

    @Value("${garage.region}")
    private String region;

    @Bean
    public S3Client s3Client() {

        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException(
                    "GARAGE_ACCESS_KEY is missing"
            );
        }

        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "GARAGE_SECRET_KEY is missing"
            );
        }

        if (endpoint == null || endpoint.isBlank()) {
            throw new IllegalStateException(
                    "GARAGE_ENDPOINT is missing"
            );
        }

        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        accessKey,
                                        secretKey
                                )
                        )
                )
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build()
                )
                .build();
    }
}
