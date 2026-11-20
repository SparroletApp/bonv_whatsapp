package com.example.whatsapp.controller;

import com.example.whatsapp.dto.dashboarddto.DashboardResponseDto;
import com.example.whatsapp.service.DashboardService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @PostMapping("/get-counts")
    public DashboardResponseDto getDashboardCounts() {

        return dashboardService.getDashboardCounts();
    }
}