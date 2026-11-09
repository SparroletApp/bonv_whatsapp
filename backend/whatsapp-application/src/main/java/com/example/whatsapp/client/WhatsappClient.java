package com.example.whatsapp.client;

import com.example.whatsapp.config.WhatsappConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WhatsappClient {

    private final WhatsappConfig config;
    private final ObjectMapper mapper;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15)).build();

    private String root() {
        return config.getBaseUrl() + "/" + config.getApiVersion();
    }

    public String sendText(String to, String body) {
        ObjectNode p = baseMessage(to, "text");
        ObjectNode text = p.putObject("text");
        text.put("preview_url", false);
        text.put("body", body);
        return messageId(post(root() + "/" + config.getPhoneNumberId() + "/messages", p));
    }

    public String sendTemplate(String to, String name, String lang, List<String> bodyParams) {
        ObjectNode p = baseMessage(to, "template");
        ObjectNode tpl = p.putObject("template");
        tpl.put("name", name);
        tpl.putObject("language").put("code", lang);

        if (bodyParams != null && !bodyParams.isEmpty()) {
            ArrayNode components = tpl.putArray("components");
            ObjectNode body = components.addObject();
            body.put("type", "body");
            ArrayNode params = body.putArray("parameters");
            for (String v : bodyParams) {
                ObjectNode param = params.addObject();
                param.put("type", "text");
                param.put("text", clean(v));
            }
        }
        return messageId(post(root() + "/" + config.getPhoneNumberId() + "/messages", p));
    }


    public JsonNode createTemplate(ObjectNode payload) {
        return post(root() + "/" + config.getBusinessAccountId() + "/message_templates", payload);
    }

    public ArrayNode listTemplates() {
        ArrayNode all = mapper.createArrayNode();
        String url = root() + "/" + config.getBusinessAccountId() + "/message_templates?limit=100";
        while (url != null) {
            JsonNode page = get(url);
            page.path("data").forEach(all::add);
            JsonNode next = page.path("paging").path("next");
            url = next.isMissingNode() || next.isNull() ? null : next.asText();
        }
        return all;
    }


    private ObjectNode baseMessage(String to, String type) {
        ObjectNode p = mapper.createObjectNode();
        p.put("messaging_product", "whatsapp");
        p.put("recipient_type", "individual");
        p.put("to", to.replaceAll("[^0-9]", ""));
        p.put("type", type);
        return p;
    }

    private String clean(String v) {
        String s = v == null ? "" : v.replaceAll("[\\r\\n\\t]+", " ").trim();
        return s.isEmpty() ? "-" : s;
    }

    private String messageId(JsonNode res) {
        JsonNode msgs = res.path("messages");
        if (msgs.isArray() && !msgs.isEmpty()) {
            String id = msgs.get(0).path("id").asText(null);
            if (id != null && !id.isBlank()) return id;
        }
        throw new IllegalStateException("WhatsApp API did not return a message ID");
    }

    private JsonNode post(String url, ObjectNode body) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + config.getAccessToken())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();
            return handle(http.send(req, HttpResponse.BodyHandlers.ofString()));
        } catch (IOException e) {
            throw new IllegalStateException("WhatsApp API call failed: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("WhatsApp API call interrupted", e);
        }
    }

    private JsonNode get(String url) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + config.getAccessToken())
                    .GET().build();
            return handle(http.send(req, HttpResponse.BodyHandlers.ofString()));
        } catch (IOException e) {
            throw new IllegalStateException("WhatsApp API call failed: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("WhatsApp API call interrupted", e);
        }
    }

    private JsonNode handle(HttpResponse<String> res) throws IOException {
        JsonNode json = mapper.readTree(res.body());
        if (res.statusCode() < 200 || res.statusCode() >= 300) {
            JsonNode err = json.path("error");
            String msg = err.path("error_user_msg").asText(err.path("message").asText(res.body()));
            String details = err.path("error_data").path("details").asText("");
            if (!details.isBlank()) msg += " - " + details;
            String code = err.path("code").asText("");
            if (!code.isBlank()) msg += " (code " + code + ")";
            throw new IllegalStateException(msg);
        }
        return json;
    }

    public record MediaFile(byte[] data, String mimeType) {}

    public String uploadMedia(byte[] data, String mimeType, String filename) {
        String boundary = "----wa" + UUID.randomUUID();
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"messaging_product\"\r\n\r\nwhatsapp\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"type\"\r\n\r\n" + mimeType + "\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + filename
                    + "\"\r\nContent-Type: " + mimeType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            out.write(data);
            out.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(root() + "/" + config.getPhoneNumberId() + "/media"))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + config.getAccessToken())
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(out.toByteArray()))
                    .build();
            JsonNode res = handle(http.send(req, HttpResponse.BodyHandlers.ofString()));
            String id = res.path("id").asText(null);
            if (id == null || id.isBlank()) throw new IllegalStateException("WhatsApp API did not return a media ID");
            return id;
        } catch (IOException e) {
            throw new IllegalStateException("Media upload failed: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Media upload interrupted", e);
        }
    }

    public String sendImage(String to, String mediaId, String caption) {
        ObjectNode p = baseMessage(to, "image");
        ObjectNode image = p.putObject("image");
        image.put("id", mediaId);
        if (caption != null && !caption.isBlank()) image.put("caption", caption);
        return messageId(post(root() + "/" + config.getPhoneNumberId() + "/messages", p));
    }

    public String sendAudio(String to, String mediaId) {
        ObjectNode p = baseMessage(to, "audio");
        p.putObject("audio").put("id", mediaId);
        return messageId(post(root() + "/" + config.getPhoneNumberId() + "/messages", p));
    }

    public MediaFile downloadMedia(String mediaId) {
        try {
            JsonNode meta = get(root() + "/" + mediaId);
            String url = meta.path("url").asText(null);
            if (url == null) throw new IllegalStateException("Media URL not found");
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + config.getAccessToken())
                    .GET().build();
            HttpResponse<byte[]> res = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (res.statusCode() != 200) throw new IllegalStateException("Media download failed: " + res.statusCode());
            return new MediaFile(res.body(), meta.path("mime_type").asText("application/octet-stream"));
        } catch (IOException e) {
            throw new IllegalStateException("Media download failed: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Media download interrupted", e);
        }
    }
}