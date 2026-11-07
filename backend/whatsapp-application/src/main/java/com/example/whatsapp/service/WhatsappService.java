
package com.example.whatsapp.service;
import com.example.whatsapp.dto.whatsappdto.WhatsappRequestDto;
import com.example.whatsapp.dto.whatsappdto.WhatsappResponseDto;

import java.util.List;

public interface WhatsappService {

    List<WhatsappResponseDto> sendBulkMessages(
            List<WhatsappRequestDto> requests
    );

    List<WhatsappResponseDto> getAllMessages();

    List<WhatsappResponseDto> getMessagesByStatus(String status);
}
