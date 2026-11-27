package com.example.whatsapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tour_connections")
@Getter
@Setter
@NoArgsConstructor
public class TourConnectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long companyId;
    private Long companyTourId;
    private String companyName;
    private LocalDateTime connectedAt;
}