package com.ifti.erp.service;

import com.ifti.erp.entity.AuditEvent;
import com.ifti.erp.repository.AuditEventRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {
    private final AuditEventRepository repository;
    public AuditService(AuditEventRepository repository) { this.repository = repository; }

    @Transactional
    public void record(String action, String entityType, Long entityId, String details) {
        Authentication current = SecurityContextHolder.getContext().getAuthentication();
        String actor = current == null || !current.isAuthenticated() ? "SYSTEM" : current.getName();
        recordAs(actor, action, entityType, entityId, details);
    }

    @Transactional
    public void recordAs(String actor, String action, String entityType, Long entityId, String details) {
        String safeActor = actor == null || actor.isBlank() ? "SYSTEM" : clean(actor, 50);
        repository.save(new AuditEvent(LocalDateTime.now(), safeActor, clean(action, 30),
                clean(entityType, 40), entityId, clean(details, 1800)));
    }

    @Transactional(readOnly = true)
    public List<AuditEvent> recent(LocalDate from, LocalDate to, String type, String action, String actor, int limit) {
        var page = PageRequest.of(0, Math.max(1, Math.min(limit, 500)));
        return repository.search(from == null ? null : from.atStartOfDay(),
                to == null ? null : to.plusDays(1).atStartOfDay(),
                type == null || type.isBlank() ? null : type.trim(),
                action == null || action.isBlank() ? null : action.trim(),
                actor == null || actor.isBlank() ? null : actor.trim(), page);
    }

    private static String clean(String value, int max) {
        if (value == null) return "";
        String safe = value.replaceAll("[\\r\\n\\t]", " ").trim();
        return safe.length() > max ? safe.substring(0, max) : safe;
    }
}
