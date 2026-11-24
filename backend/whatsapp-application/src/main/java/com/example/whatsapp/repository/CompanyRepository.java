package com.example.whatsapp.repository;

import com.example.whatsapp.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByWhatsappBusinessAccountId(
            String whatsappBusinessAccountId
    );

    Optional<Company> findByWhatsappVerifyToken(
            String whatsappVerifyToken
    );

    Optional<Company> findByWhatsappPhoneNumberId(
            String whatsappPhoneNumberId
    );
}