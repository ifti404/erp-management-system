package com.ifti.erp.service;

import com.ifti.erp.dto.SalesReturnRequest;
import com.ifti.erp.entity.Customer;
import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.Product;
import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.PaymentRepository;
import com.ifti.erp.repository.SalesItemRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import com.ifti.erp.repository.SalesReturnItemRepository;
import com.ifti.erp.repository.SalesReturnRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SalesReturnServiceTest {
    @Mock private SalesReturnRepository returnRepository;
    @Mock private SalesReturnItemRepository returnItemRepository;
    @Mock private SalesOrderRepository orderRepository;
    @Mock private SalesItemRepository itemRepository;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private InventoryMovementService movementService;
    @Mock private AuditService auditService;
    @Mock private PaymentRepository paymentRepository;
    @Mock private AccountService accountService;
    @Mock private SalesOrder order;
    @Mock private SalesItem item;
    @Mock private Product product;
    @Mock private Inventory inventory;

    private SalesReturnService service;

    @BeforeEach
    void setUp() {
        service = new SalesReturnService(returnRepository, returnItemRepository, orderRepository,
                itemRepository, inventoryRepository, movementService, auditService, paymentRepository, accountService);
        when(orderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));
        when(order.getId()).thenReturn(5L);
        when(order.getStatus()).thenReturn("DELIVERED");
        when(order.isInventoryReleased()).thenReturn(false);
        when(itemRepository.findByIdForUpdate(8L)).thenReturn(Optional.of(item));
        when(item.getId()).thenReturn(8L);
        when(item.getSalesOrder()).thenReturn(order);
        when(item.getProduct()).thenReturn(product);
        when(product.getName()).thenReturn("Test product");
        when(item.getQuantity()).thenReturn(3);
    }

    @Test
    void rejectsQuantityAboveUnreturnedSoldAmountWithoutChangingStock() {
        when(returnItemRepository.returnedQuantity(8L)).thenReturn(2L);
        SalesReturnRequest request = new SalesReturnRequest(5L, "Damaged",
                List.of(new SalesReturnRequest.Item(8L, 2, true)));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));

        assertTrue(error.getMessage().contains("exceeds"));
        verify(inventoryRepository, never()).save(any());
        verify(returnRepository, never()).saveAndFlush(any());
    }

    @Test
    void restocksOnlySelectedQuantityAndCalculatesOriginalSalePrice() {
        Customer customer = new Customer();
        customer.setName("Customer");
        when(order.getCustomer()).thenReturn(customer);
        when(order.getTotalAmount()).thenReturn(new BigDecimal("100.00"));
        when(returnRepository.totalReturnedValue(5L)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.calculateNetCollectedAmountBySalesOrderId(5L)).thenReturn(new BigDecimal("100.00"));
        when(product.getSku()).thenReturn("SKU-1");
        when(item.getUnitPrice()).thenReturn(new BigDecimal("12.50"));
        when(returnRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(inventoryRepository.findByProductIdForUpdate(12L)).thenReturn(Optional.of(inventory));
        when(product.getId()).thenReturn(12L);
        when(inventory.getQuantity()).thenReturn(4, 6);
        SalesReturnRequest request = new SalesReturnRequest(5L, "Customer return",
                List.of(new SalesReturnRequest.Item(8L, 2, true)));

        var result = service.create(request);

        assertEquals(new BigDecimal("25.00"), result.returnAmount());
        assertEquals(new BigDecimal("25.00"), result.refundAmount());
        assertEquals("PENDING", result.settlementStatus());
        assertEquals("Test product", result.items().getFirst().productName());
        verify(inventory).setQuantity(6);
        verify(movementService).record(product, "SALES_RETURN", 2, 6, "SALES_RETURN", null,
                "Return for sales order #5");
    }

    @Test
    void returnReducesUnpaidBalanceWithoutIssuingCashRefund() {
        Customer customer = new Customer();
        customer.setName("Customer");
        when(order.getCustomer()).thenReturn(customer);
        when(order.getTotalAmount()).thenReturn(new BigDecimal("100.00"));
        when(returnRepository.totalReturnedValue(5L)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.calculateNetCollectedAmountBySalesOrderId(5L)).thenReturn(BigDecimal.ZERO);
        when(item.getUnitPrice()).thenReturn(new BigDecimal("25.00"));
        when(product.getSku()).thenReturn("SKU-1");
        when(returnItemRepository.returnedQuantity(8L)).thenReturn(0L);
        when(returnRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        SalesReturnRequest request = new SalesReturnRequest(5L, "Customer return",
                List.of(new SalesReturnRequest.Item(8L, 1, false)));

        var result = service.create(request);

        assertEquals(new BigDecimal("25.00"), result.returnAmount());
        assertEquals(BigDecimal.ZERO, result.refundAmount());
        assertEquals("BALANCE_ADJUSTMENT", result.settlementType());
        assertEquals("ADJUSTED", result.settlementStatus());
        verify(inventoryRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }
}
