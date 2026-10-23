package com.ifti.erp.controller;

import com.ifti.erp.dto.CompanySettingsRequest;
import com.ifti.erp.entity.CompanySettings;
import com.ifti.erp.service.CompanySettingsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/company")
public class CompanySettingsController {
    private final CompanySettingsService service;
    public CompanySettingsController(CompanySettingsService service) { this.service = service; }
    @GetMapping public CompanySettings get() { return service.get(); }
    @PutMapping public CompanySettings update(@Valid @RequestBody CompanySettingsRequest request) { return service.update(request); }
}
