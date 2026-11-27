package com.example.whatsapp.repository;

import com.example.whatsapp.entity.TourConnectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TourConnectRepository extends JpaRepository<TourConnectEntity, Long> {

    Optional<TourConnectEntity> findByCompanyId(Long companyId);

    boolean existsByCompanyId(Long companyId);
}