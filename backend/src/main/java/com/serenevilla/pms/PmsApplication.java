package com.serenevilla.pms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
public class PmsApplication {

	@PostConstruct
	public void init() {
		// Set default JVM timezone to Sri Lanka / Asia/Colombo (UTC+5:30)
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Colombo"));
	}

	public static void main(String[] args) {
		SpringApplication.run(PmsApplication.class, args);
	}

}
