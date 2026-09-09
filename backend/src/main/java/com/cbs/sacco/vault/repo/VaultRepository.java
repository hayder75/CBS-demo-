package com.cbs.sacco.vault.repo;

import com.cbs.sacco.vault.entity.Vault;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VaultRepository extends JpaRepository<Vault, Long> {
    List<Vault> findByStatus(String status);
}
