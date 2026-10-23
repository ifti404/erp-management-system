package com.ifti.erp.service;

import com.ifti.erp.entity.Role;
import com.ifti.erp.entity.User;
import com.ifti.erp.repository.RoleRepository;
import com.ifti.erp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private RememberedSessionService rememberedSessions;
    @Mock private AuditService auditService;
    @Mock private User user;
    @Mock private Role role;

    @Test
    void cannotDeactivateTheLastActiveAdministrator() {
        UserService service = new UserService(userRepository, passwordEncoder, roleRepository, rememberedSessions, auditService);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(user.getActive()).thenReturn(true);
        when(user.getRole()).thenReturn(role);
        when(role.getName()).thenReturn("ADMIN");
        when(userRepository.countActiveByRoleNameIgnoreCase("ADMIN")).thenReturn(1L);

        assertThrows(IllegalArgumentException.class, () -> service.setActive(1L, false));

        verify(userRepository, never()).save(any(User.class));
    }
}
