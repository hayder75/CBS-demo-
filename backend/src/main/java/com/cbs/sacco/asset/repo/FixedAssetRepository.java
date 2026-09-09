package com.cbs.sacco.asset.repo;

import com.cbs.sacco.asset.entity.FixedAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FixedAssetRepository extends JpaRepository<FixedAsset, Long> {
    List<FixedAsset> findByStatus(String status);
}
