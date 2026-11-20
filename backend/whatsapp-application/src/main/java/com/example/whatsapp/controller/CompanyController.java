package com.example.whatsapp.controller;


import com.example.whatsapp.dto.companydto.CompanyIdDto;
import com.example.whatsapp.dto.companydto.CompanyRequestDto;
import com.example.whatsapp.dto.companydto.CompanyResponseDto;
import com.example.whatsapp.dto.companydto.CompanyUpdateDto;
import com.example.whatsapp.service.CompanyService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompanyController {

    private final CompanyService companyService;

    @PostMapping("/create")
    public ResponseEntity<CompanyResponseDto> createCompany(
            @RequestBody CompanyRequestDto dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(companyService.createCompany(dto));
    }

    @PostMapping("/get-all")
    public ResponseEntity<List<CompanyResponseDto>> getAllCompanies() {

        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @PostMapping("/get-by-id")
    public ResponseEntity<CompanyResponseDto> getCompanyById(
            @RequestBody CompanyIdDto dto) {

        return ResponseEntity.ok(companyService.getCompanyById(dto));
    }

    @PostMapping("/update")
    public ResponseEntity<CompanyResponseDto> updateCompany(
            @RequestBody CompanyUpdateDto dto) {

        return ResponseEntity.ok(companyService.updateCompany(dto));
    }

    @PostMapping("/delete")
    public ResponseEntity<String> deleteCompany(
            @RequestBody CompanyIdDto dto) {

        return ResponseEntity.ok(companyService.deleteCompany(dto));
    }
}