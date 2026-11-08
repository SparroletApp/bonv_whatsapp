package com.example.whatsapp.service.impl;


import com.example.whatsapp.dto.broadcastdto.BroadcastIdRequestDto;
import com.example.whatsapp.entity.BroadCastEntity;
import com.example.whatsapp.repository.BroadcastRepository;
import com.example.whatsapp.service.BroadcastService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BroadcastServiceImpl implements BroadcastService {

    private final BroadcastRepository broadcastRepository;

    @Override
    public BroadCastEntity createBroadcast(BroadCastEntity broadcast) {
        return broadcastRepository.save(broadcast);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BroadCastEntity> getAllBroadcasts() {
        return broadcastRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public BroadCastEntity getBroadcastById(Long id) {
        return broadcastRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Broadcast not found with id: " + id
                ));
    }

    @Override
    public BroadCastEntity updateBroadcast(Long id, BroadCastEntity broadcast) {

        BroadCastEntity existingBroadcast = getBroadcastById(id);

        existingBroadcast.setName(broadcast.getName());

        return broadcastRepository.save(existingBroadcast);
    }

    @Override
    public void deleteBroadcast(Long id) {
        BroadCastEntity existingBroadcast = getBroadcastById(id);
        broadcastRepository.delete(existingBroadcast);
    }

    @Override
    @Transactional(readOnly = true)
    public BroadCastEntity getBroadcastByRequest(BroadcastIdRequestDto dto) {
        return getBroadcastById(dto.getId());
    }
}