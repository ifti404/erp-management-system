package com.ifti.erp.service;

import com.ifti.erp.entity.Payment;
import com.ifti.erp.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
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

    payment.setPaymentDate(paymentDetails.getPaymentDate());
    payment.setAmount(paymentDetails.getAmount());
    payment.setPaymentMethod(paymentDetails.getPaymentMethod());
    payment.setStatus(paymentDetails.getStatus());
    payment.setSalesOrder(paymentDetails.getSalesOrder());
    payment.setPurchaseOrder(paymentDetails.getPurchaseOrder());
    payment.setNotes(paymentDetails.getNotes());

    return paymentRepository.save(payment);
}

    public void deletePayment(Long id) {
        paymentRepository.deleteById(id);
    }
}