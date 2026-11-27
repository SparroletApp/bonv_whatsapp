package com.example.whatsapp.service;

import com.example.whatsapp.dto.tourconnectdto.CompanyIdDto;
import com.example.whatsapp.dto.tourconnectdto.TourConnectRequestDto;
import com.example.whatsapp.dto.tourconnectdto.TourConnectResponseDto;

import java.util.List;

public interface TourConnectService {

    TourConnectResponseDto create(TourConnectRequestDto dto);

    List<TourConnectResponseDto> getAll();

    TourConnectResponseDto getById(Long id);

    TourConnectResponseDto getByCompanyId(CompanyIdDto dto);

    TourConnectResponseDto update(Long id, TourConnectRequestDto dto);

    void delete(Long id);
}