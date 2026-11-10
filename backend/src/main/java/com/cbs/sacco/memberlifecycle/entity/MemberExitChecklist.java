package com.cbs.sacco.memberlifecycle.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "member_exit_checklist")
public class MemberExitChecklist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_key", nullable = false, length = 60)
    private String key;

    @Column(nullable = false, length = 160)
    private String label;

    @Column(nullable = false)
    private Boolean done = false;

    @Column(length = 500)
    private String note;

    @JsonIgnore
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
