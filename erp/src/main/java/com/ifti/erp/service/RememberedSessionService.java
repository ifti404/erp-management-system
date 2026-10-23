package com.ifti.erp.service;

import com.ifti.erp.entity.RememberedSession;
import com.ifti.erp.entity.User;
import com.ifti.erp.repository.RememberedSessionRepository;
import com.ifti.erp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class RememberedSessionService {
    public static final int LIFETIME_DAYS = 30;
    public static final int SESSION_LIFETIME_HOURS = 12;
    public static final String COOKIE_NAME = "gamma_erp_remember";
    private final RememberedSessionRepository sessions;
    private final UserRepository users;
    private final SecureRandom random = new SecureRandom();

    public RememberedSessionService(RememberedSessionRepository sessions, UserRepository users) {
        this.sessions = sessions;
        this.users = users;
    }

    @Transactional
    public String create(String username, boolean rememberDevice) {
        User user = users.findByUsername(username)
                .filter(candidate -> Boolean.TRUE.equals(candidate.getActive()))
                .orElseThrow(() -> new IllegalStateException("Active user not found"));
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        LocalDateTime now = LocalDateTime.now();
        sessions.deleteExpired(now);
        LocalDateTime expiresAt = rememberDevice ? now.plusDays(LIFETIME_DAYS) : now.plusHours(SESSION_LIFETIME_HOURS);
        sessions.save(new RememberedSession(user, hash(token), now, expiresAt));
        return token;
    }

    @Transactional(readOnly = true)
    public Optional<User> authenticate(String token) {
        if (token == null || token.isBlank() || token.length() > 100) return Optional.empty();
        return sessions.findValid(hash(token), LocalDateTime.now()).map(RememberedSession::getUser);
    }

    @Transactional
    public void revoke(String token) {
        if (token != null && !token.isBlank() && token.length() <= 100) sessions.deleteByTokenHash(hash(token));
    }

    @Transactional
    public int revokeAll(String username) {
        return users.findByUsername(username).map(user -> sessions.deleteAllByUserId(user.getId())).orElse(0);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
