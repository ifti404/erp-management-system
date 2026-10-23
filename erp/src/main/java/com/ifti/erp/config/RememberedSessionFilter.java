package com.ifti.erp.config;

import com.ifti.erp.service.RememberedSessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class RememberedSessionFilter extends OncePerRequestFilter {
    private final RememberedSessionService sessions;

    public RememberedSessionFilter(RememberedSessionService sessions) { this.sessions = sessions; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (!RememberedSessionService.COOKIE_NAME.equals(cookie.getName())) continue;
                sessions.authenticate(cookie.getValue()).ifPresent(user -> {
                    String role = "ROLE_" + user.getRole().getName().trim().toUpperCase(java.util.Locale.ROOT);
                    var auth = new UsernamePasswordAuthenticationToken(user.getUsername(), null,
                            java.util.List.of(new SimpleGrantedAuthority(role)));
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
                break;
            }
        }
        chain.doFilter(request, response);
    }
}
