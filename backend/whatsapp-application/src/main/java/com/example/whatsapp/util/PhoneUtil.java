package com.example.whatsapp.util;

public final class PhoneUtil {
    private PhoneUtil() {}

    public static String normalize(String phone) {
        String d = phone == null ? "" : phone.replaceAll("\\D", "");
        if (d.length() == 10) return "91" + d;
        if (d.length() == 11 && d.startsWith("0")) return "91" + d.substring(1);
        return d;
    }
}
