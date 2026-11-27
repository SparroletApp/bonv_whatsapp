package com.example.whatsapp.service.impl;

import com.example.whatsapp.dto.tourconnectdto.CompanyIdDto;
import com.example.whatsapp.dto.tourconnectdto.TourConnectRequestDto;
import com.example.whatsapp.dto.tourconnectdto.TourConnectResponseDto;
import com.example.whatsapp.entity.TourConnectEntity;
import com.example.whatsapp.repository.TourConnectRepository;
import com.example.whatsapp.service.TourConnectService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TourConnectServiceImpl implements TourConnectService {

    private final TourConnectRepository repository;

    public TourConnectServiceImpl(TourConnectRepository repository) {
        this.repository = repository;
    }

    private TourConnectResponseDto convertToDto(TourConnectEntity entity) {

        TourConnectResponseDto dto = new TourConnectResponseDto();

        dto.setId(entity.getId());
        dto.setCompanyId(entity.getCompanyId());
        dto.setCompanyTourId(entity.getCompanyTourId());
        dto.setCompanyName(entity.getCompanyName());
        dto.setConnectedAt(entity.getConnectedAt());

        return dto;
    }

    @Override
    public TourConnectResponseDto create(TourConnectRequestDto dto) {

        if (dto.getCompanyId() == null) {
            throw new RuntimeException("Company ID is required");
        }

        if (repository.existsByCompanyId(dto.getCompanyId())) {
            throw new RuntimeException("Company already connected");
        }

        TourConnectEntity entity = new TourConnectEntity();

        entity.setCompanyId(dto.getCompanyId());
        entity.setCompanyTourId(dto.getCompanyTourId());
        entity.setCompanyName(dto.getCompanyName());
        entity.setConnectedAt(LocalDateTime.now());

        return convertToDto(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TourConnectResponseDto> getAll() {

        return repository.findAll()
                .stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TourConnectResponseDto getById(Long id) {

        TourConnectEntity entity = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Tour connection not found"));

        return convertToDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public TourConnectResponseDto getByCompanyId(Long companyId) {

        TourConnectEntity entity = repository.findByCompanyId(companyId)
                .orElseThrow(() ->
                        new RuntimeException("Company connection not found"));

        return convertToDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public TourConnectResponseDto getByCompanyId(CompanyIdDto dto) {

        if (dto == null || dto.getCompanyId() == null) {
            throw new RuntimeException("Company ID is required");
        }

        TourConnectEntity entity = repository.findByCompanyId(dto.getCompanyId())
                .orElseThrow(() ->
                        new RuntimeException("Company connection not found"));

        return convertToDto(entity);
    }

    @Override
    public TourConnectResponseDto update(
            Long id,
            TourConnectRequestDto dto) {

        TourConnectEntity existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Tour connection not found"));

        if (dto.getCompanyId() == null) {
            throw new RuntimeException("Company ID is required");
        }

        if (!existing.getCompanyId().equals(dto.getCompanyId())
                && repository.existsByCompanyId(dto.getCompanyId())) {
            throw new RuntimeException("Company already connected");
        }

        existing.setCompanyId(dto.getCompanyId());
        existing.setCompanyTourId(dto.getCompanyTourId());
        existing.setCompanyName(dto.getCompanyName());

        return convertToDto(repository.save(existing));
    }

    @Override
    public void delete(Long id) {

        TourConnectEntity existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Tour connection not found"));

        repository.delete(existing);
    }
}