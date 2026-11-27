package com.example.whatsapp.service.impl;

import com.example.whatsapp.dto.dashboarddto.DashboardResponseDto;
import com.example.whatsapp.repository.CompanyRepository;
import com.example.whatsapp.repository.UserRepository;
import com.example.whatsapp.service.DashboardService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Override
    public DashboardResponseDto getDashboardCounts() {

        DashboardResponseDto dto = new DashboardResponseDto();

        dto.setTotalCompanies(companyRepository.count());

        dto.setTotalUsers(userRepository.count());

        dto.setActiveUsers(userRepository.countByStatus(true));

        dto.setInactiveUsers(userRepository.countByStatus(false));

        return dto;
    }
}