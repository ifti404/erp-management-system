
package com.ifti.erp.service;

import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.SalesItemRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesItemRepository salesItemRepository;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            SalesItemRepository salesItemRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.salesItemRepository = salesItemRepository;
    }

    public List<SalesOrder> getAllSalesOrders() {
        return salesOrderRepository.findAll();
    }

    public Optional<SalesOrder> getSalesOrderById(Long id) {
        return salesOrderRepository.findById(id);
    }

    @Transactional
    public SalesOrder createSalesOrder(SalesOrder salesOrder) {
        BigDecimal deliveryCharge = normalizeDeliveryCharge(
                salesOrder.getDeliveryCharge());

        salesOrder.setDeliveryCharge(deliveryCharge);
        salesOrder.setTotalAmount(deliveryCharge);

        return salesOrderRepository.save(salesOrder);
    }

    @Transactional
    public SalesOrder updateSalesOrder(
            Long id,
            SalesOrder salesOrderDetails) {

        SalesOrder salesOrder = salesOrderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales order not found"));

        BigDecimal deliveryCharge = normalizeDeliveryCharge(
                salesOrderDetails.getDeliveryCharge());

        salesOrder.setCustomer(salesOrderDetails.getCustomer());
        salesOrder.setOrderDate(salesOrderDetails.getOrderDate());
        salesOrder.setStatus(salesOrderDetails.getStatus());
        salesOrder.setDeliveryCharge(deliveryCharge);
        salesOrder.setNotes(salesOrderDetails.getNotes());
        salesOrder.setCourier(salesOrderDetails.getCourier());
        salesOrder.setParcelId(salesOrderDetails.getParcelId());

        BigDecimal itemsSubtotal =
                salesItemRepository.calculateTotalBySalesOrderId(id);

        salesOrder.setTotalAmount(itemsSubtotal.add(deliveryCharge));

        return salesOrderRepository.save(salesOrder);
        
    }

    @Transactional
    public void deleteSalesOrder(Long id) {
        salesOrderRepository.deleteById(id);
    }

    private BigDecimal normalizeDeliveryCharge(BigDecimal deliveryCharge) {
        if (deliveryCharge == null) {
            return BigDecimal.ZERO;
        }

        if (deliveryCharge.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException(
                    "Delivery charge cannot be negative");
        }

        return deliveryCharge;
    }
}
