package com.ifti.erp.service;

import com.ifti.erp.entity.Product;
import com.ifti.erp.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

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
        productRepository.deleteById(id);
    }
}