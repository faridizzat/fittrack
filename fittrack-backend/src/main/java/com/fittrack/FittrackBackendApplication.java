package com.fittrack;

import com.fittrack.config.DotenvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FittrackBackendApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(FittrackBackendApplication.class);
        app.addInitializers(new DotenvInitializer());
        app.run(args);
    }

}