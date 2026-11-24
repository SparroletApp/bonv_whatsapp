
package com.example.whatsapp.controller;

import com.example.whatsapp.entity.Company;
import com.example.whatsapp.repository.CompanyRepository;
import com.example.whatsapp.service.WebhookService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@RestController
@RequestMapping("/api/webhook/whatsapp")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final CompanyRepository companyRepository;
    private final WebhookService webhookService;
    private final ObjectMapper mapper;

    /**
     * Meta webhook verification.
     * Verify token is checked against the company table.
     */
    @GetMapping
    public ResponseEntity<String> verify(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String token,
            @RequestParam(name = "hub.challenge", required = false) String challenge) {

        log.info("WhatsApp webhook verification requested");

        if (!"subscribe".equals(mode)
                || token == null
                || token.isBlank()
                || challenge == null) {

            log.error("Missing or invalid webhook verification parameters");

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Verification failed");
        }

        String cleanToken = token.trim();

        Company company = companyRepository
                .findByWhatsappVerifyToken(cleanToken)
                .orElse(null);

        if (company == null) {

            log.error("No company found for the supplied WhatsApp verify token");

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Invalid verify token");
        }

        log.info(
                "Webhook verified successfully for company ID: {}, company: {}",
                company.getId(),
                company.getCompanyName()
        );

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(challenge);
    }

    /**
     * Meta sends incoming messages and message status updates here.
     */
    @PostMapping
    public ResponseEntity<Void> receive(
            @RequestBody byte[] body,
            @RequestHeader(
                    value = "X-Hub-Signature-256",
                    required = false
            ) String signature) {

        try {

            String rawBody = new String(body, StandardCharsets.UTF_8);

            log.info("WhatsApp webhook POST received");

            JsonNode root = mapper.readTree(rawBody);

            Company company = findCompany(root);

            if (company == null) {

                log.error("Company not found for webhook event");

                return ResponseEntity.notFound().build();
            }

            if (!validSignature(
                    body,
                    signature,
                    company.getWhatsappAppSecret())) {

                log.error(
                        "Invalid webhook signature for company: {}",
                        company.getCompanyName()
                );

                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            log.info(
                    "Webhook accepted for company: {}",
                    company.getCompanyName()
            );

            webhookService.handle(rawBody, company);

            return ResponseEntity.ok().build();

        } catch (Exception e) {

            log.error("Webhook controller error", e);

            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Identify the company using WABA ID or phone number ID.
     */
    private Company findCompany(JsonNode root) {

        for (JsonNode entry : root.path("entry")) {

            String wabaId = entry.path("id").asText(null);

            if (wabaId != null && !wabaId.isBlank()) {

                Company company = companyRepository
                        .findByWhatsappBusinessAccountId(wabaId)
                        .orElse(null);

                if (company != null) {
                    return company;
                }
            }

            for (JsonNode change : entry.path("changes")) {

                String phoneNumberId = change.path("value")
                        .path("metadata")
                        .path("phone_number_id")
                        .asText(null);

                if (phoneNumberId != null && !phoneNumberId.isBlank()) {

                    Company company = companyRepository
                            .findByWhatsappPhoneNumberId(phoneNumberId)
                            .orElse(null);

                    if (company != null) {
                        return company;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Validate Meta X-Hub-Signature-256 header.
     */
    private boolean validSignature(
            byte[] payload,
            String header,
            String appSecret) {

        if (header == null
                || !header.startsWith("sha256=")
                || appSecret == null
                || appSecret.isBlank()) {

            return false;
        }

        try {

            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(new SecretKeySpec(
                    appSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            ));

            String expected = "sha256=" +
                    HexFormat.of().formatHex(mac.doFinal(payload));

            return MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    header.getBytes(StandardCharsets.UTF_8)
            );

        } catch (Exception e) {

            log.error("Signature validation failed", e);

            return false;
        }
    }
}
