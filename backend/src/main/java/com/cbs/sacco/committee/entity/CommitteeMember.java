package com.cbs.sacco.committee.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "committee_member")
public class CommitteeMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "committee_id", nullable = false)
    private Long committeeId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column
    private String username;
}
