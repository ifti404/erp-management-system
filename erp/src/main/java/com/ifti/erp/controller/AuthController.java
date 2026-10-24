package com.ifti.erp.controller;

import org.springframework.security.core.Authentication;
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
    @org.springframework.beans.factory.annotation.Value("${app.auth.cookie-secure:false}")
    private boolean secureCookie;

    public AuthController(com.ifti.erp.service.RememberedSessionService sessions,
                          com.ifti.erp.service.AuditService audit,
                          RegistrationService registration,
                          com.ifti.erp.repository.UserRepository users) {
        this.sessions = sessions;
        this.audit = audit;
        this.registration = registration;
        this.users = users;
    }
    public record CurrentUser(String username, List<String> roles, String themePreference, List<String> permissions) {}
    public record ThemeRequest(String themePreference) {}

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
        return new CurrentUser(authentication.getName(), List.of("ROLE_" + user.getRole().getName().toUpperCase(java.util.Locale.ROOT)),
                user.getThemePreference(), effectivePermissions(user));
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
        return new CurrentUser(user.getUsername(), List.of("ROLE_" + user.getRole().getName().toUpperCase(java.util.Locale.ROOT)),
                user.getThemePreference(), effectivePermissions(user));
    }

    private List<String> effectivePermissions(com.ifti.erp.entity.User user) {
        if ("ADMIN".equalsIgnoreCase(user.getRole().getName())) return com.ifti.erp.security.PermissionCatalog.ALL.stream().sorted().toList();
        return user.getRole().getPermissions().stream().sorted().toList();
    }
}
