package com.ifti.erp.service;

import com.ifti.erp.entity.User;
import com.ifti.erp.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class ErpUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public ErpUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        var usernameMatch = userRepository.findByUsernameIgnoreCase(username);
        var emailMatch = userRepository.findByEmailIgnoreCase(username);
        if (usernameMatch.isPresent() && emailMatch.isPresent()
                && !usernameMatch.get().getId().equals(emailMatch.get().getId())) {
            throw new UsernameNotFoundException("Invalid username or password");
        }
        User user = usernameMatch.or(() -> emailMatch)
                .filter(candidate -> Boolean.TRUE.equals(candidate.getActive()))
                .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password"));
        String storedHash = user.getPasswordHash();
        if (storedHash.startsWith("$2")) storedHash = "{bcrypt}" + storedHash;
        String role = "ROLE_" + user.getRole().getName().trim().toUpperCase(Locale.ROOT);
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(storedHash)
                .authorities(role)
                .disabled(!Boolean.TRUE.equals(user.getActive()))
                .build();
    }
}
