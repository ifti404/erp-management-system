<<<<<<< HEAD
package com.ifti.erp.service;

import com.ifti.erp.entity.Supplier;
import com.ifti.erp.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final AuditService auditService;

    public SupplierService(SupplierRepository supplierRepository, AuditService auditService) {
        this.supplierRepository = supplierRepository;
        this.auditService = auditService;
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Optional<Supplier> getSupplierById(Long id) {
        return supplierRepository.findById(id);
    }

    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        Supplier saved = supplierRepository.save(supplier);
        auditService.record("CREATED", "SUPPLIER", saved.getId(), "name=" + saved.getName());
        return saved;
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier supplierDetails) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        supplier.setName(supplierDetails.getName());
        supplier.setPhone(supplierDetails.getPhone());
        supplier.setEmail(supplierDetails.getEmail());
        supplier.setAddress(supplierDetails.getAddress());

        Supplier saved = supplierRepository.save(supplier);
        auditService.record("UPDATED", "SUPPLIER", id, "name=" + saved.getName());
        return saved;
    }

    @Transactional
    public void deleteSupplier(Long id) {
        String name = supplierRepository.findById(id).map(Supplier::getName).orElse("unknown");
        auditService.record("DELETED", "SUPPLIER", id, "name=" + name);
        supplierRepository.deleteById(id);
    }
}
=======
package com.ifti.erp.service;

import com.ifti.erp.entity.Supplier;
import com.ifti.erp.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Optional<Supplier> getSupplierById(Long id) {
        return supplierRepository.findById(id);
    }

    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Long id, Supplier supplierDetails) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        supplier.setName(supplierDetails.getName());
        supplier.setPhone(supplierDetails.getPhone());
        supplier.setEmail(supplierDetails.getEmail());
        supplier.setAddress(supplierDetails.getAddress());

        return supplierRepository.save(supplier);
    }

    public void deleteSupplier(Long id) {
        supplierRepository.deleteById(id);
    }
}
>>>>>>> edc71aefa89594cf9040eba79f454355b029bdec
