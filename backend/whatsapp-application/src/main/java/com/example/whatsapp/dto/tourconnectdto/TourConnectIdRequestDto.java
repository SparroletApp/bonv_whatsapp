package com.example.whatsapp.dto.tourconnectdto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TourConnectIdRequestDto {

    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}