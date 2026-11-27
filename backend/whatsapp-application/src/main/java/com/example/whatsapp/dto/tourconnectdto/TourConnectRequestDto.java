package com.example.whatsapp.dto.tourconnectdto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TourConnectRequestDto {

    private Long id;

    private Long companyId;

    private Long companyTourId;

    private String companyName;
}