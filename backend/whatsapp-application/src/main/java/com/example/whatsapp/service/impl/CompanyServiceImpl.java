package com.example.whatsapp.service.impl;

import com.example.whatsapp.dto.companydto.CompanyIdDto;
import com.example.whatsapp.dto.companydto.CompanyRequestDto;
import com.example.whatsapp.dto.companydto.CompanyResponseDto;
import com.example.whatsapp.dto.companydto.CompanyUpdateDto;
import com.example.whatsapp.entity.Company;
import com.example.whatsapp.repository.CompanyRepository;
import com.example.whatsapp.service.CompanyService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;

    @Override
    public CompanyResponseDto createCompany(CompanyRequestDto dto) {
        if (dto.getCompanyName() == null || dto.getCompanyName().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Company name is required");
        }
        Company company = new Company();
        company.setCompanyName(dto.getCompanyName().trim());
        return mapToResponse(companyRepository.save(company));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompanyResponseDto> getAllCompanies() {
        return companyRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyResponseDto getCompanyById(CompanyIdDto dto) {
        Company company = companyRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Company not found"));
        return mapToResponse(company);
    }

    @Override
    public CompanyResponseDto updateCompany(CompanyUpdateDto dto) {
        Company company = companyRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Company not found"));
        if (dto.getCompanyName() == null || dto.getCompanyName().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Company name is required");
        }
        company.setCompanyName(dto.getCompanyName().trim());
        return mapToResponse(companyRepository.save(company));
    }

    @Override
    public String deleteCompany(CompanyIdDto dto) {
        Company company = companyRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Company not found"));
        companyRepository.delete(company);
        return "Company deleted successfully";
    }

    private CompanyResponseDto mapToResponse(Company company) {
        CompanyResponseDto dto = new CompanyResponseDto();
        dto.setId(company.getId());
        dto.setCompanyName(company.getCompanyName());
        dto.setCreatedAt(company.getCreatedAt());
        dto.setUpdatedAt(company.getUpdatedAt());
        return dto;
    }
}