
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
    private final AuditService auditService;

    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseItemRepository purchaseItemRepository, AuditService auditService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.auditService = auditService;
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    public Optional<PurchaseOrder> getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id);
    }

    @Transactional
    public PurchaseOrder createPurchaseOrder(PurchaseOrder purchaseOrder) {
        String status = purchaseOrder.getStatus();
        if (!"PENDING".equalsIgnoreCase(status)
                && !"ORDERED".equalsIgnoreCase(status)) {
            throw new RuntimeException("New purchase orders must be PENDING or ORDERED");
        }
        purchaseOrder.setStatus(status.toUpperCase());
        purchaseOrder.setTotalAmount(BigDecimal.ZERO);
        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
        auditService.record("CREATED", "PURCHASE_ORDER", saved.getId(), "status=" + saved.getStatus() + ", due=" + saved.getDueDate());
        return saved;
    }

    @Transactional
    public PurchaseOrder updatePurchaseOrder(
            Long id,
            PurchaseOrder purchaseOrderDetails) {

        PurchaseOrder purchaseOrder =
                purchaseOrderRepository.findByIdForUpdate(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase order not found"));
        String previous = "status=" + purchaseOrder.getStatus() + ", total=" + purchaseOrder.getTotalAmount() + ", due=" + purchaseOrder.getDueDate();

        purchaseOrder.setSupplier(purchaseOrderDetails.getSupplier());
        purchaseOrder.setOrderDate(purchaseOrderDetails.getOrderDate());
        purchaseOrder.setDueDate(purchaseOrderDetails.getDueDate());
        purchaseOrder.setNotes(purchaseOrderDetails.getNotes());

        List<com.ifti.erp.entity.PurchaseItem> items =
                purchaseItemRepository.findByPurchaseOrderId(id);
        boolean anyReceived = items.stream()
                .anyMatch(item -> item.getReceivedQuantity() > 0);
        boolean allReceived = !items.isEmpty() && items.stream()
                .allMatch(item -> item.getRemainingQuantity() == 0);
        String requestedStatus = purchaseOrderDetails.getStatus();
        if ("CANCELLED".equalsIgnoreCase(requestedStatus)) {
            purchaseOrder.setStatus("CANCELLED");
        } else if (anyReceived) {
            purchaseOrder.setStatus(allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED");
        } else if ("PENDING".equalsIgnoreCase(requestedStatus)
                || "ORDERED".equalsIgnoreCase(requestedStatus)) {
            purchaseOrder.setStatus(requestedStatus.toUpperCase());
        } else {
            throw new RuntimeException("Purchase order status is managed by receiving");
        }

        BigDecimal itemsTotal =
                purchaseItemRepository
                        .calculateTotalByPurchaseOrderId(id);

        purchaseOrder.setTotalAmount(
                itemsTotal == null ? BigDecimal.ZERO : itemsTotal);

        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
        auditService.record("UPDATED", "PURCHASE_ORDER", id, previous + " -> status=" + saved.getStatus() + ", total=" + saved.getTotalAmount() + ", due=" + saved.getDueDate());
        return saved;
    }

    @Transactional
    public void deletePurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder =
                purchaseOrderRepository.findByIdForUpdate(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase order not found"));

        if (!purchaseItemRepository
                .findByPurchaseOrderId(id).isEmpty()) {
            throw new RuntimeException(
                    "Delete the purchase items before deleting this order");
        }

        auditService.record("DELETED", "PURCHASE_ORDER", id, "status=" + purchaseOrder.getStatus() + ", total=" + purchaseOrder.getTotalAmount());
        purchaseOrderRepository.delete(purchaseOrder);
    }
}
