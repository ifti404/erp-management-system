package com.ifti.erp.service;

import com.ifti.erp.entity.Role;
import com.ifti.erp.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final AuditService auditService;

    public RoleService(RoleRepository roleRepository, AuditService auditService) {
        this.roleRepository = roleRepository;
        this.auditService = auditService;
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Optional<Role> getRoleById(Long id) {
        return roleRepository.findById(id);
    }

    public Role createRole(Role role) {
        if (roleRepository.findFirstByNameIgnoreCase(role.getName()).isPresent()) {
            throw new IllegalArgumentException("A role with this name already exists");
        }
        validatePermissions(role);
        Role saved = roleRepository.save(role);
        auditService.record("CREATED", "ROLE", saved.getId(), "name=" + saved.getName());
        return saved;
    }

    public Role updateRole(Long id, Role roleDetails) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if ("ADMIN".equalsIgnoreCase(role.getName())) {
            throw new IllegalArgumentException("The ADMIN role name is protected");
        }
        if (roleRepository.findFirstByNameIgnoreCase(roleDetails.getName())
                .filter(existing -> !existing.getId().equals(id)).isPresent()) {
            throw new IllegalArgumentException("A role with this name already exists");
        }

        role.setName(roleDetails.getName());
        validatePermissions(roleDetails);
        role.setPermissions(roleDetails.getPermissions());

        Role saved = roleRepository.save(role);
        auditService.record("UPDATED", "ROLE", id, "name=" + saved.getName());
        return saved;
    }

    private void validatePermissions(Role role) {
        if (role.getPermissions() == null) return;
        var unknown = new java.util.HashSet<>(role.getPermissions());
        unknown.removeAll(com.ifti.erp.security.PermissionCatalog.ALL);
        if (!unknown.isEmpty()) throw new IllegalArgumentException("Unknown role permissions: " + String.join(", ", unknown));
    }

    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        if ("ADMIN".equalsIgnoreCase(role.getName())) {
            throw new IllegalArgumentException("The ADMIN role cannot be deleted");
        }
        auditService.record("DELETED", "ROLE", id, "name=" + role.getName());
        roleRepository.deleteById(id);
    }
}
