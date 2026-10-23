package com.ifti.erp.service;

import com.ifti.erp.entity.User;
import com.ifti.erp.repository.UserRepository;
import com.ifti.erp.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final RememberedSessionService rememberedSessions;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       RoleRepository roleRepository, RememberedSessionService rememberedSessions, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.rememberedSessions = rememberedSessions;
        this.auditService = auditService;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User createUser(User user) {
        user.setPasswordHash(encodeIfNeeded(user.getPasswordHash()));
        if (user.getCreatedAt() == null) user.setCreatedAt(java.time.LocalDateTime.now());
        User saved = userRepository.save(user);
        auditService.record("CREATED", "USER", saved.getId(), "username=" + saved.getUsername() + ", active=" + saved.getActive());
        return saved;
    }

    @Transactional
    public User updateUser(Long id, User userDetails, String actorUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean remainsAdmin = Boolean.TRUE.equals(userDetails.getActive())
                && "ADMIN".equalsIgnoreCase(userDetails.getRole().getName());
        boolean isCurrentAdmin = Boolean.TRUE.equals(user.getActive())
                && "ADMIN".equalsIgnoreCase(user.getRole().getName());
        if (isCurrentAdmin && !remainsAdmin
                && userRepository.countActiveByRoleNameIgnoreCase("ADMIN") <= 1) {
            throw new IllegalArgumentException("At least one active administrator account must remain");
        }
        if (user.getUsername().equals(actorUsername) && !remainsAdmin) {
            throw new IllegalArgumentException("You cannot remove administrator access from your own account");
        }

        boolean credentialsChanged = (userDetails.getPasswordHash() != null && !userDetails.getPasswordHash().isBlank())
                || !user.getUsername().equals(userDetails.getUsername())
                || !java.util.Objects.equals(user.getActive(), userDetails.getActive())
                || !java.util.Objects.equals(user.getRole().getId(), userDetails.getRole().getId());
        if (credentialsChanged) rememberedSessions.revokeAll(user.getUsername());

        user.setUsername(userDetails.getUsername());
        if (userDetails.getPasswordHash() != null && !userDetails.getPasswordHash().isBlank()) {
            user.setPasswordHash(encodeIfNeeded(userDetails.getPasswordHash()));
        }
        user.setFullName(userDetails.getFullName());
        user.setEmail(userDetails.getEmail());
        user.setPhone(userDetails.getPhone());
        user.setActive(userDetails.getActive());
        user.setRole(userDetails.getRole());

        User saved = userRepository.save(user);
        auditService.record("UPDATED", "USER", id, "username=" + saved.getUsername() + ", active=" + saved.getActive() + ", role=" + saved.getRole().getName());
        return saved;
    }

    @Transactional
    public void deleteUser(Long id, String actorUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getUsername().equals(actorUsername)) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }
        protectLastActiveAdmin(user, false);
        auditService.record("DELETED", "USER", id, "username=" + user.getUsername());
        userRepository.delete(user);
    }

    @Transactional
    public User setActive(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        protectLastActiveAdmin(user, active);
        user.setActive(active);
        if (!active) rememberedSessions.revokeAll(user.getUsername());
        User saved = userRepository.save(user);
        auditService.record(active ? "ACTIVATED" : "DEACTIVATED", "USER", id, "username=" + user.getUsername());
        return saved;
    }

    @Transactional
    public User setRole(Long id, Long roleId, String actorUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        if (Boolean.TRUE.equals(user.getActive()) && "ADMIN".equalsIgnoreCase(user.getRole().getName())
                && !"ADMIN".equalsIgnoreCase(role.getName())
                && userRepository.countActiveByRoleNameIgnoreCase("ADMIN") <= 1) {
            throw new IllegalArgumentException("At least one active administrator account must remain");
        }
        if (user.getUsername().equals(actorUsername)
                && !"ADMIN".equalsIgnoreCase(role.getName())) {
            throw new IllegalArgumentException("You cannot remove administrator access from your own account");
        }
        user.setRole(role);
        rememberedSessions.revokeAll(user.getUsername());
        User saved = userRepository.save(user);
        auditService.record("ROLE_CHANGED", "USER", id, "username=" + user.getUsername() + ", role=" + role.getName());
        return saved;
    }

    @Transactional
    public void resetPassword(Long id, String password) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(password));
        rememberedSessions.revokeAll(user.getUsername());
        userRepository.save(user);
        auditService.record("PASSWORD_RESET", "USER", id, "Password reset by an administrator");
    }

    private void protectLastActiveAdmin(User user, boolean remainsActive) {
        if (!remainsActive && Boolean.TRUE.equals(user.getActive())
                && "ADMIN".equalsIgnoreCase(user.getRole().getName())
                && userRepository.countActiveByRoleNameIgnoreCase("ADMIN") <= 1) {
            throw new IllegalArgumentException("At least one active administrator account must remain");
        }
    }

    private String encodeIfNeeded(String password) {
        if (password.startsWith("{bcrypt}") || password.startsWith("{pbkdf2")
                || password.startsWith("{scrypt}") || password.startsWith("{argon2}")) {
            return password;
        }
        if (password.startsWith("$2")) return "{bcrypt}" + password;
        return passwordEncoder.encode(password);
    }
}
