package com.ifti.erp.service;

import com.ifti.erp.entity.AccountEntry;
import com.ifti.erp.entity.FinancialAccount;
import com.ifti.erp.entity.InternalTransfer;
import com.ifti.erp.entity.Payment;
import com.ifti.erp.entity.Expense;
import com.ifti.erp.repository.AccountEntryRepository;
import com.ifti.erp.repository.FinancialAccountRepository;
import com.ifti.erp.repository.InternalTransferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountService {
    public record AccountSummary(Long id, String name, String accountType, String currencyCode,
            BigDecimal openingBalance, BigDecimal balance, boolean active, LocalDateTime createdAt) {}
    public record EntryView(Long id, Long accountId, String accountName, String currencyCode,
            LocalDateTime entryDate, String entryType, String direction, BigDecimal amount,
            String description, String reference, String sourceType, Long sourceId) {}
    public record AccountDraft(String name, String accountType, String currencyCode,
            BigDecimal openingBalance, Boolean active) {}
    public record TransferRequest(Long fromAccountId, Long toAccountId, LocalDateTime transferDate,
            BigDecimal amount, String reference, String notes) {}
    public record ManualEntryRequest(LocalDateTime entryDate, String entryType, BigDecimal amount,
            String description, String reference) {}

    private static final List<String> ACCOUNT_TYPES = List.of("CASH", "BANK", "MOBILE_WALLET", "OTHER");
    private final FinancialAccountRepository accounts;
    private final AccountEntryRepository entries;
    private final InternalTransferRepository transfers;
    private final AuditService audit;

    public AccountService(FinancialAccountRepository accounts, AccountEntryRepository entries,
            InternalTransferRepository transfers, AuditService audit) {
        this.accounts = accounts; this.entries = entries; this.transfers = transfers; this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<AccountSummary> listAccounts() {
        return accounts.findAll(org.springframework.data.domain.Sort.by("name")).stream().map(this::summary).toList();
    }

    @Transactional(readOnly = true)
    public List<EntryView> listEntries(Long accountId, LocalDate from, LocalDate to) {
        var records = accountId == null ? entries.findAllByOrderByEntryDateDescIdDesc() : entries.findByAccountIdOrderByEntryDateDescIdDesc(accountId);
        var result = new java.util.ArrayList<EntryView>();
        records.stream().filter(entry -> from == null || !entry.getEntryDate().toLocalDate().isBefore(from))
                .filter(entry -> to == null || !entry.getEntryDate().toLocalDate().isAfter(to))
                .map(this::view).forEach(result::add);
        var openingRows = accounts.findAll().stream().filter(account -> (accountId == null || accountId.equals(account.getId()))
                && account.getOpeningBalance().signum() > 0
                && (from == null || !account.getCreatedAt().toLocalDate().isBefore(from))
                && (to == null || !account.getCreatedAt().toLocalDate().isAfter(to)))
                .map(account -> new EntryView(-account.getId(), account.getId(), account.getName(), account.getCurrencyCode(),
                        account.getCreatedAt(), "OPENING", "IN", account.getOpeningBalance(), "Opening balance", null, "OPENING", account.getId())).toList();
        result.addAll(openingRows);
        result.sort(java.util.Comparator.comparing(EntryView::entryDate, java.util.Comparator.reverseOrder())
                .thenComparing(EntryView::id, java.util.Comparator.reverseOrder()));
        return result;
    }

    @Transactional
    public AccountSummary createAccount(AccountDraft draft) {
        validateDraft(draft);
        String name = draft.name().trim();
        if (accounts.existsByNameIgnoreCase(name)) throw new IllegalArgumentException("An account with this name already exists");
        FinancialAccount account = new FinancialAccount();
        applyDraft(account, draft);
        account.setCreatedAt(LocalDateTime.now());
        account.setActive(draft.active() == null || draft.active());
        FinancialAccount saved = accounts.save(account);
        audit.record("CREATED", "FINANCIAL_ACCOUNT", saved.getId(), "name=" + saved.getName() + ", type=" + saved.getAccountType());
        return summary(saved);
    }

    @Transactional
    public AccountSummary updateAccount(Long id, AccountDraft draft) {
        validateDraft(draft);
        FinancialAccount account = accounts.findById(id).orElseThrow(() -> new IllegalArgumentException("Account not found"));
        String name = draft.name().trim();
        if (!account.getName().equalsIgnoreCase(name) && accounts.existsByNameIgnoreCase(name)) throw new IllegalArgumentException("An account with this name already exists");
        applyDraft(account, draft);
        if (draft.active() != null) account.setActive(draft.active());
        FinancialAccount saved = accounts.save(account);
        audit.record("UPDATED", "FINANCIAL_ACCOUNT", id, "name=" + saved.getName() + ", active=" + saved.isActive());
        return summary(saved);
    }

    public FinancialAccount requireActive(Long id) {
        if (id == null) throw new IllegalArgumentException("Choose the account used for this transaction");
        return accounts.findById(id).filter(FinancialAccount::isActive).orElseThrow(() -> new IllegalArgumentException("Choose an active financial account"));
    }

    public FinancialAccount requireExisting(Long id) {
        if (id == null) throw new IllegalArgumentException("Choose the account used for this transaction");
        return accounts.findById(id).orElseThrow(() -> new IllegalArgumentException("Financial account not found"));
    }

    @Transactional
    public void recordPayment(Payment payment, String actor) {
        if (!"PAID".equalsIgnoreCase(payment.getStatus()) && !"REFUNDED".equalsIgnoreCase(payment.getStatus())) {
            entries.deleteBySourceTypeAndSourceId("PAYMENT", payment.getId());
            return;
        }
        FinancialAccount account = payment.getAccount() == null ? null : requireExisting(payment.getAccount().getId());
        if (account == null) throw new IllegalArgumentException("Choose the account receiving or paying this payment");
        boolean refund = "REFUNDED".equalsIgnoreCase(payment.getStatus());
        String direction = !refund && payment.getSalesOrder() != null ? "IN" : "OUT";
        String orderRef = payment.getSalesOrder() != null ? payment.getSalesOrder().getTransactionId()
                : payment.getPurchaseOrder() != null ? payment.getPurchaseOrder().getTransactionId() : null;
        String description = refund ? "Customer refund" : payment.getSalesOrder() != null ? "Sales receipt" : "Supplier payment";
        if (orderRef != null) description += " · " + orderRef;
        upsertEntry("PAYMENT", payment.getId(), "MAIN", account, payment.getPaymentDate(), refund ? "REFUND" : "PAYMENT",
                direction, payment.getAmount(), description, payment.getNotes(), actor);
    }

    @Transactional
    public void recordExpense(Expense expense, String actor) {
        FinancialAccount account = requireExisting(expense.getAccount().getId());
        if (!account.isActive()) throw new IllegalArgumentException("Choose an active financial account");
        LocalDateTime date = expense.getExpenseDate().atStartOfDay();
        String description = "Expense · " + expense.getCategory().getName();
        upsertEntry("EXPENSE", expense.getId(), "MAIN", account, date, "EXPENSE", "OUT", expense.getAmount(),
                description, expense.getReference(), actor);
    }

    @Transactional
    public void removeLinkedEntry(String sourceType, Long sourceId) { entries.deleteBySourceTypeAndSourceId(sourceType, sourceId); }

    @Transactional
    public InternalTransfer createTransfer(TransferRequest request, String actor) {
        if (request == null || request.fromAccountId() == null || request.toAccountId() == null) throw new IllegalArgumentException("Choose both accounts for the transfer");
        if (request.fromAccountId().equals(request.toAccountId())) throw new IllegalArgumentException("Transfer accounts must be different");
        if (request.amount() == null || request.amount().signum() <= 0 || request.amount().scale() > 2) throw new IllegalArgumentException("Transfer amount must be greater than zero with up to 2 decimals");
        FinancialAccount from = requireActive(request.fromAccountId()); FinancialAccount to = requireActive(request.toAccountId());
        if (!from.getCurrencyCode().equals(to.getCurrencyCode())) throw new IllegalArgumentException("Transfer accounts must use the same currency");
        InternalTransfer transfer = new InternalTransfer();
        transfer.setFromAccount(from); transfer.setToAccount(to); transfer.setAmount(request.amount());
        transfer.setTransferDate(request.transferDate() == null ? LocalDateTime.now() : request.transferDate());
        transfer.setReference(clean(request.reference(), 100)); transfer.setNotes(clean(request.notes(), 255));
        transfer.setCreatedAt(LocalDateTime.now()); transfer.setCreatedBy(actor);
        transfer = transfers.saveAndFlush(transfer);
        String note = clean(request.notes(), 255);
        upsertEntry("TRANSFER", transfer.getId(), "OUT", from, transfer.getTransferDate(), "TRANSFER", "OUT", transfer.getAmount(),
                "Transfer to " + to.getName(), note, actor);
        upsertEntry("TRANSFER", transfer.getId(), "IN", to, transfer.getTransferDate(), "TRANSFER", "IN", transfer.getAmount(),
                "Transfer from " + from.getName(), note, actor);
        audit.record("TRANSFERRED", "FINANCIAL_ACCOUNT", transfer.getId(), from.getName() + " -> " + to.getName() + ", amount=" + transfer.getAmount());
        return transfer;
    }

    @Transactional
    public EntryView createManualEntry(Long accountId, ManualEntryRequest request, String actor) {
        FinancialAccount account = requireActive(accountId);
        if (request == null || request.amount() == null || request.amount().signum() <= 0 || request.amount().scale() > 2)
            throw new IllegalArgumentException("Amount must be greater than zero with up to 2 decimals");
        if (request.entryType() == null || !List.of("OTHER_INCOME", "OTHER_EXPENSE").contains(request.entryType()))
            throw new IllegalArgumentException("Choose other income or other expense");
        if (request.description() == null || request.description().isBlank()) throw new IllegalArgumentException("Description is required");
        AccountEntry entry = new AccountEntry();
        entry.setAccount(account); entry.setEntryDate(request.entryDate() == null ? LocalDateTime.now() : request.entryDate());
        entry.setEntryType(request.entryType()); entry.setDirection("OTHER_INCOME".equals(request.entryType()) ? "IN" : "OUT");
        entry.setAmount(request.amount()); entry.setDescription(clean(request.description(), 180)); entry.setReference(clean(request.reference(), 100));
        entry.setSourceType("OTHER"); entry.setSourceId(null); entry.setEntryLeg("MAIN"); entry.setCreatedAt(LocalDateTime.now()); entry.setCreatedBy(actor);
        entry = entries.saveAndFlush(entry);
        entry.setSourceId(entry.getId()); entry = entries.save(entry);
        audit.record("CREATED", "ACCOUNT_ENTRY", entry.getId(), entry.getEntryType() + ", account=" + account.getName() + ", amount=" + entry.getAmount());
        return view(entry);
    }

    private void upsertEntry(String sourceType, Long sourceId, String leg, FinancialAccount account,
            LocalDateTime date, String type, String direction, BigDecimal amount, String description,
            String reference, String actor) {
        AccountEntry entry = entries.findBySourceTypeAndSourceIdAndEntryLeg(sourceType, sourceId, leg).orElseGet(AccountEntry::new);
        entry.setAccount(account); entry.setEntryDate(date); entry.setEntryType(type); entry.setDirection(direction);
        entry.setAmount(amount); entry.setDescription(clean(description, 180)); entry.setReference(clean(reference, 100));
        entry.setSourceType(sourceType); entry.setSourceId(sourceId); entry.setEntryLeg(leg);
        if (entry.getCreatedAt() == null) { entry.setCreatedAt(LocalDateTime.now()); entry.setCreatedBy(actor == null ? "SYSTEM" : actor); }
        entries.save(entry);
    }

    private AccountSummary summary(FinancialAccount account) {
        BigDecimal movement = entries.signedTotalForAccount(account.getId());
        return new AccountSummary(account.getId(), account.getName(), account.getAccountType(), account.getCurrencyCode(),
                account.getOpeningBalance(), account.getOpeningBalance().add(movement), account.isActive(), account.getCreatedAt());
    }
    private EntryView view(AccountEntry entry) {
        return new EntryView(entry.getId(), entry.getAccount().getId(), entry.getAccount().getName(), entry.getAccount().getCurrencyCode(),
                entry.getEntryDate(), entry.getEntryType(), entry.getDirection(), entry.getAmount(), entry.getDescription(),
                entry.getReference(), entry.getSourceType(), entry.getSourceId());
    }
    private void validateDraft(AccountDraft draft) {
        if (draft == null || draft.name() == null || draft.name().isBlank() || draft.name().trim().length() > 100) throw new IllegalArgumentException("Account name is required and must be 100 characters or fewer");
        if (draft.accountType() == null || !ACCOUNT_TYPES.contains(draft.accountType().toUpperCase(java.util.Locale.ROOT))) throw new IllegalArgumentException("Choose a supported account type");
        if (draft.currencyCode() == null || !draft.currencyCode().matches("[A-Za-z]{3}")) throw new IllegalArgumentException("Currency must be a 3-letter code");
        if (draft.openingBalance() == null || draft.openingBalance().signum() < 0 || draft.openingBalance().scale() > 2) throw new IllegalArgumentException("Opening balance must be zero or greater with up to 2 decimals");
    }
    private void applyDraft(FinancialAccount account, AccountDraft draft) {
        account.setName(draft.name().trim()); account.setAccountType(draft.accountType().toUpperCase(java.util.Locale.ROOT));
        account.setCurrencyCode(draft.currencyCode().toUpperCase(java.util.Locale.ROOT)); account.setOpeningBalance(draft.openingBalance());
    }
    private String clean(String value, int max) { if (value == null || value.isBlank()) return null; return value.trim().substring(0, Math.min(value.trim().length(), max)); }
}
