package com.ifti.erp.repository;

import com.ifti.erp.entity.RememberedSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RememberedSessionRepository extends JpaRepository<RememberedSession, Long> {
    @Query("select s from RememberedSession s join fetch s.user u join fetch u.role where s.tokenHash = :hash and s.expiresAt > :now and u.isActive = true")
    Optional<RememberedSession> findValid(@Param("hash") String hash, @Param("now") LocalDateTime now);

    void deleteByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from RememberedSession s where s.user.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from RememberedSession s where s.expiresAt <= :now")
    int deleteExpired(@Param("now") LocalDateTime now);
}
