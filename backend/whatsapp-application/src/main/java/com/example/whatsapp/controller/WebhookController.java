package com.example.whatsapp.controller;

import com.example.whatsapp.config.WhatsappConfig;
import com.example.whatsapp.service.WebhookService;
import lombok.RequiredArgsConstructor;
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
public class WebhookController {

    private final WhatsappConfig config;
    private final WebhookService webhookService;

    // Meta calls this once when you click "Verify and save"
    @GetMapping
    public ResponseEntity<String> verify(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        if ("subscribe".equals(mode) && token.equals(config.getVerifyToken())) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(403).body("Verification failed");
    }

    // Meta posts every event here
    @PostMapping
    public ResponseEntity<Void> receive(
            @RequestBody byte[] body,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature) {

        if (!validSignature(body, signature)) {
            return ResponseEntity.status(403).build();
        }
        webhookService.handle(new String(body, StandardCharsets.UTF_8));
        return ResponseEntity.ok().build();      // always answer 200 fast
    }

    private boolean validSignature(byte[] payload, String header) {
        if (header == null || !header.startsWith("sha256=")) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(config.getAppSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = "sha256=" + HexFormat.of().formatHex(mac.doFinal(payload));
            return MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8), header.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }
}