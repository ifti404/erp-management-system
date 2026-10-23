package com.ifti.erp.service;

import com.ifti.erp.dto.PublicRegistrationRequest;
import com.ifti.erp.dto.PublicRegistrationResponse;
import com.ifti.erp.entity.Role;
import com.ifti.erp.entity.User;
import com.ifti.erp.repository.RoleRepository;
import com.ifti.erp.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class RegistrationService {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwords;
    private final AuditService audit;

    public RegistrationService(UserRepository users, RoleRepository roles,
                               PasswordEncoder passwords, AuditService audit) {
        this.users = users;
        this.roles = roles;
        this.passwords = passwords;
        this.audit = audit;
    }

    @Transactional
    public PublicRegistrationResponse register(PublicRegistrationRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String phone = request.phone().trim();

        if (users.existsByUsernameIgnoreCase(username) || users.existsByEmailIgnoreCase(username)
                || users.existsByEmailIgnoreCase(email) || users.existsByUsernameIgnoreCase(email)) {
            throw new IllegalArgumentException("That username or email is already registered");
        }

        Role staffRole = roles.findFirstByNameIgnoreCase("STAFF").orElseGet(() -> {
            Role role = new Role();
            role.setName("STAFF");
            return roles.save(role);
        });

        User user = new User();
        user.setUsername(username);
        user.setFullName(username);
        user.setPhone(phone);
        user.setEmail(email);
        user.setPasswordHash(passwords.encode(request.password()));
        user.setActive(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setRole(staffRole);
        User saved = users.save(user);
        audit.recordAs(username, "SIGNUP_REQUESTED", "USER", saved.getId(), "Public registration awaiting administrator activation");

        return new PublicRegistrationResponse(username, "PENDING_APPROVAL",
                "Your request was sent. An administrator must activate your account before you can sign in.");
    }
}
