package com.cbs.sacco.membership.entity;

import com.cbs.sacco.common.crypto.EncryptedStringConverter;
import jakarta.persistence.Convert;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "membership_application")
public class MembershipApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_no", nullable = false, unique = true)
    private String applicationNo;

    @Column(name = "applicant_type", nullable = false)
    private String applicantType = "Individual";

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "fayda_id", length = 255)
    private String faydaId;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(length = 255)
    private String phone;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(length = 255)
    private String email;

    private String employer;

    private String branch;

    @Column(name = "share_product_id")
    private Long shareProductId;

    @Column(name = "share_count")
    private Integer shareCount = 0;

    @Column(name = "compulsory_product_id")
    private Long compulsoryProductId;

    @Column(name = "entrance_fee")
    private BigDecimal entranceFee = BigDecimal.ZERO;

    @Column(name = "registration_fee")
    private BigDecimal registrationFee = BigDecimal.ZERO;

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus = "Unpaid";

    private String channel = "Staff";

    @Column(name = "app_status", nullable = false)
    private String status = "Pending";

    @Column(name = "submitted_at")
    private Instant submittedAt = Instant.now();

    @Column(name = "decided_by")
    private String decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "created_member_id")
    private Long createdMemberId;

    @Column(name = "created_share_account_id")
    private Long createdShareAccountId;
}
