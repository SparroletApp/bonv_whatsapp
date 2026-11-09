package com.example.whatsapp.service;

import com.example.whatsapp.client.WhatsappClient;
import com.example.whatsapp.dto.inbox.*;
import com.example.whatsapp.entity.WhatsappEntity;
import com.example.whatsapp.repository.WhatsappRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
                boolean ogg = mime.startsWith("audio/ogg");
                boolean direct = mime.startsWith("audio/mp4") || mime.startsWith("audio/mpeg")
                        || mime.startsWith("audio/aac") || mime.startsWith("audio/amr");

                if (ogg) {
                    sendMime = "audio/ogg; codecs=opus";
                } else if (direct) {
                    sendMime = mime.split(";")[0].trim();
                } else {
                    data = toOggOpus(data);
                    sendMime = "audio/ogg; codecs=opus";
                    filename = "voice.ogg";
                }
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
        Path in = Files.createTempFile("wa-in", ".bin");
        Path outFile = Files.createTempFile("wa-out", ".ogg");
        try {
            Files.write(in, input);
            Process pr = new ProcessBuilder("ffmpeg", "-y", "-i", in.toString(),
                    "-vn", "-c:a", "libopus", "-b:a", "32k", "-ar", "16000", "-ac", "1",
                    outFile.toString())
                    .redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .start();
            if (!pr.waitFor(30, TimeUnit.SECONDS) || pr.exitValue() != 0) {
                pr.destroyForcibly();
                throw new IllegalStateException("Audio conversion failed (is ffmpeg installed?)");
            }
            return Files.readAllBytes(outFile);
        } finally {
            Files.deleteIfExists(in);
            Files.deleteIfExists(outFile);
        }
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
                m.getMimeType()
        );
    }
}