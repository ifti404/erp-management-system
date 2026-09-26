package com.ifti.erp.service;

import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.repository.SalesItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SalesItemService {

    private final SalesItemRepository salesItemRepository;

    public SalesItemService(SalesItemRepository salesItemRepository) {
        this.salesItemRepository = salesItemRepository;
    }

    public List<SalesItem> getAllSalesItems() {
        return salesItemRepository.findAll();
    }

    public Optional<SalesItem> getSalesItemById(Long id) {
        return salesItemRepository.findById(id);
    }

    public SalesItem createSalesItem(SalesItem salesItem) {
        return salesItemRepository.save(salesItem);
    }

    public SalesItem updateSalesItem(
            Long id,
            SalesItem salesItemDetails) {

        SalesItem salesItem = salesItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales item not found"));

        salesItem.setSalesOrder(salesItemDetails.getSalesOrder());
        salesItem.setProduct(salesItemDetails.getProduct());
        salesItem.setQuantity(salesItemDetails.getQuantity());
        salesItem.setUnitPrice(salesItemDetails.getUnitPrice());
        salesItem.setSubtotal(salesItemDetails.getSubtotal());

        return salesItemRepository.save(salesItem);
    }

    public void deleteSalesItem(Long id) {
        salesItemRepository.deleteById(id);
    }
}