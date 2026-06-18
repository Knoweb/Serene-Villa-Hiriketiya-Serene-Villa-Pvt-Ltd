package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "guest_registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuestRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String guestName;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String guestPhotoPath;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate checkInDate;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate checkOutDate;

    private Integer numberOfNights;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String passportFrontPath;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String passportBackPath;

    @Column(nullable = false)
    private String passportNumber;

    @Column(nullable = false)
    private String whatsappNumber;

    @Column(nullable = false)
    private String nationality;

    private Integer adults = 1;
    private Integer children = 0;

    private String paymentStatus = "Pending"; // Paid, Unpaid, Pending
    private String registrationStatus = "Pending"; // Pending, CheckedIn, CheckedOut, Cancelled

    private Boolean isHiddenFromFrontOffice = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;

    @Column(name = "property_id")
    private Long propertyId = 1L;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (numberOfNights == 0 && checkInDate != null && checkOutDate != null) {
            numberOfNights = (int) checkInDate.datesUntil(checkOutDate).count();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (numberOfNights == 0 && checkInDate != null && checkOutDate != null) {
            numberOfNights = (int) checkInDate.datesUntil(checkOutDate).count();
        }
    }

    // --- Backward Compatibility Methods ---
    
    public String getPhotoUrl() {
        return guestPhotoPath;
    }

    public void setPhotoUrl(String photoUrl) {
        this.guestPhotoPath = photoUrl;
    }

    public String getPassportFrontUrl() {
        return passportFrontPath;
    }

    public void setPassportFrontUrl(String passportFrontUrl) {
        this.passportFrontPath = passportFrontUrl;
    }

    public String getPassportBackUrl() {
        return passportBackPath;
    }

    public void setPassportBackUrl(String passportBackUrl) {
        this.passportBackPath = passportBackUrl;
    }

    public String getWhatsAppNumber() {
        return whatsappNumber;
    }

    public void setWhatsAppNumber(String whatsAppNumber) {
        this.whatsappNumber = whatsAppNumber;
    }

    public Integer getNights() {
        return numberOfNights;
    }

    public void setNights(Integer nights) {
        this.numberOfNights = nights;
    }

    public Boolean getIsHiddenFromFrontOffice() {
        return isHiddenFromFrontOffice;
    }

    public void setIsHiddenFromFrontOffice(Boolean isHiddenFromFrontOffice) {
        this.isHiddenFromFrontOffice = isHiddenFromFrontOffice;
    }

    public boolean isHiddenFromFrontOffice() {
        return isHiddenFromFrontOffice != null && isHiddenFromFrontOffice;
    }

    public void setHiddenFromFrontOffice(boolean hiddenFromFrontOffice) {
        this.isHiddenFromFrontOffice = hiddenFromFrontOffice;
    }
}
