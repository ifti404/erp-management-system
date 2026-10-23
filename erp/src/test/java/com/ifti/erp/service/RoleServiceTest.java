package com.ifti.erp.service;

import com.ifti.erp.entity.Role;
import com.ifti.erp.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {
    @Mock private RoleRepository roleRepository;
    @Mock private Role adminRole;
    @Mock private AuditService auditService;

    @Test
    void protectedAdminRoleCannotBeDeleted() {
        RoleService service = new RoleService(roleRepository, auditService);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(adminRole));
        when(adminRole.getName()).thenReturn("ADMIN");

        assertThrows(IllegalArgumentException.class, () -> service.deleteRole(1L));

        verify(roleRepository, never()).deleteById(1L);
    }
}
