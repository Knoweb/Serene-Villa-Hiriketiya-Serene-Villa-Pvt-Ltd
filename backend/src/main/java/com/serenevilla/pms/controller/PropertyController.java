package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.Property;
import com.serenevilla.pms.repository.PropertyRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "*")
public class PropertyController {

    @Autowired
    private PropertyRepository propertyRepository;

    @PostConstruct
    public void seedInitialProperties() {
        if (propertyRepository.count() == 0) {
            Property p1 = new Property();
            p1.setName("Serene Villa Pvt Ltd");
            p1.setCode("SV_PL");
            p1.setAddress("Pehembiya Road, Hiriketiya, Dickwella");
            p1.setPhone("+94 41 225 5204");
            p1.setEmail("serenehiriketiya@gmail.com");
            p1.setTotalRooms(6);
            p1.setStatus("ACTIVE");
            propertyRepository.save(p1);

            Property p2 = new Property();
            p2.setName("Serene Villa Hiriketiya");
            p2.setCode("SV_HK");
            p2.setAddress("Hiriketiya Beach Road, Dickwella");
            p2.setPhone("+94 70 499 8787");
            p2.setEmail("info@serenevillahiriketiya.com");
            p2.setTotalRooms(11);
            p2.setStatus("ACTIVE");
            propertyRepository.save(p2);
        }
    }

    @GetMapping
    public ResponseEntity<List<Property>> getAllProperties() {
        return ResponseEntity.ok(propertyRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Property> getPropertyById(@PathVariable Long id) {
        return propertyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
