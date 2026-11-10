package com.cbs.sacco.memberlifecycle.repo;

import com.cbs.sacco.memberlifecycle.entity.MemberCustomValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MemberCustomValueRepository extends JpaRepository<MemberCustomValue, Long> {
    List<MemberCustomValue> findByMemberIdOrderByIdAsc(Long memberId);

    Optional<MemberCustomValue> findByMemberIdAndFieldId(Long memberId, Long fieldId);
}
