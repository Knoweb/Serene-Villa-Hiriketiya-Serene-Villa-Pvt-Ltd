package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "properties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String code; // e.g. SV_PL, SV_HK

    private String address;

    private String phone;

    private String email;

    private int totalRooms = 6;

    private String status = "ACTIVE";
}
