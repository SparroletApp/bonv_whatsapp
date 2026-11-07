package com.example.whatsapp.dto.categorydto;
import java.util.List;
public record CategoryDetailsDto(
        Long id,
        String name,
        long contactCount,
        List<ContactItemDto>
        contacts) {}
