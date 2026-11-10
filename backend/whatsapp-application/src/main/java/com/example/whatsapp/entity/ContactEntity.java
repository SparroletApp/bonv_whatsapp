package com.example.whatsapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contacts")
@Getter
@Setter
public class ContactEntity extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 20, unique = true)
    private String phone;

    @Column(length = 150)
    private String email;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "category_ids", columnDefinition = "BIGINT[]")
    private Long[] categoryIds = new Long[0];

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "broadcast_id",
            nullable = true,
            foreignKey = @ForeignKey(name = "fk_contact_broadcast")
    )
    private BroadCastEntity broadcast;
}