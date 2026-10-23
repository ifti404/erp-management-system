package com.ifti.erp.service;

import com.ifti.erp.entity.Payment;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.PaymentRepository;
import com.ifti.erp.repository.PurchaseOrderRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import com.ifti.erp.repository.SalesReturnRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Mock private PaymentRepository paymentRepository;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private PurchaseOrderRepository purchaseOrderRepository;
    @Mock private SalesOrder order;
    @Mock private AuditService auditService;
    @Mock private SalesReturnRepository salesReturnRepository;

    @Test
    void paidPaymentCannotExceedOrderBalance() {
        PaymentService service = new PaymentService(paymentRepository,
                salesOrderRepository, purchaseOrderRepository, auditService, salesReturnRepository);
        when(order.getId()).thenReturn(5L);
        when(order.getTotalAmount()).thenReturn(new BigDecimal("100.00"));
        when(salesReturnRepository.totalReturnedValue(5L)).thenReturn(BigDecimal.ZERO);
        when(salesOrderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));
        when(paymentRepository.calculateNetCollectedAmountBySalesOrderId(5L))
                .thenReturn(new BigDecimal("98.00"));

        Payment payment = new Payment();
        payment.setStatus("paid");
        payment.setAmount(new BigDecimal("5.00"));
        payment.setSalesOrder(order);

        assertThrows(RuntimeException.class, () -> service.createPayment(payment));

        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void paidPaymentCannotExceedBalanceAfterReturnedItems() {
        PaymentService service = new PaymentService(paymentRepository,
                salesOrderRepository, purchaseOrderRepository, auditService, salesReturnRepository);
        when(order.getId()).thenReturn(5L);
        when(order.getTotalAmount()).thenReturn(new BigDecimal("100.00"));
        when(salesOrderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));
        when(salesReturnRepository.totalReturnedValue(5L)).thenReturn(new BigDecimal("30.00"));
        when(paymentRepository.calculateNetCollectedAmountBySalesOrderId(5L))
                .thenReturn(new BigDecimal("69.00"));

        Payment payment = new Payment();
        payment.setStatus("PAID");
        payment.setAmount(new BigDecimal("2.00"));
        payment.setSalesOrder(order);

        assertThrows(RuntimeException.class, () -> service.createPayment(payment));

        verify(paymentRepository, never()).save(any(Payment.class));
    }
}
