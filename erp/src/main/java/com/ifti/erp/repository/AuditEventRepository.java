package com.ifti.erp.repository;

import com.ifti.erp.entity.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    List<AuditEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);
    @Query("select e from AuditEvent e where (:from is null or e.createdAt >= :from) and (:to is null or e.createdAt < :to) and (:type is null or lower(e.entityType) = lower(:type)) and (:action is null or lower(e.action) like lower(concat('%', :action, '%'))) and (:actor is null or lower(e.actorUsername) like lower(concat('%', :actor, '%'))) order by e.createdAt desc")
    List<AuditEvent> search(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                            @Param("type") String type, @Param("action") String action,
                            @Param("actor") String actor, Pageable pageable);
}
