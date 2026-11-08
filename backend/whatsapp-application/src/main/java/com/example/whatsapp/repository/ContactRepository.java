package com.example.whatsapp.repository;

import com.example.whatsapp.entity.ContactEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<ContactEntity, Long> {

    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    List<ContactEntity> findByCategoryIdIn(java.util.Collection<Long> categoryIds);
    List<ContactEntity> findByCategoryId(Long categoryId);
    long countByCategoryId(Long categoryId);
    List<ContactEntity> findAllByBroadcast_Id(Long broadcastId);
    List<ContactEntity> findAllByCategory_Id(Long categoryId);
}