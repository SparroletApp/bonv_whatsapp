
package com.example.whatsapp.dto.whatsappdto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class WhatsappResponseDto {

    private Long id;
    private String recipientName;
    private String recipientPhone;
    private String status;
    private String whatsappMessageId;
    private String errorMessage;
}
