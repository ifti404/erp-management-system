package com.ifti.erp.service;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.entity.Payment;
import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.repository.PaymentRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import com.ifti.erp.repository.PurchaseOrderRepository;
import com.ifti.erp.repository.SalesReturnRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    public record OrderParty(String name) {}
    public record UnpaidOrder(Long id, BigDecimal totalAmount, BigDecimal amountDue, OrderParty customer, OrderParty supplier) {}

    private final PaymentRepository paymentRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditService auditService;
    private final SalesReturnRepository salesReturnRepository;
    private final AccountService accountService;

    public PaymentService(
            PaymentRepository paymentRepository,
            SalesOrderRepository salesOrderRepository,
            PurchaseOrderRepository purchaseOrderRepository, AuditService auditService,
            SalesReturnRepository salesReturnRepository, AccountService accountService) {

        this.paymentRepository = paymentRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditService = auditService;
        this.salesReturnRepository = salesReturnRepository;
        this.accountService = accountService;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    @Transactional
    public Payment createPayment(Payment payment) {

        payment.setStatus(payment.getStatus().toUpperCase());
        validateManualPaymentStatus(payment.getStatus());

        if (payment.getSalesOrder() == null
                && payment.getPurchaseOrder() == null) {

            throw new RuntimeException(
                    "Payment must belong to a sales order or purchase order"
            );
        }

        if (payment.getSalesOrder() != null
                && payment.getPurchaseOrder() != null) {

            throw new RuntimeException(
                    "Payment cannot belong to both sales order and purchase order"
            );
        }

        if ("PAID".equals(payment.getStatus())) {

            if (payment.getSalesOrder() != null) {

                SalesOrder salesOrder = salesOrderRepository.findByIdForUpdate(
                                payment.getSalesOrder().getId()
                        ).orElseThrow(() ->
                                new RuntimeException("Sales order not found")
                        );
                BigDecimal total = salesOrder.getTotalAmount().subtract(salesReturnRepository.totalReturnedValue(salesOrder.getId())).max(BigDecimal.ZERO);

                BigDecimal paid =
                        paymentRepository.calculateNetCollectedAmountBySalesOrderId(
                                payment.getSalesOrder().getId()
                        );

                if (paid.add(payment.getAmount()).compareTo(total) > 0) {
                    throw new RuntimeException(
                            "Payment exceeds the remaining amount"
                    );
                }
            }

            if (payment.getPurchaseOrder() != null) {

                BigDecimal total =
                        purchaseOrderRepository.findByIdForUpdate(
                                payment.getPurchaseOrder().getId()
                        ).orElseThrow(() ->
                                new RuntimeException("Purchase order not found")
                        ).getTotalAmount();

                BigDecimal paid =
                        paymentRepository.calculatePaidAmountByPurchaseOrderId(
                                payment.getPurchaseOrder().getId()
                        );

                if (paid.add(payment.getAmount()).compareTo(total) > 0) {
                    throw new RuntimeException(
                            "Payment exceeds the remaining amount"
                    );
                }
            }
        }

        if ("PAID".equals(payment.getStatus())) payment.setAccount(accountService.requireActive(payment.getAccount() == null ? null : payment.getAccount().getId()));
        else if (payment.getAccount() != null) payment.setAccount(accountService.requireActive(payment.getAccount().getId()));
        Payment saved = paymentRepository.saveAndFlush(payment);
        accountService.recordPayment(saved, currentActor());
        auditService.record("CREATED", "PAYMENT", saved.getId(), paymentDescription(saved));
        return saved;
    }

    @Transactional
    public Payment updatePayment(
        Long id,
        Payment paymentDetails) {

    Payment payment = paymentRepository.findById(id)
            .orElseThrow(() ->
                    new RuntimeException("Payment not found"));
    protectReturnRefund(payment);
    String previous = paymentDescription(payment);

    if (paymentDetails.getSalesOrder() == null
            && paymentDetails.getPurchaseOrder() == null) {

        throw new RuntimeException(
                "Payment must belong to a sales order or purchase order"
        );
    }

    if (paymentDetails.getSalesOrder() != null
            && paymentDetails.getPurchaseOrder() != null) {

        throw new RuntimeException(
                "Payment cannot belong to both sales order and purchase order"
        );
    }

    paymentDetails.setStatus(paymentDetails.getStatus().toUpperCase());
    validateManualPaymentStatus(paymentDetails.getStatus());
    if ("PAID".equals(paymentDetails.getStatus())) {

        if (paymentDetails.getSalesOrder() != null) {

            SalesOrder salesOrder = salesOrderRepository.findByIdForUpdate(
                            paymentDetails.getSalesOrder().getId()
                    ).orElseThrow(() ->
                            new RuntimeException("Sales order not found")
                    );
            BigDecimal total = salesOrder.getTotalAmount().subtract(salesReturnRepository.totalReturnedValue(salesOrder.getId())).max(BigDecimal.ZERO);

            BigDecimal paid =
                    paymentRepository.calculateNetCollectedAmountBySalesOrderId(
                            paymentDetails.getSalesOrder().getId()
                    );

            // If editing the same payment, remove its old amount
            // from the paid total before checking the new amount.
            if (payment.getSalesOrder() != null
                    && payment.getSalesOrder().getId()
                    .equals(paymentDetails.getSalesOrder().getId())
                    && "PAID".equals(payment.getStatus())) {

                paid = paid.subtract(payment.getAmount());
            }

            if (paid.add(paymentDetails.getAmount()).compareTo(total) > 0) {
                throw new RuntimeException(
                        "Payment exceeds the remaining amount"
                );
            }
        }

        if (paymentDetails.getPurchaseOrder() != null) {

            BigDecimal total =
                    purchaseOrderRepository.findByIdForUpdate(
                            paymentDetails.getPurchaseOrder().getId()
                    ).orElseThrow(() ->
                            new RuntimeException("Purchase order not found")
                    ).getTotalAmount();

            BigDecimal paid =
                    paymentRepository.calculatePaidAmountByPurchaseOrderId(
                            paymentDetails.getPurchaseOrder().getId()
                    );

            if (payment.getPurchaseOrder() != null
                    && payment.getPurchaseOrder().getId()
                    .equals(paymentDetails.getPurchaseOrder().getId())
                    && "PAID".equals(payment.getStatus())) {

                paid = paid.subtract(payment.getAmount());
            }

            if (paid.add(paymentDetails.getAmount()).compareTo(total) > 0) {
                throw new RuntimeException(
                        "Payment exceeds the remaining amount"
                );
            }
        }
    }

    payment.setPaymentDate(paymentDetails.getPaymentDate());
    payment.setAmount(paymentDetails.getAmount());
    payment.setPaymentMethod(paymentDetails.getPaymentMethod());
    payment.setStatus(paymentDetails.getStatus());
    payment.setSalesOrder(paymentDetails.getSalesOrder());
    payment.setPurchaseOrder(paymentDetails.getPurchaseOrder());
    payment.setNotes(paymentDetails.getNotes());
    if (paymentDetails.getAccount() != null) payment.setAccount(accountService.requireActive(paymentDetails.getAccount().getId()));
    else if ("PAID".equals(paymentDetails.getStatus())) throw new IllegalArgumentException("Choose the account used for this payment");
    else payment.setAccount(null);

    Payment saved = paymentRepository.saveAndFlush(payment);
    accountService.recordPayment(saved, currentActor());
    auditService.record("UPDATED", "PAYMENT", id, previous + " -> " + paymentDescription(saved));
    return saved;
}
    public List<UnpaidOrder> getUnpaidSalesOrders() {

    List<SalesOrder> orders = salesOrderRepository.findAll();

    return orders.stream()
            .filter(order -> {

                BigDecimal paid =
                        paymentRepository.calculateNetCollectedAmountBySalesOrderId(
                                order.getId()
                        );
                BigDecimal netTotal = order.getTotalAmount().subtract(salesReturnRepository.totalReturnedValue(order.getId())).max(BigDecimal.ZERO);
                return paid.compareTo(netTotal) < 0;
            })
            .map(order -> new UnpaidOrder(order.getId(), order.getTotalAmount(), order.getTotalAmount()
                    .subtract(salesReturnRepository.totalReturnedValue(order.getId()))
                    .subtract(paymentRepository.calculateNetCollectedAmountBySalesOrderId(order.getId())).max(BigDecimal.ZERO),
                    new OrderParty(order.getCustomer().getName()), null))
            .toList();
}
public List<UnpaidOrder> getUnpaidPurchaseOrders() {

    List<PurchaseOrder> orders = purchaseOrderRepository.findAll();

    return orders.stream()
            .filter(order -> {

                BigDecimal paid =
                        paymentRepository.calculatePaidAmountByPurchaseOrderId(
                                order.getId()
                        );

                return paid.compareTo(order.getTotalAmount()) < 0;
            })
            .map(order -> new UnpaidOrder(order.getId(), order.getTotalAmount(), order.getTotalAmount()
                    .subtract(paymentRepository.calculatePaidAmountByPurchaseOrderId(order.getId())).max(BigDecimal.ZERO),
                    null, new OrderParty(order.getSupplier().getName())))
            .toList();
}

    @Transactional
    public void deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        protectReturnRefund(payment);
        auditService.record("DELETED", "PAYMENT", id, paymentDescription(payment));
        accountService.removeLinkedEntry("PAYMENT", id);
        paymentRepository.deleteById(id);
    }

    private void protectReturnRefund(Payment payment) {
        if ("REFUNDED".equalsIgnoreCase(payment.getStatus())
                && payment.getNotes() != null
                && payment.getNotes().startsWith("Refund for sales return #")) {
            throw new IllegalArgumentException("This refund is linked to a sales return and cannot be edited or deleted here");
        }
    }

    private void validateManualPaymentStatus(String status) {
        if (!List.of("PENDING", "PAID", "FAILED").contains(status)) {
            throw new IllegalArgumentException("Refund payments are recorded through the sales returns page");
        }
    }

    private String paymentDescription(Payment payment) {
        String order = payment.getSalesOrder() != null ? "sales order #" + payment.getSalesOrder().getId()
                : payment.getPurchaseOrder() != null ? "purchase order #" + payment.getPurchaseOrder().getId() : "unlinked";
        return order + ", amount=" + payment.getAmount() + ", status=" + payment.getStatus() + ", method=" + payment.getPaymentMethod();
    }
    private String currentActor() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return authentication == null || !authentication.isAuthenticated() ? "SYSTEM" : authentication.getName();
    }
}
