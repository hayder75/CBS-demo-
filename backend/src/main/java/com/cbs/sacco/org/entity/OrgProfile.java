package com.cbs.sacco.org.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "org_profile")
public class OrgProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "legal_name")
    private String legalName;

    @Column(name = "registration_no")
    private String registrationNo;

    private String tin;

    private String phone;

    private String email;

    private String address;

    private String city;

    private String country;

    @Column(name = "currency_code", nullable = false)
    private String currencyCode = "ETB";

    @Column(name = "fiscal_year_start", nullable = false)
    private String fiscalYearStart = "Hamle 1";

    @Column(name = "logo_color", nullable = false)
    private String logoColor = "#0e7a5f";

    @Column(name = "org_status", nullable = false)
    private String status = "Active";
}
