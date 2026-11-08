package com.example.whatsapp.controller;

import com.example.whatsapp.dto.broadcastdto.BroadcastIdRequestDto;
import com.example.whatsapp.entity.BroadCastEntity;
import com.example.whatsapp.service.BroadcastService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/broadcasts")
@RequiredArgsConstructor
public class BroadcastController {

    private final BroadcastService broadcastService;

    @PostMapping("/create")
    public ResponseEntity<BroadCastEntity> createBroadcast(
            @RequestBody BroadCastEntity broadcast) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(broadcastService.createBroadcast(broadcast));
    }

    @GetMapping("/all")
    public ResponseEntity<List<BroadCastEntity>> getAllBroadcasts() {

        return ResponseEntity.ok(broadcastService.getAllBroadcasts());
    }

    @PostMapping("/get")
    public ResponseEntity<BroadCastEntity> getBroadcastById(
            @RequestBody BroadcastIdRequestDto dto) {

        return ResponseEntity.ok(
                broadcastService.getBroadcastByRequest(dto)
        );
    }

    @PostMapping("/update")
    public ResponseEntity<BroadCastEntity> updateBroadcast(
            @RequestBody BroadCastEntity broadcast) {

        return ResponseEntity.ok(
                broadcastService.updateBroadcast(
                        broadcast.getId(), broadcast
                )
        );
    }

    @PostMapping("/delete")
    public ResponseEntity<String> deleteBroadcast(
            @RequestBody BroadcastIdRequestDto dto) {

        broadcastService.deleteBroadcast(dto.getId());

        return ResponseEntity.ok("Broadcast deleted successfully");
    }
}