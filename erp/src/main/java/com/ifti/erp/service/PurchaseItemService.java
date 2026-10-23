<<<<<<< HEAD
package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.PurchaseItem;
import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.dto.ReceivePurchaseItemsRequest;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.PurchaseItemRepository;
import com.ifti.erp.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.Set;

@Service
public class PurchaseItemService {

    private final PurchaseItemRepository purchaseItemRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryMovementService movementService;
    private final AuditService auditService;

    public PurchaseItemService(
            PurchaseItemRepository purchaseItemRepository,
            InventoryRepository inventoryRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            InventoryMovementService movementService, AuditService auditService) {

        this.purchaseItemRepository = purchaseItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.movementService = movementService;
        this.auditService = auditService;
    }

    public List<PurchaseItem> getAllPurchaseItems() {
        return purchaseItemRepository.findAll();
    }

    public Optional<PurchaseItem> getPurchaseItemById(Long id) {
        return purchaseItemRepository.findById(id);
    }

    @Transactional
    public PurchaseOrder receiveItems(Long orderId, ReceivePurchaseItemsRequest request) {
        PurchaseOrder order = purchaseOrderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));
        ensureOrderCanBeEdited(order);

        Set<Long> seenItemIds = new HashSet<>();
        List<PurchaseItem> receivingItems = new ArrayList<>();
        for (ReceivePurchaseItemsRequest.Line line : request.items()) {
            if (!seenItemIds.add(line.purchaseItemId())) {
                throw new RuntimeException("A purchase item can appear only once per receipt");
            }
            PurchaseItem item = purchaseItemRepository.findByIdForUpdate(line.purchaseItemId())
                    .orElseThrow(() -> new RuntimeException(
                            "Purchase item not found: " + line.purchaseItemId()));
            if (!item.getPurchaseOrder().getId().equals(orderId)) {
                throw new RuntimeException("Purchase item does not belong to this order");
            }
            if (line.quantity() > item.getRemainingQuantity()) {
                throw new RuntimeException("Received quantity exceeds remaining quantity for item " + item.getId());
            }
            receivingItems.add(item);
        }

        for (int index = 0; index < request.items().size(); index++) {
            ReceivePurchaseItemsRequest.Line line = request.items().get(index);
            PurchaseItem item = receivingItems.get(index);
            Inventory inventory = inventoryRepository.findByProductIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Inventory not found for product " + item.getProduct().getId()));
            inventory.setQuantity(inventory.getQuantity() + line.quantity());
            inventory.setUpdatedAt(java.time.LocalDateTime.now());
            inventoryRepository.save(inventory);
            movementService.record(item.getProduct(), "PURCHASE_RECEIPT", line.quantity(),
                    inventory.getQuantity(), "PURCHASE_ORDER", orderId, null);
            item.setReceivedQuantity(item.getReceivedQuantity() + line.quantity());
            purchaseItemRepository.save(item);
        }

        List<PurchaseItem> items = purchaseItemRepository.findByPurchaseOrderId(orderId);
        boolean allReceived = !items.isEmpty() && items.stream()
                .allMatch(item -> item.getRemainingQuantity() == 0);
        boolean anyReceived = items.stream().anyMatch(item -> item.getReceivedQuantity() > 0);
        order.setStatus(allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : order.getStatus());
        PurchaseOrder savedOrder = purchaseOrderRepository.save(order);
        String received = request.items().stream().map(line -> line.purchaseItemId() + ":+" + line.quantity())
                .collect(java.util.stream.Collectors.joining(", "));
        auditService.record("RECEIVED", "PURCHASE_ORDER", orderId, received + ", status=" + savedOrder.getStatus());
        return savedOrder;
    }

    @Transactional
    public PurchaseItem createPurchaseItem(PurchaseItem purchaseItem) {
        PurchaseOrder order = purchaseOrderRepository.findByIdForUpdate(
                        purchaseItem.getPurchaseOrder().getId())
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));
        ensureOrderCanBeEdited(order);
        purchaseItem.setPurchaseOrder(order);
        purchaseItem.setReceivedQuantity(0);

        // Calculate subtotal
        purchaseItem.setSubtotal(
                purchaseItem.getUnitCost()
                        .multiply(
                                BigDecimal.valueOf(
                                        purchaseItem.getQuantity()
                                )
                        )
        );

        PurchaseItem savedItem =
                purchaseItemRepository.save(purchaseItem);

        // Recalculate purchase order total
        updatePurchaseOrderTotal(
                purchaseItem.getPurchaseOrder().getId()
        );

        auditService.record("CREATED", "PURCHASE_ITEM", savedItem.getId(), "purchase order #" + order.getId() + ", quantity=" + savedItem.getQuantity() + ", unit cost=" + savedItem.getUnitCost());
        return savedItem;
    }

    @Transactional
    public PurchaseItem updatePurchaseItem(
            Long id,
            PurchaseItem purchaseItemDetails) {

        PurchaseItem existingItem =
                purchaseItemRepository.findByIdForUpdate(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase item not found"));

        Long oldOrderId =
                existingItem.getPurchaseOrder().getId();

        Long newOrderId =
                purchaseItemDetails.getPurchaseOrder().getId();

        PurchaseOrder oldOrder = purchaseOrderRepository.findByIdForUpdate(oldOrderId)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));
        PurchaseOrder newOrder = purchaseOrderRepository.findByIdForUpdate(newOrderId)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));
        ensureOrderCanBeEdited(oldOrder);
        ensureOrderCanBeEdited(newOrder);
        if (existingItem.getReceivedQuantity() > 0) {
            throw new RuntimeException("Received purchase items cannot be edited");
        }

        // Update item fields
        existingItem.setPurchaseOrder(
                purchaseItemDetails.getPurchaseOrder()
        );

        existingItem.setProduct(
                purchaseItemDetails.getProduct()
        );

        existingItem.setQuantity(
                purchaseItemDetails.getQuantity()
        );

        existingItem.setUnitCost(
                purchaseItemDetails.getUnitCost()
        );
        existingItem.setReceivedQuantity(0);

        // Recalculate subtotal
        existingItem.setSubtotal(
                purchaseItemDetails.getUnitCost()
                        .multiply(
                                BigDecimal.valueOf(
                                        purchaseItemDetails.getQuantity()
                                )
                        )
        );

        PurchaseItem updatedItem =
                purchaseItemRepository.save(existingItem);

        // Recalculate totals
        updatePurchaseOrderTotal(oldOrderId);

        if (!oldOrderId.equals(newOrderId)) {
            updatePurchaseOrderTotal(newOrderId);
        }

        auditService.record("UPDATED", "PURCHASE_ITEM", id, "order #" + oldOrderId + " -> #" + newOrderId + ", quantity=" + updatedItem.getQuantity() + ", unit cost=" + updatedItem.getUnitCost());
        return updatedItem;
    }

    @Transactional
    public void deletePurchaseItem(Long id) {

        PurchaseItem purchaseItem =
                purchaseItemRepository.findByIdForUpdate(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase item not found"));

        Long orderId =
                purchaseItem.getPurchaseOrder().getId();

        if (purchaseItem.getReceivedQuantity() > 0) {
            throw new RuntimeException("Received purchase items cannot be deleted");
        }

        auditService.record("DELETED", "PURCHASE_ITEM", id, "purchase order #" + orderId + ", quantity=" + purchaseItem.getQuantity() + ", unit cost=" + purchaseItem.getUnitCost());
        purchaseItemRepository.delete(purchaseItem);

        // Recalculate purchase order total
        updatePurchaseOrderTotal(orderId);
    }

    private void updatePurchaseOrderTotal(Long orderId) {

        PurchaseOrder order =
                purchaseOrderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase order not found"));

        BigDecimal total =
                purchaseItemRepository
                        .calculateTotalByPurchaseOrderId(orderId);

        order.setTotalAmount(total);

        purchaseOrderRepository.save(order);
    }

    private void ensureOrderCanBeEdited(PurchaseOrder order) {
        if ("CANCELLED".equalsIgnoreCase(order.getStatus())
                || "RECEIVED".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Cancelled or received purchase orders cannot be edited");
        }
    }
}
=======
package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.PurchaseItem;
import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.PurchaseItemRepository;
import com.ifti.erp.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PurchaseItemService {

    private final PurchaseItemRepository purchaseItemRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public PurchaseItemService(
            PurchaseItemRepository purchaseItemRepository,
            InventoryRepository inventoryRepository,
            PurchaseOrderRepository purchaseOrderRepository) {

        this.purchaseItemRepository = purchaseItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    public List<PurchaseItem> getAllPurchaseItems() {
        return purchaseItemRepository.findAll();
    }

    public Optional<PurchaseItem> getPurchaseItemById(Long id) {
        return purchaseItemRepository.findById(id);
    }

    @Transactional
    public PurchaseItem createPurchaseItem(PurchaseItem purchaseItem) {

        Inventory inventory = getInventory(
                purchaseItem.getProduct().getId()
        );

        // Add purchased quantity to inventory
        inventory.setQuantity(
                inventory.getQuantity()
                        + purchaseItem.getQuantity()
        );

        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        // Calculate subtotal
        purchaseItem.setSubtotal(
                purchaseItem.getUnitCost()
                        .multiply(
                                BigDecimal.valueOf(
                                        purchaseItem.getQuantity()
                                )
                        )
        );

        PurchaseItem savedItem =
                purchaseItemRepository.save(purchaseItem);

        // Recalculate purchase order total
        updatePurchaseOrderTotal(
                purchaseItem.getPurchaseOrder().getId()
        );

        return savedItem;
    }

    @Transactional
    public PurchaseItem updatePurchaseItem(
            Long id,
            PurchaseItem purchaseItemDetails) {

        PurchaseItem existingItem =
                purchaseItemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase item not found"));

        Long oldOrderId =
                existingItem.getPurchaseOrder().getId();

        Long newOrderId =
                purchaseItemDetails.getPurchaseOrder().getId();

        // Remove old quantity from old inventory
        Inventory oldInventory = getInventory(
                existingItem.getProduct().getId()
        );

        if (oldInventory.getQuantity()
                < existingItem.getQuantity()) {

            throw new RuntimeException(
                    "Cannot update purchase item because inventory would become negative"
            );
        }

        oldInventory.setQuantity(
                oldInventory.getQuantity()
                        - existingItem.getQuantity()
        );

        oldInventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(oldInventory);

        // Add new quantity to new inventory
        Inventory newInventory = getInventory(
                purchaseItemDetails.getProduct().getId()
        );

        newInventory.setQuantity(
                newInventory.getQuantity()
                        + purchaseItemDetails.getQuantity()
        );

        newInventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(newInventory);

        // Update item fields
        existingItem.setPurchaseOrder(
                purchaseItemDetails.getPurchaseOrder()
        );

        existingItem.setProduct(
                purchaseItemDetails.getProduct()
        );

        existingItem.setQuantity(
                purchaseItemDetails.getQuantity()
        );

        existingItem.setUnitCost(
                purchaseItemDetails.getUnitCost()
        );

        // Recalculate subtotal
        existingItem.setSubtotal(
                purchaseItemDetails.getUnitCost()
                        .multiply(
                                BigDecimal.valueOf(
                                        purchaseItemDetails.getQuantity()
                                )
                        )
        );

        PurchaseItem updatedItem =
                purchaseItemRepository.save(existingItem);

        // Recalculate totals
        updatePurchaseOrderTotal(oldOrderId);

        if (!oldOrderId.equals(newOrderId)) {
            updatePurchaseOrderTotal(newOrderId);
        }

        return updatedItem;
    }

    @Transactional
    public void deletePurchaseItem(Long id) {

        PurchaseItem purchaseItem =
                purchaseItemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase item not found"));

        Long orderId =
                purchaseItem.getPurchaseOrder().getId();

        Inventory inventory = getInventory(
                purchaseItem.getProduct().getId()
        );

        // Prevent inventory from becoming negative
        if (inventory.getQuantity()
                < purchaseItem.getQuantity()) {

            throw new RuntimeException(
                    "Cannot remove purchase item because inventory would become negative"
            );
        }

        // Remove purchased quantity from inventory
        inventory.setQuantity(
                inventory.getQuantity()
                        - purchaseItem.getQuantity()
        );

        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        purchaseItemRepository.delete(purchaseItem);

        // Recalculate purchase order total
        updatePurchaseOrderTotal(orderId);
    }

    private void updatePurchaseOrderTotal(Long orderId) {

        PurchaseOrder order =
                purchaseOrderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase order not found"));

        BigDecimal total =
                purchaseItemRepository
                        .calculateTotalByPurchaseOrderId(orderId);

        order.setTotalAmount(total);

        purchaseOrderRepository.save(order);
    }

    private Inventory getInventory(Long productId) {

        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product"));
    }
}
>>>>>>> edc71aefa89594cf9040eba79f454355b029bdec
