package com.ifti.erp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "expense_categories", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
public class ExpenseCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank @Size(max = 100) @Column(nullable = false, length = 100) private String name;
    @Size(max = 255) @Column(length = 255) private String description;
    @Column(nullable = false) private boolean active = true;
    public ExpenseCategory() {}
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
