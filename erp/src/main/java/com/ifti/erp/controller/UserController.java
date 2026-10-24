package com.ifti.erp.controller;

import com.ifti.erp.entity.User;
import com.ifti.erp.dto.UserActiveRequest;
import com.ifti.erp.dto.UserRoleRequest;
import com.ifti.erp.dto.UserPasswordRequest;
import com.ifti.erp.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public User createUser(@Valid @RequestBody User user) {
        return userService.createUser(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
           @Valid @RequestBody User userDetails, Authentication authentication) {

        return userService.getUserById(id)
                .map(existing -> ResponseEntity.ok(userService.updateUser(id, userDetails, authentication.getName())))
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<User> setActive(@PathVariable Long id,
            @Valid @RequestBody UserActiveRequest request, Authentication authentication) {
        return userService.getUserById(id).map(user -> {
            if (!request.active() && user.getUsername().equals(authentication.getName())) {
                throw new IllegalArgumentException("You cannot deactivate your own account");
            }
            return ResponseEntity.ok(userService.setActive(id, request.active(), authentication.getName()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<User> setRole(@PathVariable Long id,
            @Valid @RequestBody UserRoleRequest request, Authentication authentication) {
        return userService.getUserById(id).map(user -> {
            return ResponseEntity.ok(userService.setRole(id, request.roleId(), authentication.getName()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id,
            @Valid @RequestBody UserPasswordRequest request, Authentication authentication) {
        if (userService.getUserById(id).isEmpty()) return ResponseEntity.notFound().build();
        userService.resetPassword(id, request.password(), authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication authentication) {
        userService.deleteUser(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
