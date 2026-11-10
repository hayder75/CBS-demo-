package com.cbs.sacco.memberlifecycle.repo;

import com.cbs.sacco.memberlifecycle.entity.MemberCustomField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MemberCustomFieldRepository extends JpaRepository<MemberCustomField, Long> {
    boolean existsByKeyIgnoreCase(String key);

    Optional<MemberCustomField> findByKeyIgnoreCase(String key);

    List<MemberCustomField> findAllByOrderByIdAsc();
}
