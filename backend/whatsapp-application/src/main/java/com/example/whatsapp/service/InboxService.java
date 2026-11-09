package com.example.whatsapp.service;

import com.example.whatsapp.client.WhatsappClient;
import com.example.whatsapp.dto.inbox.*;
import com.example.whatsapp.entity.WhatsappEntity;
import com.example.whatsapp.repository.WhatsappRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.example.whatsapp.entity.TemplateEntity;
import com.example.whatsapp.repository.TemplateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class InboxService {

    private static final long WINDOW_HOURS = 24;
    private static final long MAX_IMAGE = 5L * 1024 * 1024;
    private static final long MAX_AUDIO = 16L * 1024 * 1024;
    private final TemplateRepository templateRepo;
    private final ObjectMapper mapper;
    private static final ZoneId INDIA_ZONE =
            ZoneId.of("Asia/Kolkata");

    private final WhatsappRepository repo;
    private final WhatsappClient client;

    private final Clock clock =
            Clock.system(INDIA_ZONE);

    private LocalDateTime currentTime() {
        return LocalDateTime.now(clock);
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> conversations() {

        Map<String, Long> unread = new HashMap<>();

        for (Object[] r : repo.unreadCounts()) {
            unread.put((String) r[0], (Long) r[1]);
        }

        Map<String, LocalDateTime> lastInbound = new HashMap<>();

        for (Object[] r : repo.lastInboundTimes()) {
            lastInbound.put((String) r[0], (LocalDateTime) r[1]);
        }

        return repo.findLatestPerPhone()
                .stream()
                .map(m -> {

                    LocalDateTime inboundTime =
                            lastInbound.get(m.getRecipientPhone());

                    LocalDateTime expiresAt =
                            inboundTime == null
                                    ? null
                                    : inboundTime.plusHours(WINDOW_HOURS);

                    return new ConversationDto(
                            m.getRecipientPhone(),
                            m.getRecipientName(),
                            preview(m),
                            m.getCreatedAt(),
                            m.getDirection(),
                            unread.getOrDefault(
                                    m.getRecipientPhone(), 0L
                            ),
                            inboundTime,
                            expiresAt
                    );
                })
                .sorted(
                        Comparator.comparing(
                                ConversationDto::lastMessageAt
                        ).reversed()
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InboxMessageDto> messages(String phone) {

        return repo.findByRecipientPhoneOrderByCreatedAtAsc(phone)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void markRead(String phone) {
        repo.markConversationRead(phone);
    }

    /** Shared by text and media replies. */
    private WhatsappEntity requireOpenWindow(String phone) {

        WhatsappEntity lastIn = repo
                .findFirstByRecipientPhoneAndDirectionOrderByCreatedAtDesc(
                        phone, "INBOUND"
                )
                .orElseThrow(() -> new IllegalStateException(
                        "This contact has not messaged you yet. Send a template first."
                ));

        LocalDateTime expiry =
                lastIn.getCreatedAt().plusHours(WINDOW_HOURS);

        if (!currentTime().isBefore(expiry)) {
            throw new IllegalStateException(
                    "The 24-hour reply window is closed. Send an approved template instead."
            );
        }
        return lastIn;
    }

    @Transactional
    public InboxMessageDto reply(String phone, String text) {

        WhatsappEntity lastIn = requireOpenWindow(phone);

        WhatsappEntity out = new WhatsappEntity();

        out.setRecipientName(lastIn.getRecipientName());
        out.setRecipientPhone(phone);
        out.setMessage(text);
        out.setMessageType("TEXT");
        out.setDirection("OUTBOUND");
        out.setStatus("PROCESSING");

        try {
            out.setWhatsappMessageId(client.sendText(phone, text));
            out.setStatus("SENT");
            out.setSentAt(currentTime());

        } catch (Exception e) {
            out.setStatus("FAILED");
            out.setErrorMessage(e.getMessage());
        }

        return toDto(repo.save(out));
    }

    @Transactional
    public InboxMessageDto replyMedia(String phone, MultipartFile file, String caption) {

        WhatsappEntity lastIn = requireOpenWindow(phone);

        String mime = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        boolean image = mime.equals("image/jpeg") || mime.equals("image/png");
        boolean audio = mime.startsWith("audio/");

        if (!image && !audio) {
            throw new IllegalStateException("Only JPEG/PNG images and audio files are supported.");
        }
        if (file.getSize() > (image ? MAX_IMAGE : MAX_AUDIO)) {
            throw new IllegalStateException(
                    image ? "Image must be 5 MB or smaller." : "Audio must be 16 MB or smaller.");
        }

        WhatsappEntity out = new WhatsappEntity();
        out.setRecipientName(lastIn.getRecipientName());
        out.setRecipientPhone(phone);
        out.setMessage(caption);
        out.setMessageType(image ? "IMAGE" : "AUDIO");
        out.setMimeType(mime);
        out.setDirection("OUTBOUND");
        out.setStatus("PROCESSING");

        try {
            byte[] data = file.getBytes();
            String sendMime = mime;
            String filename = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();

            if (audio) {
                if (!mime.startsWith("audio/ogg")) {
                    data = toOggOpus(data);
                }
                sendMime = "audio/ogg; codecs=opus";
                filename = "voice.ogg";
            }

            String mediaId = client.uploadMedia(data, sendMime, filename);
            out.setMediaId(mediaId);
            out.setWhatsappMessageId(image
                    ? client.sendImage(phone, mediaId, caption)
                    : client.sendAudio(phone, mediaId));
            out.setStatus("SENT");
            out.setSentAt(currentTime());

        } catch (Exception e) {
            out.setStatus("FAILED");
            out.setErrorMessage(e.getMessage());
        }

        return toDto(repo.save(out));
    }

    public WhatsappClient.MediaFile media(String mediaId) {
        return client.downloadMedia(mediaId);
    }

    private byte[] toOggOpus(byte[] input) throws Exception {

        Path in = Files.createTempFile("wa-input-", ".webm");
        Path out = Files.createTempFile("wa-output-", ".ogg");

        try {
            Files.write(in, input);

            Process process = new ProcessBuilder(
                    "ffmpeg",
                    "-y",
                    "-i", in.toString(),
                    "-vn",
                    "-map_metadata", "-1",
                    "-ac", "1",
                    "-ar", "48000",
                    "-c:a", "libopus",
                    "-b:a", "32k",
                    "-application", "voip",
                    "-f", "ogg",
                    out.toString()
            )
                    .redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.INHERIT)
                    .start();

            boolean completed = process.waitFor(60, TimeUnit.SECONDS);

            if (!completed) {
                process.destroyForcibly();
                throw new IllegalStateException(
                        "Audio conversion timed out."
                );
            }

            if (process.exitValue() != 0) {
                throw new IllegalStateException(
                        "FFmpeg audio conversion failed. Exit code: "
                                + process.exitValue()
                );
            }

            if (!Files.exists(out) || Files.size(out) == 0) {
                throw new IllegalStateException(
                        "Converted audio file is empty."
                );
            }

            return Files.readAllBytes(out);

        } finally {
            Files.deleteIfExists(in);
            Files.deleteIfExists(out);
        }
    }

    @Transactional
    public InboxMessageDto sendTemplate(
            String phone,
            InboxTemplateRequestDto request
    ) {
        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("Recipient phone number is required.");
        }

        if (request == null || request.getTemplateId() == null) {
            throw new IllegalArgumentException("Please select a template.");
        }

        TemplateEntity template = templateRepo.findById(request.getTemplateId())
                .orElseThrow(() -> new IllegalArgumentException("Template not found."));

        if (!"APPROVED".equalsIgnoreCase(template.getStatus())) {
            throw new IllegalStateException("Only approved WhatsApp templates can be sent.");
        }

        String templateName = template.getName();
        String language = template.getLanguage();
        String headerType = template.getHeaderType() == null
                ? "NONE"
                : template.getHeaderType().trim().toUpperCase();

        if (request.getTemplateName() != null
                && !request.getTemplateName().isBlank()
                && !templateName.equals(request.getTemplateName())) {
            throw new IllegalArgumentException("The selected template does not match the request.");
        }

        if (request.getLanguage() != null
                && !request.getLanguage().isBlank()
                && !language.equals(request.getLanguage())) {
            throw new IllegalArgumentException("The selected template language does not match.");
        }

        List<String> parameters = request.getParameters() == null
                ? List.of()
                : request.getParameters();

        int expectedParameters = template.getVariableCount();

        if (parameters.size() != expectedParameters) {
            throw new IllegalArgumentException(
                    "This template requires " + expectedParameters
                            + " body parameter(s), but received " + parameters.size() + "."
            );
        }

        for (String parameter : parameters) {
            if (parameter == null || parameter.isBlank()) {
                throw new IllegalArgumentException(
                        "Template parameter values cannot be empty."
                );
            }
        }

        String headerMediaUrl = template.getHeaderMediaUrl();

        if (List.of("IMAGE", "VIDEO", "DOCUMENT").contains(headerType)
                && (headerMediaUrl == null || headerMediaUrl.isBlank())) {
            throw new IllegalStateException(
                    "The template has a " + headerType
                            + " header, but its saved media URL is missing. "
                            + "Please upload the template media again."
            );
        }

        if ("LOCATION".equals(headerType)) {
            throw new IllegalStateException(
                    "LOCATION template headers are not supported by the current Inbox sender."
            );
        }

        // Find the contact name from the most recent inbound message.
        // Sending an approved template does not require an open 24-hour window.
        String recipientName = repo
                .findFirstByRecipientPhoneAndDirectionOrderByCreatedAtDesc(
                        phone, "INBOUND"
                )
                .map(WhatsappEntity::getRecipientName)
                .orElse(phone);

        WhatsappEntity out = new WhatsappEntity();

        out.setRecipientName(recipientName);
        out.setRecipientPhone(phone);
        out.setDirection("OUTBOUND");
        out.setMessageType("TEMPLATE");
        out.setTemplateName(templateName);
        out.setLanguageCode(language);
        out.setTemplateParams(mapper.valueToTree(parameters).toString());
        out.setHeaderType(headerType);
        out.setHeaderMediaUrl(headerMediaUrl);
        out.setMimeType(
                "IMAGE".equals(headerType) ? "image/jpeg"
                        : "VIDEO".equals(headerType) ? "video/mp4"
                        : "DOCUMENT".equals(headerType) ? "application/pdf"
                        : null
        );
        out.setMessage(
                parameters.isEmpty()
                        ? "[template] " + templateName
                        : "[template] " + templateName + " - "
                        + String.join(", ", parameters)
        );
        out.setStatus("PROCESSING");

        try {
            String messageId = client.sendTemplate(
                    phone,
                    templateName,
                    language,
                    parameters,
                    headerType,
                    headerMediaUrl
            );

            out.setWhatsappMessageId(messageId);
            out.setStatus("SENT");
            out.setSentAt(currentTime());

        } catch (Exception ex) {
            out.setStatus("FAILED");
            out.setErrorMessage(ex.getMessage());

            // Keep the failed message visible in the Inbox.
        }

        return toDto(repo.save(out));
    }

    private String preview(WhatsappEntity m) {

        if (m.getMessage() != null && !m.getMessage().isBlank()) {
            return m.getMessage();
        }

        return m.getTemplateName() != null
                ? "[template] " + m.getTemplateName()
                : "[" + m.getMessageType() + "]";
    }

    private InboxMessageDto toDto(WhatsappEntity m) {

        return new InboxMessageDto(
                m.getId(),
                m.getDirection(),
                preview(m),
                m.getStatus(),
                m.getTemplateName(),
                m.getMessageType(),
                m.getErrorMessage(),
                m.getCreatedAt(),
                m.getMediaId(),
                m.getMimeType(),
                m.getHeaderType(),
                m.getHeaderMediaUrl()
        );
    }
}