package com.ifti.erp.service;

import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    public Optional<PurchaseOrder> getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id);
    }

    public PurchaseOrder createPurchaseOrder(PurchaseOrder purchaseOrder) {
        return purchaseOrderRepository.save(purchaseOrder);
    }

    public PurchaseOrder updatePurchaseOrder(
            Long id,
            PurchaseOrder purchaseOrderDetails) {

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));

        purchaseOrder.setSupplier(purchaseOrderDetails.getSupplier());
        purchaseOrder.setOrderDate(purchaseOrderDetails.getOrderDate());
        purchaseOrder.setStatus(purchaseOrderDetails.getStatus());
        purchaseOrder.setTotalAmount(purchaseOrderDetails.getTotalAmount());
        purchaseOrder.setNotes(purchaseOrderDetails.getNotes());

        return purchaseOrderRepository.save(purchaseOrder);
    }

    public void deletePurchaseOrder(Long id) {
        purchaseOrderRepository.deleteById(id);
    }
}