package com.ifti.erp.config;

import com.ifti.erp.entity.Role;
import com.ifti.erp.entity.User;
import com.ifti.erp.repository.RoleRepository;
import com.ifti.erp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class AdminBootstrap {
    @Bean
    ApplicationRunner bootstrapAdmin(UserRepository users, RoleRepository roles,
                                     PasswordEncoder encoder,
                                     @Value("${ERP_BOOTSTRAP_USERNAME:}") String username,
                                     @Value("${ERP_BOOTSTRAP_PASSWORD:}") String password) {
        return args -> {
            if (username.isBlank() || password.isBlank()) return;
            if (users.findByUsername(username).isPresent()) return;

            Role adminRole = roles.findFirstByNameIgnoreCase("ADMIN").orElseGet(() -> {
                Role role = new Role();
                role.setName("ADMIN");
                return roles.save(role);
            });
            User admin = new User();
            admin.setUsername(username);
            admin.setPasswordHash(encoder.encode(password));
            admin.setFullName("ERP Administrator");
            admin.setActive(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setRole(adminRole);
            users.save(admin);
        };
    }
}
