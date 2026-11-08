package com.example.whatsapp.service;


import com.example.whatsapp.dto.broadcastdto.BroadcastIdRequestDto;
import com.example.whatsapp.entity.BroadCastEntity;

import java.util.List;

public interface BroadcastService {

    BroadCastEntity createBroadcast(BroadCastEntity broadcast);

    List<BroadCastEntity> getAllBroadcasts();

    BroadCastEntity getBroadcastById(Long id);

    BroadCastEntity updateBroadcast(Long id, BroadCastEntity broadcast);

    void deleteBroadcast(Long id);

    BroadCastEntity getBroadcastByRequest(BroadcastIdRequestDto dto);
}