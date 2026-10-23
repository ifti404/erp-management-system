package com.ifti.erp.repository;

import com.ifti.erp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    java.util.Optional<User> findByUsername(String username);
    java.util.Optional<User> findByUsernameIgnoreCase(String username);
    java.util.Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);

    @Query("select count(u) from User u where lower(u.role.name) = lower(:roleName) and u.isActive = true")
    long countActiveByRoleNameIgnoreCase(@Param("roleName") String roleName);
}
