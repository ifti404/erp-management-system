<<<<<<< HEAD
package com.ifti.erp.repository;

import com.ifti.erp.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    java.util.Optional<Role> findFirstByNameIgnoreCase(String name);
}
=======
package com.ifti.erp.repository;

import com.ifti.erp.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
}
>>>>>>> edc71aefa89594cf9040eba79f454355b029bdec
