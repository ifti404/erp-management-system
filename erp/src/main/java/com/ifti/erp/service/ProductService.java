package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.Product;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.InventoryMovementRepository;
import com.ifti.erp.repository.ProductRepository;
import com.ifti.erp.repository.PurchaseItemRepository;
import com.ifti.erp.repository.SalesItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final SalesItemRepository salesItemRepository;
    private final AuditService auditService;

    public ProductService(
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            InventoryMovementRepository movementRepository,
            PurchaseItemRepository purchaseItemRepository,
            SalesItemRepository salesItemRepository, AuditService auditService) {

        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.salesItemRepository = salesItemRepository;
        this.auditService = auditService;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Transactional
    public Product createProduct(Product product) {

        Product savedProduct =
                productRepository.save(product);

        Inventory inventory = new Inventory();

        inventory.setProduct(savedProduct);
        inventory.setQuantity(0);
        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        auditService.record("CREATED", "PRODUCT", savedProduct.getId(), "sku=" + savedProduct.getSku() + ", name=" + savedProduct.getName());

        return savedProduct;
    }

    @Transactional
    public Product updateProduct(
            Long id,
            Product productDetails) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found"));

        String previous = "sku=" + product.getSku() + ", name=" + product.getName() + ", selling price=" + product.getSellingPrice();
        product.setSku(productDetails.getSku());
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setUnitCost(productDetails.getUnitCost());
        product.setSellingPrice(productDetails.getSellingPrice());
        product.setReorderLevel(productDetails.getReorderLevel());
        product.setStatus(productDetails.getStatus());
        product.setCategory(productDetails.getCategory());
        product.setSupplier(productDetails.getSupplier());

        Product saved = productRepository.save(product);
        auditService.record("UPDATED", "PRODUCT", id, previous + " -> sku=" + saved.getSku() + ", name=" + saved.getName() + ", selling price=" + saved.getSellingPrice());
        return saved;
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (movementRepository.existsByProductId(id)) {
            throw new RuntimeException("Products with stock history cannot be deleted");
        }

        if (purchaseItemRepository.existsByProductId(id)
                || salesItemRepository.existsByProductId(id)) {
            throw new RuntimeException("Products used in orders cannot be deleted; mark them inactive instead");
        }

        if (inventoryRepository.findByProductId(id)
                .map(inventory -> inventory.getQuantity() > 0)
                .orElse(false)) {
            throw new RuntimeException("Products with stock on hand cannot be deleted");
        }

        inventoryRepository.findByProductId(id)
                .ifPresent(inventoryRepository::delete);

        auditService.record("DELETED", "PRODUCT", id, "sku=" + product.getSku() + ", name=" + product.getName());
        productRepository.delete(product);
}
}
