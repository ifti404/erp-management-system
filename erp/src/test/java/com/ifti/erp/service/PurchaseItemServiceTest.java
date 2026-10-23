package com.ifti.erp.service;

import com.ifti.erp.dto.ReceivePurchaseItemsRequest;
import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.PurchaseItem;
import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.entity.Product;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.PurchaseItemRepository;
import com.ifti.erp.repository.PurchaseOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseItemServiceTest {
    @Mock private PurchaseItemRepository itemRepository;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private PurchaseOrderRepository orderRepository;
    @Mock private PurchaseOrder order;
    @Mock private PurchaseItem item;
    @Mock private Inventory inventory;
    @Mock private Product product;
    @Mock private InventoryMovementService movementService;
    @Mock private AuditService auditService;

    private PurchaseItemService service;

    @BeforeEach
    void setUp() {
        service = new PurchaseItemService(itemRepository, inventoryRepository, orderRepository, movementService, auditService);
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(order.getStatus()).thenReturn("ORDERED");
    }

    @Test
    void receivingPartialQuantityAddsOnlyReceivedUnitsToStock() {
        when(itemRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(item));
        when(item.getPurchaseOrder()).thenReturn(order);
        when(order.getId()).thenReturn(10L);
        when(item.getRemainingQuantity()).thenReturn(8);
        when(item.getReceivedQuantity()).thenReturn(0);
        when(item.getProduct()).thenReturn(product);
        when(product.getId()).thenReturn(30L);
        when(inventoryRepository.findByProductIdForUpdate(30L)).thenReturn(Optional.of(inventory));
        when(inventory.getQuantity()).thenReturn(4);
        when(itemRepository.findByPurchaseOrderId(10L)).thenReturn(List.of(item));

        service.receiveItems(10L, new ReceivePurchaseItemsRequest(
                List.of(new ReceivePurchaseItemsRequest.Line(20L, 3))));

        verify(inventory).setQuantity(7);
        verify(item).setReceivedQuantity(3);
        verify(itemRepository).save(item);
    }

    @Test
    void receivingMoreThanRemainingQuantityIsRejectedWithoutChangingStock() {
        when(itemRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(item));
        when(item.getPurchaseOrder()).thenReturn(order);
        when(order.getId()).thenReturn(10L);
        when(item.getRemainingQuantity()).thenReturn(8);

        assertThrows(RuntimeException.class, () -> service.receiveItems(10L,
                new ReceivePurchaseItemsRequest(
                        List.of(new ReceivePurchaseItemsRequest.Line(20L, 9)))));

        verify(inventoryRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }
}
