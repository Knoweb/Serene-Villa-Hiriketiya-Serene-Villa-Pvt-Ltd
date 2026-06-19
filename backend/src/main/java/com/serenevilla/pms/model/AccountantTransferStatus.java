package com.serenevilla.pms.model;

public enum AccountantTransferStatus {
    NONE,      // In Front Office possession (not sent yet)
    PENDING,   // Sent to Accountant for review
    ACCEPTED,  // Confirmed/Approved by Accountant
    REJECTED   // Rejected by Accountant (needs correction/review by FO)
}

