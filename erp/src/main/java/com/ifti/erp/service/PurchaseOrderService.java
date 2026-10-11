
package com.ifti.erp.service;

import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.repository.PurchaseItemRepository;
import com.ifti.erp.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseItemRepository purchaseItemRepository;

    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseItemRepository purchaseItemRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseItemRepository = purchaseItemRepository;
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    public Optional<PurchaseOrder> getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id);
    }

    @Transactional
    public PurchaseOrder createPurchaseOrder(PurchaseOrder purchaseOrder) {
        purchaseOrder.setTotalAmount(BigDecimal.ZERO);
        return purchaseOrderRepository.save(purchaseOrder);
    }

    @Transactional
    public PurchaseOrder updatePurchaseOrder(
            Long id,
            PurchaseOrder purchaseOrderDetails) {

        PurchaseOrder purchaseOrder =
                purchaseOrderRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase order not found"));

        purchaseOrder.setSupplier(purchaseOrderDetails.getSupplier());
        purchaseOrder.setOrderDate(purchaseOrderDetails.getOrderDate());
        purchaseOrder.setStatus(purchaseOrderDetails.getStatus());
        purchaseOrder.setNotes(purchaseOrderDetails.getNotes());

        BigDecimal itemsTotal =
                purchaseItemRepository
                        .calculateTotalByPurchaseOrderId(id);

        purchaseOrder.setTotalAmount(
                itemsTotal == null ? BigDecimal.ZERO : itemsTotal);

        return purchaseOrderRepository.save(purchaseOrder);
    }

    @Transactional
    public void deletePurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder =
                purchaseOrderRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase order not found"));

        if (!purchaseItemRepository
                .findByPurchaseOrderId(id).isEmpty()) {
            throw new RuntimeException(
                    "Delete the purchase items before deleting this order");
        }

        purchaseOrderRepository.delete(purchaseOrder);
    }
}
