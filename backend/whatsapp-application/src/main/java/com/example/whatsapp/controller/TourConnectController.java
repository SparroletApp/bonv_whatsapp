
package com.example.whatsapp.controller;

import com.example.whatsapp.dto.tourconnectdto.CompanyIdDto;
import com.example.whatsapp.dto.tourconnectdto.TourConnectRequestDto;
import com.example.whatsapp.dto.tourconnectdto.TourConnectResponseDto;
import com.example.whatsapp.service.TourConnectService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tour-connect")
@CrossOrigin(origins = "*")
public class TourConnectController {

    private final TourConnectService service;

    public TourConnectController(TourConnectService service) {
        this.service = service;
    }

    @PostMapping("/create")
    public ResponseEntity<TourConnectResponseDto> create(
            @RequestBody TourConnectRequestDto dto) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(dto));
    }

    @PostMapping("/get-all")
    public ResponseEntity<List<TourConnectResponseDto>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping("/get-by-id")
    public ResponseEntity<TourConnectResponseDto> getById(
            @RequestBody TourConnectRequestDto dto) {

        return ResponseEntity.ok(service.getById(dto.getId()));
    }

    @PostMapping("/get-by-company-id")
    public ResponseEntity<TourConnectResponseDto> getByCompanyId(
            @RequestBody CompanyIdDto dto) {

        return ResponseEntity.ok(
                service.getByCompanyId(dto)
        );
    }

    @PostMapping("/update")
    public ResponseEntity<TourConnectResponseDto> update(
            @RequestBody TourConnectRequestDto dto) {

        return ResponseEntity.ok(
                service.update(dto.getId(), dto)
        );
    }

    @PostMapping("/delete")
    public ResponseEntity<String> delete(
            @RequestBody TourConnectRequestDto dto) {

        service.delete(dto.getId());

        return ResponseEntity.ok(
                "Tour connection deleted successfully"
        );
    }
}
