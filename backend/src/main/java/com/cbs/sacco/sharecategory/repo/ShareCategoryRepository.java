package com.cbs.sacco.sharecategory.repo;

import com.cbs.sacco.sharecategory.entity.ShareCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShareCategoryRepository extends JpaRepository<ShareCategory, Long> {
    List<ShareCategory> findByStatus(String status);
}
