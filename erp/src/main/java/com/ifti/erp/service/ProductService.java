package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.Product;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public ProductService(
            ProductRepository productRepository,
            InventoryRepository inventoryRepository) {

        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product createProduct(Product product) {

        Product savedProduct =
                productRepository.save(product);

        Inventory inventory = new Inventory();

        inventory.setProduct(savedProduct);
        inventory.setQuantity(0);
        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        return savedProduct;
    }

    public Product updateProduct(
            Long id,
            Product productDetails) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found"));

        product.setSku(productDetails.getSku());
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setUnitCost(productDetails.getUnitCost());
        product.setSellingPrice(productDetails.getSellingPrice());
        product.setReorderLevel(productDetails.getReorderLevel());
        product.setStatus(productDetails.getStatus());
        product.setCategory(productDetails.getCategory());
        product.setSupplier(productDetails.getSupplier());

        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
    Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));

    inventoryRepository.findByProductId(id)
            .ifPresent(inventoryRepository::delete);

    productRepository.delete(product);
}
}