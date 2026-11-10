package com.example.whatsapp.util;

import java.time.LocalDateTime;
import java.time.ZoneId;

public final class AppTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }

    private AppTime() {
    }
}