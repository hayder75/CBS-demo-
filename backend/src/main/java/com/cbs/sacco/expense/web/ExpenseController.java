package com.cbs.sacco.expense.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.expense.entity.ExpenseCategory;
import com.cbs.sacco.expense.entity.ExpenseEntry;
import com.cbs.sacco.expense.repo.ExpenseCategoryRepository;
import com.cbs.sacco.expense.repo.ExpenseEntryRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseCategoryRepository categoryRepository;
    private final ExpenseEntryRepository entryRepository;

    public ExpenseController(ExpenseCategoryRepository categoryRepository,
                             ExpenseEntryRepository entryRepository) {
        this.categoryRepository = categoryRepository;
        this.entryRepository = entryRepository;
    }

    @GetMapping("/categories")
    public List<ExpenseCategory> listCategories() {
        return categoryRepository.findAll();
    }

    @PostMapping("/categories")
    public ExpenseCategory createCategory(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        String glAccountCode = str(body, "glAccountCode");
        if (code == null || code.isBlank()) throw new IllegalArgumentException("Category code is required");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Category name is required");
        if (glAccountCode == null || glAccountCode.isBlank()) {
            throw new IllegalArgumentException("GL account code is required");
        }
        if (categoryRepository.existsByCodeIgnoreCase(code.trim())) {
            throw new IllegalArgumentException("Expense category code " + code.trim() + " already exists");
        }
        ExpenseCategory category = new ExpenseCategory();
        category.setCode(code.trim());
        category.setName(name.trim());
        category.setGlAccountCode(glAccountCode.trim());
        category.setStatus("Pending");
        return categoryRepository.save(category);
    }

    @PostMapping("/categories/{id}/verify")
    public ExpenseCategory verifyCategory(@PathVariable Long id) {
        ExpenseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Expense category not found: " + id));
        if ("Verified".equals(category.getStatus())) {
            throw new IllegalArgumentException("Expense category is already verified");
        }
        category.setStatus("Verified");
        return categoryRepository.save(category);
    }

    @GetMapping
    public List<ExpenseEntry> list() {
        return entryRepository.findAll();
    }

    @PostMapping
    public ExpenseEntry create(@RequestBody Map<String, Object> body) {
        BigDecimal amount = dec(body, "amount");
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        Long categoryId = lng(body, "categoryId");
        if (categoryId == null) throw new IllegalArgumentException("Expense category not found");
        ExpenseCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Expense category not found"));
        if (!"Verified".equals(category.getStatus())) {
            throw new IllegalArgumentException("Expense category must be verified before posting");
        }
        String description = str(body, "description");
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }

        ExpenseEntry entry = new ExpenseEntry();
        entry.setDate(parseDate(str(body, "date")));
        entry.setCategoryId(category.getId());
        entry.setCategoryName(category.getName());
        entry.setDescription(description.trim());
        entry.setAmount(amount);
        entry.setPaymentMode(str(body, "paymentMode") != null ? str(body, "paymentMode") : "Cash");
        entry.setGlAccountCode(category.getGlAccountCode());
        entry.setPostedBy(str(body, "postedBy") != null ? str(body, "postedBy") : "Kaleab Desta");
        entry.setStatus("Posted");
        return entryRepository.save(entry);
    }

    @PostMapping("/{id}/reverse")
    public ExpenseEntry reverse(@PathVariable Long id) {
        ExpenseEntry entry = entryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Expense entry not found: " + id));
        if (!"Posted".equals(entry.getStatus())) {
            throw new IllegalArgumentException(
                    "Only posted entries can be reversed (current: " + entry.getStatus() + ")");
        }
        entry.setStatus("Reversed");
        return entryRepository.save(entry);
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("date must be in YYYY-MM-DD format");
        }
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static Long lng(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.longValue() : Long.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static BigDecimal dec(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? new BigDecimal(n.toString()) : new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }
}
