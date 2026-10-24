package com.ifti.erp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class SecurityConfig {
    @Bean
    CookieCsrfTokenRepository csrfTokenRepository(@Value("${app.auth.cookie-secure:false}") boolean secureCookie) {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookiePath("/");
        repository.setCookieCustomizer(cookie -> cookie.path("/").sameSite("Strict").secure(secureCookie));
        return repository;
    }

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, com.ifti.erp.service.RememberedSessionService sessions,
            CookieCsrfTokenRepository csrfTokens) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.csrfTokenRepository(csrfTokens)
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/signup").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/csrf", "/api/health").permitAll()
                        .requestMatchers("/api/auth/**").authenticated()
                        .requestMatchers("/api/users/**", "/api/roles/**", "/api/audit-logs/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/products/**").hasAnyAuthority("PRODUCTS_VIEW", "SALES_VIEW", "PURCHASES_VIEW", "INVENTORY_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/products/**").hasAuthority("PRODUCTS_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAuthority("PRODUCTS_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAuthority("PRODUCTS_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/inventory/**", "/api/inventory-movements/**").hasAnyAuthority("INVENTORY_VIEW", "SALES_VIEW", "PURCHASES_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/inventory/**").hasAuthority("INVENTORY_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasAuthority("INVENTORY_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/inventory/**").hasAuthority("INVENTORY_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").hasAnyAuthority("CATEGORIES_VIEW", "PRODUCTS_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/categories/**").hasAuthority("CATEGORIES_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasAuthority("CATEGORIES_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasAuthority("CATEGORIES_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/customers/**").hasAnyAuthority("CUSTOMERS_VIEW", "SALES_VIEW", "STATEMENTS_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/customers/**").hasAuthority("CUSTOMERS_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/customers/**").hasAuthority("CUSTOMERS_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/customers/**").hasAuthority("CUSTOMERS_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/suppliers/**").hasAnyAuthority("SUPPLIERS_VIEW", "PURCHASES_VIEW", "STATEMENTS_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/suppliers/**").hasAuthority("SUPPLIERS_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/suppliers/**").hasAuthority("SUPPLIERS_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/suppliers/**").hasAuthority("SUPPLIERS_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/sales-orders/**", "/api/sales-items/**").hasAnyAuthority("SALES_VIEW", "RETURNS_VIEW", "PAYMENTS_VIEW", "STATEMENTS_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/sales-orders/**", "/api/sales-items/**").hasAuthority("SALES_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/sales-orders/**", "/api/sales-items/**").hasAuthority("SALES_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/sales-orders/**", "/api/sales-items/**").hasAuthority("SALES_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/sales-returns/**").hasAnyAuthority("RETURNS_VIEW", "PAYMENTS_VIEW", "STATEMENTS_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/sales-returns/**").hasAuthority("RETURNS_MANAGE")
                        .requestMatchers(HttpMethod.PATCH, "/api/sales-returns/**").hasAuthority("RETURNS_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/purchase-orders/**", "/api/purchase-items/**").hasAnyAuthority("PURCHASES_VIEW", "PAYMENTS_VIEW", "STATEMENTS_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/purchase-orders/*/receipts", "/api/purchase-orders/**", "/api/purchase-items/**").hasAuthority("PURCHASES_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/purchase-orders/**", "/api/purchase-items/**").hasAuthority("PURCHASES_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/purchase-orders/**", "/api/purchase-items/**").hasAuthority("PURCHASES_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/payments/**").hasAnyAuthority("PAYMENTS_VIEW", "STATEMENTS_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/payments/**").hasAuthority("PAYMENTS_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/payments/**").hasAuthority("PAYMENTS_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/payments/**").hasAuthority("PAYMENTS_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/expenses/**", "/api/expense-categories/**").hasAnyAuthority("EXPENSES_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/expenses/**", "/api/expense-categories/**").hasAuthority("EXPENSES_MANAGE")
                        .requestMatchers(HttpMethod.PUT, "/api/expenses/**", "/api/expense-categories/**").hasAuthority("EXPENSES_MANAGE")
                        .requestMatchers(HttpMethod.DELETE, "/api/expenses/**", "/api/expense-categories/**").hasAuthority("EXPENSES_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/settings/company/**").hasAnyAuthority("SETTINGS_VIEW", "SALES_VIEW", "PURCHASES_VIEW", "PAYMENTS_VIEW", "STATEMENTS_VIEW", "REPORTS_VIEW")
                        .requestMatchers(HttpMethod.PUT, "/api/settings/company/**").hasAuthority("SETTINGS_MANAGE")
                        .requestMatchers("/api/**").denyAll()
                        .anyRequest().denyAll())
                .httpBasic(Customizer.withDefaults())
                .addFilterBefore(new RememberedSessionFilter(sessions), BasicAuthenticationFilter.class)
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
