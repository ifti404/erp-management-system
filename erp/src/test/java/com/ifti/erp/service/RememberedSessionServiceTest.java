package com.ifti.erp.service;

import com.ifti.erp.entity.RememberedSession;
import com.ifti.erp.entity.User;
import com.ifti.erp.repository.RememberedSessionRepository;
import com.ifti.erp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RememberedSessionServiceTest {
    @Mock private RememberedSessionRepository sessions;
    @Mock private UserRepository users;

    @Test
    void createsRandomCookieTokenAndStoresOnlyItsHash() {
        User user = new User();
        user.setUsername("admin");
        user.setActive(true);
        when(users.findByUsername("admin")).thenReturn(Optional.of(user));
        RememberedSessionService service = new RememberedSessionService(sessions, users);

        String token = service.create("admin", true);

        assertNotNull(token);
        assertTrue(token.length() >= 40);
        ArgumentCaptor<RememberedSession> captor = ArgumentCaptor.forClass(RememberedSession.class);
        verify(sessions).save(captor.capture());
        assertNotEquals(token, captor.getValue().getTokenHash());
        assertEquals(64, captor.getValue().getTokenHash().length());
        long hoursLeft = java.time.Duration.between(java.time.LocalDateTime.now(), captor.getValue().getExpiresAt()).toHours();
        assertTrue(hoursLeft >= 719 && hoursLeft <= 720);
        verify(sessions).deleteExpired(any());
    }

    @Test
    void refusesToRememberDisabledUsers() {
        User user = new User();
        user.setUsername("disabled");
        user.setActive(false);
        when(users.findByUsername("disabled")).thenReturn(Optional.of(user));
        RememberedSessionService service = new RememberedSessionService(sessions, users);

        assertThrows(IllegalStateException.class, () -> service.create("disabled", false));
        verify(sessions, never()).save(any(RememberedSession.class));
    }

    @Test
    void normalSignInGetsShortLivedServerSession() {
        User user = new User();
        user.setUsername("staff");
        user.setActive(true);
        when(users.findByUsername("staff")).thenReturn(Optional.of(user));
        RememberedSessionService service = new RememberedSessionService(sessions, users);

        service.create("staff", false);

        ArgumentCaptor<RememberedSession> captor = ArgumentCaptor.forClass(RememberedSession.class);
        verify(sessions).save(captor.capture());
        long hoursLeft = java.time.Duration.between(java.time.LocalDateTime.now(), captor.getValue().getExpiresAt()).toHours();
        assertTrue(hoursLeft >= 11 && hoursLeft <= 12);
    }
}
