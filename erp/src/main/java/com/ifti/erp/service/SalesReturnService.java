package com.ifti.erp.service;

import com.ifti.erp.dto.SalesReturnRequest;
import com.ifti.erp.dto.SalesReturnResponse;
import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.Payment;
import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.entity.SalesReturn;
import com.ifti.erp.entity.SalesReturnItem;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.SalesItemRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import com.ifti.erp.repository.SalesReturnItemRepository;
import com.ifti.erp.repository.SalesReturnRepository;
import com.ifti.erp.repository.PaymentRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SalesReturnService {
    private final SalesReturnRepository returnRepository;
    private final SalesReturnItemRepository returnItemRepository;
    private final SalesOrderRepository orderRepository;
    private final SalesItemRepository itemRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementService movementService;
    private final AuditService auditService;
    private final PaymentRepository paymentRepository;

    public SalesReturnService(SalesReturnRepository returnRepository,
            SalesReturnItemRepository returnItemRepository, SalesOrderRepository orderRepository,
            SalesItemRepository itemRepository, InventoryRepository inventoryRepository,
            InventoryMovementService movementService, AuditService auditService,
            PaymentRepository paymentRepository) {
        this.returnRepository = returnRepository;
        this.returnItemRepository = returnItemRepository;
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementService = movementService;
        this.auditService = auditService;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<SalesReturnResponse> list(Long orderId) {
        List<SalesReturn> records = orderId == null ? returnRepository.findAllByOrderByCreatedAtDesc()
                : returnRepository.findBySalesOrderIdOrderByCreatedAtDesc(orderId);
        return records.stream().map(SalesReturnResponse::from).toList();
    }

    @Transactional
    public SalesReturnResponse create(SalesReturnRequest request) {
        SalesOrder order = orderRepository.findByIdForUpdate(request.salesOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found"));
        if (!"DELIVERED".equalsIgnoreCase(order.getStatus()) || order.isInventoryReleased()) {
            throw new IllegalArgumentException("Only delivered sales orders can be returned");
        }
        Set<Long> seen = new HashSet<>();
        List<SalesItem> selectedItems = request.items().stream().map(line -> {
            if (!seen.add(line.salesItemId())) throw new IllegalArgumentException("A sales item can only appear once per return");
            SalesItem item = itemRepository.findByIdForUpdate(line.salesItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Sales item not found"));
            if (!order.getId().equals(item.getSalesOrder().getId())) {
                throw new IllegalArgumentException("Every returned item must belong to the selected sales order");
            }
            long alreadyReturned = returnItemRepository.returnedQuantity(item.getId());
            if (line.quantity() > item.getQuantity() - alreadyReturned) {
                throw new IllegalArgumentException("Return quantity exceeds the remaining returnable quantity for " + item.getProduct().getName());
            }
            return item;
        }).toList();

        BigDecimal total = BigDecimal.ZERO;
        for (int index = 0; index < selectedItems.size(); index++) {
            total = total.add(selectedItems.get(index).getUnitPrice()
                    .multiply(BigDecimal.valueOf(request.items().get(index).quantity())));
        }
        BigDecimal previousReturns = returnRepository.totalReturnedValue(order.getId());
        BigDecimal netCollected = paymentRepository.calculateNetCollectedAmountBySalesOrderId(order.getId());
        BigDecimal unpaidBeforeReturn = order.getTotalAmount().subtract(previousReturns).subtract(netCollected).max(BigDecimal.ZERO);
        BigDecimal refundDue = total.subtract(unpaidBeforeReturn).max(BigDecimal.ZERO).min(total);
        String settlementType = refundDue.signum() > 0 ? "REFUND" : "BALANCE_ADJUSTMENT";
        String settlementStatus = refundDue.signum() > 0 ? "PENDING" : "ADJUSTED";
        SalesReturn salesReturn = new SalesReturn(order, request.reason().trim(), settlementType,
                settlementStatus, total, refundDue, LocalDateTime.now(), currentActor());
        for (int index = 0; index < selectedItems.size(); index++) {
            SalesItem item = selectedItems.get(index);
            SalesReturnRequest.Item line = request.items().get(index);
            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(line.quantity()));
            salesReturn.addItem(new SalesReturnItem(item, line.quantity(), line.restock(),
                    item.getUnitPrice(), lineTotal));
        }
        salesReturn = returnRepository.saveAndFlush(salesReturn);
        for (int index = 0; index < selectedItems.size(); index++) {
            SalesItem item = selectedItems.get(index);
            SalesReturnRequest.Item line = request.items().get(index);
            if (line.restock()) {
                Inventory inventory = inventoryRepository.findByProductIdForUpdate(item.getProduct().getId())
                        .orElseThrow(() -> new IllegalArgumentException("Inventory not found for " + item.getProduct().getName()));
                inventory.setQuantity(inventory.getQuantity() + line.quantity());
                inventory.setUpdatedAt(LocalDateTime.now());
                inventoryRepository.save(inventory);
                movementService.record(item.getProduct(), "SALES_RETURN", line.quantity(),
                        inventory.getQuantity(), "SALES_RETURN", salesReturn.getId(),
                        "Return for sales order #" + order.getId());
            }
        }
        SalesReturn saved = salesReturn;
        auditService.record("CREATED", "SALES_RETURN", saved.getId(), "sales order #" + order.getId()
                + ", returnValue=" + total + ", refundDue=" + refundDue + ", type=" + settlementType + ", status=" + settlementStatus);
        return SalesReturnResponse.from(saved);
    }

    @Transactional
    public SalesReturnResponse completeSettlement(Long id) {
        SalesReturn salesReturn = returnRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Sales return not found"));
        if (!"PENDING".equals(salesReturn.getSettlementStatus()) || !"REFUND".equals(salesReturn.getSettlementType())) {
            throw new IllegalArgumentException("This return settlement is already complete");
        }
        String status = "REFUNDED";
        salesReturn.setSettlementStatus(status);
        SalesReturn saved = returnRepository.save(salesReturn);
        if ("REFUNDED".equals(status)) {
            Payment payment = new Payment();
            payment.setPaymentDate(LocalDateTime.now());
            payment.setAmount(saved.getRefundAmount());
            payment.setPaymentMethod("REFUND");
            payment.setStatus("REFUNDED");
            payment.setSalesOrder(saved.getSalesOrder());
            payment.setNotes("Refund for sales return #" + id);
            paymentRepository.save(payment);
        }
        auditService.record("SETTLED", "SALES_RETURN", id, "status=" + status + ", amount=" + saved.getRefundAmount());
        return SalesReturnResponse.from(saved);
    }

    private String currentActor() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null || !authentication.isAuthenticated() ? "SYSTEM" : authentication.getName();
    }
}
