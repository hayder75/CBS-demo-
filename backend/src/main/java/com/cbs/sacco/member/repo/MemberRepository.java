package com.cbs.sacco.member.repo;

import com.cbs.sacco.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    long countByStatus(String status);
    long countByJoinDateBetween(java.time.LocalDate start, java.time.LocalDate end);
}