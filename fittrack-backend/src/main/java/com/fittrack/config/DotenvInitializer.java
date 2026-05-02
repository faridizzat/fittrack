package com.fittrack.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

public class DotenvInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        Map<String, Object> properties = new HashMap<>();
        dotenv.entries().forEach(entry ->
            properties.put(entry.getKey(), entry.getValue())
        );

        if (!properties.isEmpty()) {
            applicationContext.getEnvironment()
                    .getPropertySources()
                    .addFirst(new MapPropertySource("dotenv", properties));
        }
    }
}
