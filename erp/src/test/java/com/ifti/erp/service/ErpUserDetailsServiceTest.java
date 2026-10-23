package com.ifti.erp.service;

import com.ifti.erp.entity.Role;
import com.ifti.erp.entity.User;
import com.ifti.erp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ErpUserDetailsServiceTest {
    @Mock private UserRepository users;

    @Test
    void emailLoginReturnsCanonicalUsername() {
        Role staff = new Role();
        staff.setName("STAFF");
        User user = new User();
        user.setUsername("mira");
        user.setEmail("mira@example.com");
        user.setPasswordHash("{noop}secret");
        user.setActive(true);
        user.setRole(staff);
        when(users.findByUsernameIgnoreCase("mira@example.com")).thenReturn(Optional.empty());
        when(users.findByEmailIgnoreCase("mira@example.com")).thenReturn(Optional.of(user));

        var details = new ErpUserDetailsService(users).loadUserByUsername("mira@example.com");

        assertEquals("mira", details.getUsername());
        assertTrue(details.isEnabled());
        assertTrue(details.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_STAFF")));
    }

    @Test
    void inactiveSelfRegisteredAccountCannotSignIn() {
        User user = new User();
        user.setUsername("mira");
        user.setActive(false);
        when(users.findByUsernameIgnoreCase("mira")).thenReturn(Optional.of(user));
        when(users.findByEmailIgnoreCase("mira")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> new ErpUserDetailsService(users).loadUserByUsername("mira"));
    }
}
