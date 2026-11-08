package com.example.whatsapp.repository;

import com.example.whatsapp.entity.BroadCastEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BroadcastRepository extends JpaRepository<BroadCastEntity, Long> {
}