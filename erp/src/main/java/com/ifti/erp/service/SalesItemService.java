package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.SalesItemRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SalesItemService {

    private final SalesItemRepository salesItemRepository;
    private final InventoryRepository inventoryRepository;
    private final SalesOrderRepository salesOrderRepository;

    public SalesItemService(
            SalesItemRepository salesItemRepository,
            InventoryRepository inventoryRepository,
            SalesOrderRepository salesOrderRepository) {

        this.salesItemRepository = salesItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    public List<SalesItem> getAllSalesItems() {
        return salesItemRepository.findAll();
    }

    public Optional<SalesItem> getSalesItemById(Long id) {
        return salesItemRepository.findById(id);
    }

    @Transactional
    public SalesItem createSalesItem(SalesItem salesItem) {

        Inventory inventory = getInventory(
                salesItem.getProduct().getId()
        );

        if (inventory.getQuantity() < salesItem.getQuantity()) {
            throw new RuntimeException("Insufficient inventory");
        }

        inventory.setQuantity(
                inventory.getQuantity()
                        - salesItem.getQuantity()
        );

        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        salesItem.setSubtotal(
                salesItem.getUnitPrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        salesItem.getQuantity()
                                )
                        )
        );

        SalesItem savedItem =
                salesItemRepository.save(salesItem);

        updateSalesOrderTotal(
                salesItem.getSalesOrder().getId()
        );

        return savedItem;
    }

    @Transactional
    public SalesItem updateSalesItem(
            Long id,
            SalesItem salesItemDetails) {

        SalesItem existingItem =
                salesItemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Sales item not found"));

        Long oldOrderId =
                existingItem.getSalesOrder().getId();

        Long newOrderId =
                salesItemDetails.getSalesOrder().getId();

        // Restore old quantity
        Inventory oldInventory = getInventory(
                existingItem.getProduct().getId()
        );

        oldInventory.setQuantity(
                oldInventory.getQuantity()
                        + existingItem.getQuantity()
        );

        oldInventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(oldInventory);

        // Check new quantity
        Inventory newInventory = getInventory(
                salesItemDetails.getProduct().getId()
        );

        if (newInventory.getQuantity()
                < salesItemDetails.getQuantity()) {

            throw new RuntimeException("Insufficient inventory");
        }

        // Deduct new quantity
        newInventory.setQuantity(
                newInventory.getQuantity()
                        - salesItemDetails.getQuantity()
        );

        newInventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(newInventory);

        // Update item fields
        existingItem.setSalesOrder(
                salesItemDetails.getSalesOrder()
        );

        existingItem.setProduct(
                salesItemDetails.getProduct()
        );

        existingItem.setQuantity(
                salesItemDetails.getQuantity()
        );

        existingItem.setUnitPrice(
                salesItemDetails.getUnitPrice()
        );

        // Calculate subtotal
        existingItem.setSubtotal(
                salesItemDetails.getUnitPrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        salesItemDetails.getQuantity()
                                )
                        )
        );

        SalesItem updatedItem =
                salesItemRepository.save(existingItem);

        // Recalculate totals
        updateSalesOrderTotal(oldOrderId);

        if (!oldOrderId.equals(newOrderId)) {
            updateSalesOrderTotal(newOrderId);
        }

        return updatedItem;
    }

    @Transactional
    public void deleteSalesItem(Long id) {

        SalesItem salesItem =
                salesItemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Sales item not found"));

        Long orderId =
                salesItem.getSalesOrder().getId();

        Inventory inventory = getInventory(
                salesItem.getProduct().getId()
        );

        // Return sold quantity to inventory
        inventory.setQuantity(
                inventory.getQuantity()
                        + salesItem.getQuantity()
        );

        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        salesItemRepository.delete(salesItem);

        // Recalculate order total
        updateSalesOrderTotal(orderId);
    }

   private void updateSalesOrderTotal(Long orderId) {

    SalesOrder order =
            salesOrderRepository.findById(orderId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Sales order not found"));

    BigDecimal itemsSubtotal =
            salesItemRepository
                    .calculateTotalBySalesOrderId(orderId);

    BigDecimal deliveryCharge = order.getDeliveryCharge() == null
            ? BigDecimal.ZERO
            : order.getDeliveryCharge();

    BigDecimal codAmount = itemsSubtotal.add(deliveryCharge);

    order.setTotalAmount(codAmount);

    salesOrderRepository.save(order);
}

    private Inventory getInventory(Long productId) {

        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product"));
    }
}