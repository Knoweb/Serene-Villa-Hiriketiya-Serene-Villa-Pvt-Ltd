package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String roomNumber;

    @Column(nullable = false)
    private String roomType;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String image;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "room_facilities", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "facility")
    private List<String> facilities;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "room_images", joinColumns = @JoinColumn(name = "room_id"))
    @Lob
    @Column(name = "image_data", columnDefinition = "LONGTEXT")
    private List<String> images;

    private String status = "Available"; // Available, Occupied, Maintenance

    @Column(name = "property_id")
    private Long propertyId = 1L;
}
