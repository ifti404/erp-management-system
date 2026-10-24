package com.ifti.erp.service;

import com.ifti.erp.dto.CompanySettingsRequest;
import com.ifti.erp.entity.CompanySettings;
import com.ifti.erp.repository.CompanySettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanySettingsService {
    private final CompanySettingsRepository repository;
    private final AuditService audit;
    public CompanySettingsService(CompanySettingsRepository repository, AuditService audit) { this.repository = repository; this.audit = audit; }

    @Transactional(readOnly = true)
    public CompanySettings get() { return repository.findById(1L).orElseGet(CompanySettings::createDefault); }

    @Transactional
    public CompanySettings update(CompanySettingsRequest request) {
        CompanySettings settings = repository.findById(1L).orElseGet(CompanySettings::createDefault);
        String previous = settings.getBusinessName();
        settings.setBusinessName(request.businessName().trim());
        settings.setAddress(blankToNull(request.address()));
        settings.setPhone(blankToNull(request.phone()));
        settings.setEmail(blankToNull(request.email()));
        settings.setTaxNumber(blankToNull(request.taxNumber()));
        settings.setCurrencyCode(request.currencyCode().trim().toUpperCase(java.util.Locale.ROOT));
        if (request.logoData() != null) settings.setLogoData(com.ifti.erp.security.ImageDataValidator.validate(request.logoData()));
        CompanySettings saved = repository.save(settings);
        audit.record("UPDATED", "COMPANY_SETTINGS", 1L, "business name " + previous + " -> " + saved.getBusinessName());
        return saved;
    }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
