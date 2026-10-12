package com.cbs.sacco.producttype.repo;

import com.cbs.sacco.producttype.entity.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {
    boolean existsByCode(String code);
}
