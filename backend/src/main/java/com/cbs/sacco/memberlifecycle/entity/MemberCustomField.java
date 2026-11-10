package com.cbs.sacco.memberlifecycle.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Data
@Entity
@Table(name = "member_custom_field")
public class MemberCustomField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_key", nullable = false, unique = true, length = 80)
    private String key;

    @Column(nullable = false, length = 120)
    private String label;

    @Column(name = "field_type", nullable = false, length = 20)
    private String type;

    @Column(name = "applies_to", nullable = false, length = 20)
    private String appliesTo = "Both";

    @Column(nullable = false)
    private Boolean required = false;

    @JsonIgnore
    @Column(name = "options", length = 1000)
    private String optionsCsv;

    @Column(nullable = false, length = 20)
    private String status = "Active";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @JsonProperty("options")
    public List<String> getOptionList() {
        if (optionsCsv == null || optionsCsv.isBlank()) return List.of();
        return Arrays.stream(optionsCsv.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
