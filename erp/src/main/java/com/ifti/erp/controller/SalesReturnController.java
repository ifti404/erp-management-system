package com.ifti.erp.controller;

import com.ifti.erp.dto.SalesReturnRequest;
import com.ifti.erp.dto.SalesReturnResponse;
import com.ifti.erp.service.SalesReturnService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sales-returns")
public class SalesReturnController {
    private final SalesReturnService service;
    public SalesReturnController(SalesReturnService service) { this.service = service; }

    @GetMapping
    public List<SalesReturnResponse> list(@RequestParam(required = false) Long salesOrderId) {
        return service.list(salesOrderId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalesReturnResponse create(@Valid @RequestBody SalesReturnRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/settlement")
    public SalesReturnResponse completeSettlement(@PathVariable Long id) {
        return service.completeSettlement(id);
    }
}
