package com.ifti.erp.service;

import com.ifti.erp.entity.Customer;
import com.ifti.erp.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    public CustomerService(CustomerRepository customerRepository, AuditService auditService) {
        this.customerRepository = customerRepository;
        this.auditService = auditService;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Optional<Customer> findByPhone(String phone) {
        return customerRepository.findFirstByPhone(phone);
    }

    @Transactional
    public Customer createCustomer(Customer customer) {
        Customer saved = customerRepository.save(customer);
        auditService.record("CREATED", "CUSTOMER", saved.getId(), "name=" + saved.getName());
        return saved;
    }

    @Transactional
    public Customer updateCustomer(Long id, Customer customerDetails) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customer.setName(customerDetails.getName());
        customer.setPhone(customerDetails.getPhone());
        customer.setEmail(customerDetails.getEmail());
        customer.setAddress(customerDetails.getAddress());

        Customer saved = customerRepository.save(customer);
        auditService.record("UPDATED", "CUSTOMER", id, "name=" + saved.getName());
        return saved;
    }

    @Transactional
    public void deleteCustomer(Long id) {
        String name = customerRepository.findById(id).map(Customer::getName).orElse("unknown");
        auditService.record("DELETED", "CUSTOMER", id, "name=" + name);
        customerRepository.deleteById(id);
    }
}
