package com.example.whatsapp.dto.tourconnectdto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TourConnectResponseDto {

    private Long id;

    private Long companyId;

    private Long companyTourId;

    private String companyName;

    private LocalDateTime connectedAt;
}