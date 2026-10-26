package com.ifti.erp.controller;

import com.ifti.erp.entity.InternalTransfer;
import com.ifti.erp.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    public record TransferView(Long id, Long fromAccountId, String fromAccountName,
            Long toAccountId, String toAccountName, java.math.BigDecimal amount,
            java.time.LocalDateTime transferDate, String reference, String notes, String createdBy) {
        static TransferView from(InternalTransfer transfer) {
            return new TransferView(transfer.getId(), transfer.getFromAccount().getId(), transfer.getFromAccount().getName(),
                    transfer.getToAccount().getId(), transfer.getToAccount().getName(), transfer.getAmount(),
                    transfer.getTransferDate(), transfer.getReference(), transfer.getNotes(), transfer.getCreatedBy());
        }
    }
    private final AccountService service;
    private final com.ifti.erp.repository.InternalTransferRepository transfers;
    public AccountController(AccountService service, com.ifti.erp.repository.InternalTransferRepository transfers) { this.service = service; this.transfers = transfers; }

    @GetMapping public List<AccountService.AccountSummary> accounts() { return service.listAccounts(); }
    @PostMapping public AccountService.AccountSummary create(@RequestBody AccountService.AccountDraft draft) { return service.createAccount(draft); }
    @PutMapping("/{id}") public AccountService.AccountSummary update(@PathVariable Long id, @RequestBody AccountService.AccountDraft draft) { return service.updateAccount(id, draft); }
    @GetMapping("/entries") public List<AccountService.EntryView> entries(@RequestParam(required = false) Long accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.listEntries(accountId, from, to);
    }
    @GetMapping("/transfers") public List<TransferView> transfers() {
        return transfers.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "transferDate", "id")).stream().map(TransferView::from).toList();
    }
    @PostMapping("/transfers") public TransferView transfer(@RequestBody AccountService.TransferRequest request, Authentication authentication) {
        return TransferView.from(service.createTransfer(request, authentication.getName()));
    }
    @PostMapping("/{id}/entries") public AccountService.EntryView manualEntry(@PathVariable Long id,
            @RequestBody AccountService.ManualEntryRequest request, Authentication authentication) {
        return service.createManualEntry(id, request, authentication.getName());
    }
}
