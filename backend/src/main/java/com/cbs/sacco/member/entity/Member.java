package com.cbs.sacco.member.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "member")
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_no", nullable = false, unique = true)
    private String memberNo;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, length = 1)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    private String phone;

    private String email;

    @Column(name = "fayda_id")
    private String faydaId;

    private String kebele;

    private String woreda;

    private String city;

    private String occupation;

    private String employer;

    @Column(nullable = false)
    private String status = "Active";

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "share_balance")
    private java.math.BigDecimal shareBalance = java.math.BigDecimal.ZERO;

    @Column(name = "savings_balance")
    private java.math.BigDecimal savingsBalance = java.math.BigDecimal.ZERO;

    @Column(name = "loan_outstanding")
    private java.math.BigDecimal loanOutstanding = java.math.BigDecimal.ZERO;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<NextOfKin> nextOfKin = new ArrayList<>();

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Beneficiary> beneficiaries = new ArrayList<>();
}