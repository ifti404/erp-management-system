package com.ifti.erp.controller;

import com.ifti.erp.entity.AuditEvent;
import com.ifti.erp.service.AuditService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditController {
    private final AuditService service;
    public AuditController(AuditService service) { this.service = service; }

    @GetMapping
    public List<AuditEvent> recent(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actor,
            @RequestParam(defaultValue = "200") int limit) {
        return service.recent(from, to, type, action, actor, limit);
    }
}
