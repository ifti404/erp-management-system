package com.ifti.erp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_events", indexes = {
        @Index(name = "idx_audit_events_created_at", columnList = "created_at"),
        @Index(name = "idx_audit_events_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_audit_events_actor", columnList = "actor_username")
})
public class AuditEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "actor_username", nullable = false, length = 50)
    private String actorUsername;

    @Column(nullable = false, length = 30)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String details;

    protected AuditEvent() {}

    public AuditEvent(LocalDateTime createdAt, String actorUsername, String action,
                      String entityType, Long entityId, String details) {
        this.createdAt = createdAt;
        this.actorUsername = actorUsername;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
    }

    public Long getId() { return id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getActorUsername() { return actorUsername; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getDetails() { return details; }
}
