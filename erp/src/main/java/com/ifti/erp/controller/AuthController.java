package com.ifti.erp.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import com.ifti.erp.dto.PublicRegistrationRequest;
import com.ifti.erp.dto.PublicRegistrationResponse;
import com.ifti.erp.service.RegistrationService;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;
import org.springframework.security.web.csrf.CsrfToken;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final com.ifti.erp.service.RememberedSessionService sessions;
    private final com.ifti.erp.service.AuditService audit;
    private final RegistrationService registration;
    private final com.ifti.erp.repository.UserRepository users;
    private final PasswordEncoder passwordEncoder;
    @org.springframework.beans.factory.annotation.Value("${app.auth.cookie-secure:false}")
    private boolean secureCookie;

    public AuthController(com.ifti.erp.service.RememberedSessionService sessions,
                          com.ifti.erp.service.AuditService audit,
                          RegistrationService registration,
                          com.ifti.erp.repository.UserRepository users,
                          PasswordEncoder passwordEncoder) {
        this.sessions = sessions;
        this.audit = audit;
        this.registration = registration;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }
    public record CurrentUser(String username, String fullName, String email, String phone, String photoData, List<String> roles, String themePreference, List<String> permissions) {}
    public record ThemeRequest(String themePreference) {}
    public record ProfilePhotoRequest(String photoData) {}
    public record ProfileUpdateRequest(String fullName, String email, String phone, String currentPassword, String newPassword, String confirmPassword) {}

    @GetMapping("/csrf")
    public java.util.Map<String, String> csrf(CsrfToken token) {
        return java.util.Map.of("token", token.getToken());
    }

    private void setCookie(HttpServletResponse response, String value, Integer maxAge) {
        String cookie = com.ifti.erp.service.RememberedSessionService.COOKIE_NAME + "=" + value + "; Path=/api; HttpOnly; SameSite=Strict";
        if (maxAge != null) cookie += "; Max-Age=" + maxAge;
        if (secureCookie) cookie += "; Secure";
        response.addHeader("Set-Cookie", cookie);
    }

    public record SessionRequest(boolean rememberDevice) {}

    @PostMapping("/signup")
    public PublicRegistrationResponse signup(@Valid @RequestBody PublicRegistrationRequest request) {
        return registration.register(request);
    }

    @PostMapping("/session")
    public java.util.Map<String, Object> createSession(Authentication authentication,
            @org.springframework.web.bind.annotation.RequestBody(required = false) SessionRequest request,
            HttpServletResponse response) {
        boolean remember = request != null && request.rememberDevice();
        String token = sessions.create(authentication.getName(), remember);
        audit.record("SIGNED_IN", "SESSION", null, "remembered=" + remember);
        Integer maxAge = remember ? com.ifti.erp.service.RememberedSessionService.LIFETIME_DAYS * 24 * 60 * 60 : null;
        setCookie(response, token, maxAge);
        return java.util.Map.of("signedIn", true, "remembered", remember,
                "expiresInDays", remember ? com.ifti.erp.service.RememberedSessionService.LIFETIME_DAYS : 0);
    }

    @PostMapping("/logout")
    public java.util.Map<String, Boolean> logout(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        String token = cookieValue(request);
        sessions.revoke(token);
        audit.record("SIGNED_OUT", "SESSION", null, "user=" + authentication.getName());
        setCookie(response, "", 0);
        return java.util.Map.of("loggedOut", true);
    }

    @PostMapping("/revoke-all")
    @Transactional
    public java.util.Map<String, Integer> revokeAll(Authentication authentication, HttpServletResponse response) {
        int revoked = sessions.revokeAll(authentication.getName());
        audit.record("SESSIONS_REVOKED", "SESSION", null, "count=" + revoked);
        setCookie(response, "", 0);
        return java.util.Map.of("revoked", revoked);
    }

    private String cookieValue(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) if (com.ifti.erp.service.RememberedSessionService.COOKIE_NAME.equals(cookie.getName())) return cookie.getValue();
        return null;
    }

    @GetMapping("/me")
    public CurrentUser me(Authentication authentication) {
        var user = users.findByUsername(authentication.getName()).orElseThrow();
        return new CurrentUser(authentication.getName(), user.getFullName(), user.getEmail(), user.getPhone(), user.getPhotoData(), List.of("ROLE_" + user.getRole().getName().toUpperCase(java.util.Locale.ROOT)),
                user.getThemePreference(), effectivePermissions(user));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/profile/photo")
    @Transactional
    public CurrentUser setProfilePhoto(Authentication authentication, @RequestBody ProfilePhotoRequest request) {
        var user = users.findByUsername(authentication.getName()).orElseThrow();
        user.setPhotoData(com.ifti.erp.security.ImageDataValidator.validate(request == null ? null : request.photoData()));
        users.save(user);
        return new CurrentUser(user.getUsername(), user.getFullName(), user.getEmail(), user.getPhone(), user.getPhotoData(), List.of("ROLE_" + user.getRole().getName().toUpperCase(java.util.Locale.ROOT)),
                user.getThemePreference(), effectivePermissions(user));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/profile")
    @Transactional
    public CurrentUser updateProfile(Authentication authentication, @RequestBody ProfileUpdateRequest request, HttpServletResponse response) {
        var user = users.findByUsername(authentication.getName()).orElseThrow();
        if (request == null || request.fullName() == null || request.fullName().isBlank() || request.fullName().trim().length() > 100)
            throw new IllegalArgumentException("Display name is required and must be 100 characters or fewer");
        String email = request.email() == null || request.email().isBlank() ? null : request.email().trim();
        if (email != null && (email.length() > 100 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")))
            throw new IllegalArgumentException("Enter a valid email address");
        if (email != null && users.findByEmailIgnoreCase(email).filter(existing -> !existing.getId().equals(user.getId())).isPresent())
            throw new IllegalArgumentException("That email address is already in use");
        String phone = request.phone() == null || request.phone().isBlank() ? null : request.phone().trim();
        if (phone != null && phone.length() > 20) throw new IllegalArgumentException("Phone number must be 20 characters or fewer");
        boolean changingPassword = request.newPassword() != null && !request.newPassword().isBlank();
        if (changingPassword) {
            if (request.currentPassword() == null || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash()))
                throw new IllegalArgumentException("Current password is incorrect");
            if (request.newPassword().length() < 10 || request.newPassword().length() > 72)
                throw new IllegalArgumentException("New password must be between 10 and 72 characters");
            if (!request.newPassword().equals(request.confirmPassword()))
                throw new IllegalArgumentException("New password entries do not match");
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        } else if (request.confirmPassword() != null && !request.confirmPassword().isBlank()) {
            throw new IllegalArgumentException("Enter a new password before confirming it");
        }
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(phone);
        users.save(user);
        if (changingPassword) {
            sessions.revokeAll(user.getUsername());
            boolean remembered = false;
            String token = sessions.create(user.getUsername(), remembered);
            setCookie(response, token, null);
        }
        return new CurrentUser(user.getUsername(), user.getFullName(), user.getEmail(), user.getPhone(), user.getPhotoData(), List.of("ROLE_" + user.getRole().getName().toUpperCase(java.util.Locale.ROOT)), user.getThemePreference(), effectivePermissions(user));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/preferences/theme")
    @Transactional
    public CurrentUser setTheme(Authentication authentication, @RequestBody ThemeRequest request) {
        if (request == null || request.themePreference() == null ||
                !List.of("LIGHT", "DARK").contains(request.themePreference().toUpperCase())) {
            throw new IllegalArgumentException("Theme must be LIGHT or DARK");
        }
        var user = users.findByUsername(authentication.getName()).orElseThrow();
        user.setThemePreference(request.themePreference().toUpperCase());
        users.save(user);
        return new CurrentUser(user.getUsername(), user.getFullName(), user.getEmail(), user.getPhone(), user.getPhotoData(), List.of("ROLE_" + user.getRole().getName().toUpperCase(java.util.Locale.ROOT)),
                user.getThemePreference(), effectivePermissions(user));
    }

    private List<String> effectivePermissions(com.ifti.erp.entity.User user) {
        if ("ADMIN".equalsIgnoreCase(user.getRole().getName())) return com.ifti.erp.security.PermissionCatalog.ALL.stream().sorted().toList();
        return user.getRole().getPermissions().stream().sorted().toList();
    }
}
