package com.ifti.erp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "movement_type", nullable = false, length = 30)
    private String movementType;

    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(length = 255)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "actor_username", length = 50)
    private String actorUsername;

    protected InventoryMovement() {}

    public InventoryMovement(Product product, String movementType, int quantityChange,
                             int quantityAfter, String referenceType, Long referenceId,
                             String notes, LocalDateTime createdAt, String actorUsername) {
        this.product = product;
        this.movementType = movementType;
        this.quantityChange = quantityChange;
        this.quantityAfter = quantityAfter;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.notes = notes;
        this.createdAt = createdAt;
        this.actorUsername = actorUsername;
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public String getMovementType() { return movementType; }
    public Integer getQuantityChange() { return quantityChange; }
    public Integer getQuantityAfter() { return quantityAfter; }
    public String getReferenceType() { return referenceType; }
    public Long getReferenceId() { return referenceId; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getActorUsername() { return actorUsername; }
}
