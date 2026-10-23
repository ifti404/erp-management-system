package com.ifti.erp.service;

import com.ifti.erp.dto.PublicRegistrationRequest;
import com.ifti.erp.entity.Role;
import com.ifti.erp.entity.User;
import com.ifti.erp.repository.RoleRepository;
import com.ifti.erp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {
    @Mock private UserRepository users;
    @Mock private RoleRepository roles;
    @Mock private PasswordEncoder passwords;
    @Mock private AuditService audit;

    @Test
    void registrationCreatesInactiveStaffAccountAndStoresOnlyPasswordHash() {
        Role staff = new Role();
        staff.setName("STAFF");
        when(users.existsByUsernameIgnoreCase("mira")).thenReturn(false);
        when(users.existsByEmailIgnoreCase("mira")).thenReturn(false);
        when(users.existsByEmailIgnoreCase("mira@example.com")).thenReturn(false);
        when(users.existsByUsernameIgnoreCase("mira@example.com")).thenReturn(false);
        when(roles.findFirstByNameIgnoreCase("STAFF")).thenReturn(Optional.of(staff));
        when(passwords.encode("long-private-password")).thenReturn("{bcrypt}hashed");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegistrationService service = new RegistrationService(users, roles, passwords, audit);
        var result = service.register(new PublicRegistrationRequest("mira", "+880123456", "Mira@Example.com", "long-private-password"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(users).save(captor.capture());
        User registered = captor.getValue();
        assertEquals("mira", registered.getUsername());
        assertEquals("mira@example.com", registered.getEmail());
        assertEquals("+880123456", registered.getPhone());
        assertFalse(registered.getActive());
        assertSame(staff, registered.getRole());
        assertEquals("{bcrypt}hashed", registered.getPasswordHash());
        assertEquals("PENDING_APPROVAL", result.status());
        verify(audit).recordAs("mira", "SIGNUP_REQUESTED", "USER", null,
                "Public registration awaiting administrator activation");
    }

    @Test
    void duplicateUsernameOrEmailIsRejectedBeforeCreatingAccount() {
        when(users.existsByUsernameIgnoreCase("mira")).thenReturn(true);

        RegistrationService service = new RegistrationService(users, roles, passwords, audit);
        assertThrows(IllegalArgumentException.class, () -> service.register(
                new PublicRegistrationRequest("mira", "123", "mira@example.com", "long-private-password")));

        verify(users, never()).save(any(User.class));
    }
}
