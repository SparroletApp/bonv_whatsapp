package com.example.whatsapp.service;

import com.example.whatsapp.dto.companydto.CompanyIdDto;
import com.example.whatsapp.dto.companydto.CompanyRequestDto;
import com.example.whatsapp.dto.companydto.CompanyResponseDto;
import com.example.whatsapp.dto.companydto.CompanyUpdateDto;

import java.util.List;

public interface CompanyService {
    CompanyResponseDto createCompany(CompanyRequestDto dto);
    List<CompanyResponseDto> getAllCompanies();
    CompanyResponseDto getCompanyById(CompanyIdDto dto);
    CompanyResponseDto updateCompany(CompanyUpdateDto dto);
    String deleteCompany(CompanyIdDto dto);
}