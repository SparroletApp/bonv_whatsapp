
package com.example.whatsapp.repository;

import com.example.whatsapp.entity.ContactEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<ContactEntity, Long> {

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    // Find contacts matching any one of the supplied category IDs
    @Query(
            value = """
            SELECT *
            FROM contacts c
            WHERE EXISTS (
                SELECT 1
                FROM unnest(c.category_ids) AS category_id
                WHERE category_id IN (:categoryIds)
            )
            """,
            nativeQuery = true
    )
    List<ContactEntity> findByCategoryIdIn(
            @Param("categoryIds") Collection<Long> categoryIds
    );

    // Find contacts belonging to a particular category
    @Query(
            value = """
            SELECT *
            FROM contacts
            WHERE :categoryId = ANY(category_ids)
            """,
            nativeQuery = true
    )
    List<ContactEntity> findByCategoryId(
            @Param("categoryId") Long categoryId
    );

    // Count contacts belonging to a particular category
    @Query(
            value = """
            SELECT COUNT(*)
            FROM contacts
            WHERE :categoryId = ANY(category_ids)
            """,
            nativeQuery = true
    )
    long countByCategoryId(
            @Param("categoryId") Long categoryId
    );

    // Find all contacts assigned to a broadcast
    List<ContactEntity> findAllByBroadcast_Id(Long broadcastId);

    // Alternative existing method name, retained for compatibility
    @Query(
            value = """
            SELECT *
            FROM contacts
            WHERE :categoryId = ANY(category_ids)
            """,
            nativeQuery = true
    )
    List<ContactEntity> findAllByCategoryId(
            @Param("categoryId") Long categoryId
    );
}
