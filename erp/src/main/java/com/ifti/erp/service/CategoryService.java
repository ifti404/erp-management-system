<<<<<<< HEAD
package com.ifti.erp.service;

import com.ifti.erp.entity.Category;
import com.ifti.erp.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final AuditService auditService;

    public CategoryService(CategoryRepository categoryRepository, AuditService auditService) {
        this.categoryRepository = categoryRepository;
        this.auditService = auditService;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    @Transactional
    public Category createCategory(Category category) {
        Category saved = categoryRepository.save(category);
        auditService.record("CREATED", "CATEGORY", saved.getId(), "name=" + saved.getName());
        return saved;
    }

    @Transactional
    public Category updateCategory(Long id, Category categoryDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setName(categoryDetails.getName());
        category.setDescription(categoryDetails.getDescription());

        Category saved = categoryRepository.save(category);
        auditService.record("UPDATED", "CATEGORY", id, "name=" + saved.getName());
        return saved;
    }

    @Transactional
    public void deleteCategory(Long id) {
        String name = categoryRepository.findById(id).map(Category::getName).orElse("unknown");
        auditService.record("DELETED", "CATEGORY", id, "name=" + name);
        categoryRepository.deleteById(id);
    }
}
=======
package com.ifti.erp.service;

import com.ifti.erp.entity.Category;
import com.ifti.erp.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category categoryDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setName(categoryDetails.getName());
        category.setDescription(categoryDetails.getDescription());

        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
>>>>>>> edc71aefa89594cf9040eba79f454355b029bdec
