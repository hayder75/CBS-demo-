package com.cbs.sacco.memberlifecycle.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(name = "member_custom_value")
public class MemberCustomValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "field_id", nullable = false)
    private Long fieldId;

    @Column(name = "field_key", nullable = false, length = 80)
    private String fieldKey;

    @Column(nullable = false, length = 120)
    private String label;

    @Column(name = "field_type", nullable = false, length = 20)
    private String type;

    @Column(length = 1000)
    private String value;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
