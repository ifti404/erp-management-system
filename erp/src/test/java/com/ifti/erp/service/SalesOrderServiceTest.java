package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.Product;
import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.SalesItemRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import com.ifti.erp.repository.SalesReturnRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SalesOrderServiceTest {
    @Mock private SalesOrderRepository orderRepository;
    @Mock private SalesItemRepository itemRepository;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private InventoryMovementService movementService;
    @Mock private AuditService auditService;
    @Mock private SalesReturnRepository salesReturnRepository;
    @Mock private SalesOrder order;
    @Mock private SalesOrder details;
    @Mock private Inventory inventory;
    @Mock private SalesItem firstItem;
    @Mock private SalesItem secondItem;
    @Mock private Product product;

    private SalesOrderService service;

    @BeforeEach
    void setUp() {
        service = new SalesOrderService(orderRepository, itemRepository,
                inventoryRepository, movementService, auditService, salesReturnRepository);
        when(orderRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
        when(order.getDeliveryCharge()).thenReturn(BigDecimal.ZERO);
        when(itemRepository.calculateTotalBySalesOrderId(1L)).thenReturn(BigDecimal.ZERO);
        when(orderRepository.save(order)).thenReturn(order);
    }

    @Test
    void reactivationChecksCombinedQuantityForRepeatedProductLines() {
        when(details.getStatus()).thenReturn("PENDING");
        when(order.getStatus()).thenReturn("CANCELLED");
        when(order.isInventoryReleased()).thenReturn(true);
        when(itemRepository.findBySalesOrderId(1L)).thenReturn(List.of(firstItem, secondItem));
        when(firstItem.getProduct()).thenReturn(product);
        when(secondItem.getProduct()).thenReturn(product);
        when(product.getId()).thenReturn(7L);
        when(firstItem.getQuantity()).thenReturn(4);
        when(secondItem.getQuantity()).thenReturn(4);
        when(inventoryRepository.findByProductIdForUpdate(7L)).thenReturn(Optional.of(inventory));
        when(inventory.getQuantity()).thenReturn(5);

        assertThrows(RuntimeException.class, () -> service.updateSalesOrder(1L, details));

        verify(inventoryRepository, never()).save(any());
        verify(movementService, never()).record(any(), anyString(), anyInt(), anyInt(), any(), any(), any());
    }

    @Test
    void editingAnAlreadyCancelledLegacyOrderDoesNotReleaseStockAgain() {
        when(details.getStatus()).thenReturn("CANCELLED");
        when(order.getStatus()).thenReturn("CANCELLED");
        when(order.isInventoryReleased()).thenReturn(false);

        service.updateSalesOrder(1L, details);

        verify(inventoryRepository, never()).findByProductIdForUpdate(any());
        verify(inventoryRepository, never()).save(any());
        verify(movementService, never()).record(any(), anyString(), anyInt(), anyInt(), any(), any(), any());
    }
}
