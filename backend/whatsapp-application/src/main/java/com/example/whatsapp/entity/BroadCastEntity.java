package com.example.whatsapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "broadcasts")
@Getter
@Setter
public class BroadCastEntity extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

}