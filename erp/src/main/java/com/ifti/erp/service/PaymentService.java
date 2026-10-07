package com.ifti.erp.service;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.entity.Payment;
import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.repository.PaymentRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import com.ifti.erp.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            SalesOrderRepository salesOrderRepository,
            PurchaseOrderRepository purchaseOrderRepository) {

        this.paymentRepository = paymentRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    public Payment createPayment(Payment payment) {

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

                BigDecimal total =
                        salesOrderRepository.findById(
                                payment.getSalesOrder().getId()
                        ).orElseThrow(() ->
                                new RuntimeException("Sales order not found")
                        ).getTotalAmount();

                BigDecimal paid =
                        paymentRepository.calculatePaidAmountBySalesOrderId(
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
                        purchaseOrderRepository.findById(
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

        return paymentRepository.save(payment);
    }

    public Payment updatePayment(
        Long id,
        Payment paymentDetails) {

    Payment payment = paymentRepository.findById(id)
            .orElseThrow(() ->
                    new RuntimeException("Payment not found"));

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

    if ("PAID".equals(paymentDetails.getStatus())) {

        if (paymentDetails.getSalesOrder() != null) {

            BigDecimal total =
                    salesOrderRepository.findById(
                            paymentDetails.getSalesOrder().getId()
                    ).orElseThrow(() ->
                            new RuntimeException("Sales order not found")
                    ).getTotalAmount();

            BigDecimal paid =
                    paymentRepository.calculatePaidAmountBySalesOrderId(
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
                    purchaseOrderRepository.findById(
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

    return paymentRepository.save(payment);
}
    public List<SalesOrder> getUnpaidSalesOrders() {

    List<SalesOrder> orders = salesOrderRepository.findAll();

    return orders.stream()
            .filter(order -> {

                BigDecimal paid =
                        paymentRepository.calculatePaidAmountBySalesOrderId(
                                order.getId()
                        );

                return paid.compareTo(order.getTotalAmount()) < 0;
            })
            .toList();
}
public List<PurchaseOrder> getUnpaidPurchaseOrders() {

    List<PurchaseOrder> orders = purchaseOrderRepository.findAll();

    return orders.stream()
            .filter(order -> {

                BigDecimal paid =
                        paymentRepository.calculatePaidAmountByPurchaseOrderId(
                                order.getId()
                        );

                return paid.compareTo(order.getTotalAmount()) < 0;
            })
            .toList();
}

    public void deletePayment(Long id) {
        paymentRepository.deleteById(id);
    }
}