
package com.example.whatsapp.config;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
public class S3Config {

    @Value("${garage.endpoint}")
    private String endpoint;

    @Value("${garage.access-key}")
    private String accessKey;

    @Value("${garage.secret-key}")
    private String secretKey;

    @Value("${garage.region:garage}")
    private String region;

    @Bean
    public S3Client s3Client() {

        validateConfiguration();

        return S3Client.builder()
                .endpointOverride(URI.create(endpoint.trim()))
                .region(Region.of(region))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        accessKey.trim(),
                                        secretKey.trim()
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

    private void validateConfiguration() {

        if (endpoint == null || endpoint.isBlank()) {
            throw new IllegalStateException(
                    "Garage configuration error: GARAGE_ENDPOINT is missing"
            );
        }

        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException(
                    "Garage configuration error: GARAGE_ACCESS_KEY is missing"
            );
        }

        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "Garage configuration error: GARAGE_SECRET_KEY is missing"
            );
        }

        if (region == null || region.isBlank()) {
            throw new IllegalStateException(
                    "Garage configuration error: GARAGE_REGION is missing"
            );
        }
    }
}
