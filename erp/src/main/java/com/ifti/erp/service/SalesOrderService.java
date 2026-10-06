package com.ifti.erp.service;

import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.SalesOrderRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;

    public SalesOrderService(SalesOrderRepository salesOrderRepository) {
        this.salesOrderRepository = salesOrderRepository;
    }

    public List<SalesOrder> getAllSalesOrders() {
        return salesOrderRepository.findAll();
    }

    public Optional<SalesOrder> getSalesOrderById(Long id) {
        return salesOrderRepository.findById(id);
    }

    public SalesOrder createSalesOrder(SalesOrder salesOrder) {
        salesOrder.setTotalAmount(BigDecimal.ZERO);

        return salesOrderRepository.save(salesOrder);
    }

    public SalesOrder updateSalesOrder(
            Long id,
            SalesOrder salesOrderDetails) {

        SalesOrder salesOrder = salesOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales order not found"));

        salesOrder.setCustomer(salesOrderDetails.getCustomer());
        salesOrder.setOrderDate(salesOrderDetails.getOrderDate());
        salesOrder.setStatus(salesOrderDetails.getStatus());
        salesOrder.setNotes(salesOrderDetails.getNotes());

        return salesOrderRepository.save(salesOrder);
    }

    public void deleteSalesOrder(Long id) {
        salesOrderRepository.deleteById(id);
    }
}