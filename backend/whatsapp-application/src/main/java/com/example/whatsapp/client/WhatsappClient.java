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
import java.net.URLEncoder;
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
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private String root() {
        return config.getBaseUrl() + "/" + config.getApiVersion();
    }

    // ==========================================
    // SEND TEXT
    // ==========================================

    public String sendText(String to, String body) {

        ObjectNode payload = baseMessage(to, "text");

        ObjectNode text = payload.putObject("text");
        text.put("preview_url", false);
        text.put("body", body);

        return messageId(post(
                root() + "/" + config.getPhoneNumberId() + "/messages",
                payload
        ));
    }

    // ==========================================
    // SEND TEMPLATE
    // ==========================================

    public String sendTemplate(
            String to,
            String name,
            String lang,
            List<String> bodyParams
    ) {

        ObjectNode payload = baseMessage(to, "template");

        ObjectNode template = payload.putObject("template");

        template.put("name", name);
        template.putObject("language").put("code", lang);

        if (bodyParams != null && !bodyParams.isEmpty()) {

            ArrayNode components = template.putArray("components");

            ObjectNode body = components.addObject();
            body.put("type", "body");

            ArrayNode parameters = body.putArray("parameters");

            for (String value : bodyParams) {

                ObjectNode param = parameters.addObject();

                param.put("type", "text");
                param.put("text", clean(value));
            }
        }

        return messageId(post(
                root() + "/" + config.getPhoneNumberId() + "/messages",
                payload
        ));
    }

    // ==========================================
    // CREATE TEMPLATE
    // ==========================================

    public JsonNode createTemplate(ObjectNode payload) {

        return post(
                root() + "/" + config.getBusinessAccountId()
                        + "/message_templates",
                payload
        );
    }

    // ==========================================
    // LIST TEMPLATES
    // ==========================================

    public ArrayNode listTemplates() {

        ArrayNode all = mapper.createArrayNode();

        String url = root()
                + "/" + config.getBusinessAccountId()
                + "/message_templates?limit=100";

        while (url != null) {

            JsonNode page = get(url);

            page.path("data").forEach(all::add);

            JsonNode next = page.path("paging").path("next");

            url = next.isMissingNode() || next.isNull()
                    ? null
                    : next.asText();
        }

        return all;
    }

    // ==========================================
    // BASE MESSAGE
    // ==========================================

    private ObjectNode baseMessage(String to, String type) {

        ObjectNode payload = mapper.createObjectNode();

        payload.put("messaging_product", "whatsapp");
        payload.put("recipient_type", "individual");
        payload.put("to", to.replaceAll("[^0-9]", ""));
        payload.put("type", type);

        return payload;
    }

    private String clean(String value) {

        String result = value == null
                ? ""
                : value.replaceAll("[\\r\\n\\t]+", " ").trim();

        return result.isEmpty() ? "-" : result;
    }

    private String messageId(JsonNode response) {

        JsonNode messages = response.path("messages");

        if (messages.isArray() && !messages.isEmpty()) {

            String id = messages.get(0).path("id").asText(null);

            if (id != null && !id.isBlank()) {
                return id;
            }
        }

        throw new IllegalStateException(
                "WhatsApp API did not return a message ID"
        );
    }

    // ==========================================
    // POST JSON
    // ==========================================

    private JsonNode post(String url, ObjectNode body) {

        try {

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header(
                            "Authorization",
                            "Bearer " + config.getAccessToken()
                    )
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            mapper.writeValueAsString(body)
                    ))
                    .build();

            return handle(http.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            ));

        } catch (IOException e) {

            throw new IllegalStateException(
                    "WhatsApp API call failed: " + e.getMessage(), e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "WhatsApp API call interrupted", e
            );
        }
    }

    // ==========================================
    // GET
    // ==========================================

    private JsonNode get(String url) {

        try {

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header(
                            "Authorization",
                            "Bearer " + config.getAccessToken()
                    )
                    .GET()
                    .build();

            return handle(http.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            ));

        } catch (IOException e) {

            throw new IllegalStateException(
                    "WhatsApp API call failed: " + e.getMessage(), e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "WhatsApp API call interrupted", e
            );
        }
    }

    // ==========================================
    // HANDLE META RESPONSE
    // ==========================================

    private JsonNode handle(HttpResponse<String> response)
            throws IOException {

        JsonNode json = mapper.readTree(response.body());

        if (response.statusCode() < 200
                || response.statusCode() >= 300) {

            JsonNode error = json.path("error");

            String message = error.path("error_user_msg")
                    .asText(error.path("message").asText(response.body()));

            String details = error.path("error_data")
                    .path("details").asText("");

            if (!details.isBlank()) {
                message += " - " + details;
            }

            String code = error.path("code").asText("");

            if (!code.isBlank()) {
                message += " (code " + code + ")";
            }

            throw new IllegalStateException(message);
        }

        return json;
    }

    // ==========================================
    // MEDIA FILE
    // ==========================================

    public record MediaFile(byte[] data, String mimeType) {
    }

    // ==========================================
    // UPLOAD NORMAL WHATSAPP MEDIA
    // ==========================================

    public String uploadMedia(
            byte[] data,
            String mimeType,
            String filename
    ) {

        String boundary = "----wa" + UUID.randomUUID();

        try {

            ByteArrayOutputStream out = new ByteArrayOutputStream();

            out.write((
                    "--" + boundary
                            + "\r\nContent-Disposition: form-data; name=\"messaging_product\""
                            + "\r\n\r\nwhatsapp\r\n"
            ).getBytes(StandardCharsets.UTF_8));

            out.write((
                    "--" + boundary
                            + "\r\nContent-Disposition: form-data; name=\"type\""
                            + "\r\n\r\n" + mimeType + "\r\n"
            ).getBytes(StandardCharsets.UTF_8));

            out.write((
                    "--" + boundary
                            + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\""
                            + filename + "\""
                            + "\r\nContent-Type: " + mimeType
                            + "\r\n\r\n"
            ).getBytes(StandardCharsets.UTF_8));

            out.write(data);

            out.write((
                    "\r\n--" + boundary + "--\r\n"
            ).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(
                            root() + "/" + config.getPhoneNumberId() + "/media"
                    ))
                    .timeout(Duration.ofSeconds(60))
                    .header(
                            "Authorization",
                            "Bearer " + config.getAccessToken()
                    )
                    .header(
                            "Content-Type",
                            "multipart/form-data; boundary=" + boundary
                    )
                    .POST(HttpRequest.BodyPublishers.ofByteArray(
                            out.toByteArray()
                    ))
                    .build();

            JsonNode response = handle(http.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            ));

            String id = response.path("id").asText(null);

            if (id == null || id.isBlank()) {
                throw new IllegalStateException(
                        "WhatsApp API did not return a media ID"
                );
            }

            return id;

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Media upload failed: " + e.getMessage(), e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Media upload interrupted", e
            );
        }
    }

    // ==========================================
    // UPLOAD TEMPLATE SAMPLE MEDIA
    // IMAGE / VIDEO / DOCUMENT
    // ==========================================

    public String uploadTemplateSample(
            byte[] data,
            String mimeType,
            String filename
    ) {

        try {

            String encodedFilename = URLEncoder.encode(
                    filename,
                    StandardCharsets.UTF_8
            );

            String encodedMimeType = URLEncoder.encode(
                    mimeType,
                    StandardCharsets.UTF_8
            );

            // STEP 1: CREATE RESUMABLE UPLOAD SESSION

            String sessionUrl = root()
                    + "/" + config.getAppId()
                    + "/uploads"
                    + "?file_name=" + encodedFilename
                    + "&file_length=" + data.length
                    + "&file_type=" + encodedMimeType;

            HttpRequest sessionRequest = HttpRequest.newBuilder()
                    .uri(URI.create(sessionUrl))
                    .timeout(Duration.ofSeconds(30))
                    .header(
                            "Authorization",
                            "Bearer " + config.getAccessToken()
                    )
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            JsonNode sessionResponse = handle(http.send(
                    sessionRequest,
                    HttpResponse.BodyHandlers.ofString()
            ));

            String sessionId = sessionResponse.path("id").asText(null);

            if (sessionId == null || sessionId.isBlank()) {

                throw new IllegalStateException(
                        "Meta did not return an upload session ID"
                );
            }

            // STEP 2: UPLOAD BINARY FILE

            HttpRequest uploadRequest = HttpRequest.newBuilder()
                    .uri(URI.create(root() + "/" + sessionId))
                    .timeout(Duration.ofSeconds(120))
                    .header(
                            "Authorization",
                            "OAuth " + config.getAccessToken()
                    )
                    .header("file_offset", "0")
                    .header(
                            "Content-Type",
                            "application/octet-stream"
                    )
                    .POST(HttpRequest.BodyPublishers.ofByteArray(data))
                    .build();

            JsonNode uploadResponse = handle(http.send(
                    uploadRequest,
                    HttpResponse.BodyHandlers.ofString()
            ));

            // STEP 3: RETURN META HEADER HANDLE

            String handle = uploadResponse.path("h").asText(null);

            if (handle == null || handle.isBlank()) {

                throw new IllegalStateException(
                        "Meta did not return a template media handle"
                );
            }

            return handle;

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Template sample upload failed: " + e.getMessage(), e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Template sample upload interrupted", e
            );
        }
    }

    // ==========================================
    // SEND IMAGE
    // ==========================================

    public String sendImage(
            String to,
            String mediaId,
            String caption
    ) {

        ObjectNode payload = baseMessage(to, "image");

        ObjectNode image = payload.putObject("image");

        image.put("id", mediaId);

        if (caption != null && !caption.isBlank()) {
            image.put("caption", caption);
        }

        return messageId(post(
                root() + "/" + config.getPhoneNumberId() + "/messages",
                payload
        ));
    }

    // ==========================================
    // SEND AUDIO
    // ==========================================

    public String sendAudio(String to, String mediaId) {

        ObjectNode payload = baseMessage(to, "audio");

        payload.putObject("audio").put("id", mediaId);

        return messageId(post(
                root() + "/" + config.getPhoneNumberId() + "/messages",
                payload
        ));
    }

    // ==========================================
    // DOWNLOAD MEDIA
    // ==========================================

    public MediaFile downloadMedia(String mediaId) {

        try {

            JsonNode meta = get(root() + "/" + mediaId);

            String url = meta.path("url").asText(null);

            if (url == null) {
                throw new IllegalStateException("Media URL not found");
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header(
                            "Authorization",
                            "Bearer " + config.getAccessToken()
                    )
                    .GET()
                    .build();

            HttpResponse<byte[]> response = http.send(
                    request,
                    HttpResponse.BodyHandlers.ofByteArray()
            );

            if (response.statusCode() != 200) {

                throw new IllegalStateException(
                        "Media download failed: " + response.statusCode()
                );
            }

            return new MediaFile(
                    response.body(),
                    meta.path("mime_type")
                            .asText("application/octet-stream")
            );

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Media download failed: " + e.getMessage(), e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Media download interrupted", e
            );
        }
    }
}