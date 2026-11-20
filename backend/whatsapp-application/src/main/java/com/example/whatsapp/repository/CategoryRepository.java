
package com.example.whatsapp.repository;

import com.example.whatsapp.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {
    boolean existsByCategoryNameAndCompany_Id(
            String categoryName,
            Long companyId
    );

    Optional<CategoryEntity> findByCategoryNameAndCompany_Id(
            String categoryName,
            Long companyId
    );

    java.util.List<CategoryEntity> findByCompany_Id(Long companyId);
}
