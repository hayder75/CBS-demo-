package com.cbs.sacco.producttype.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.producttype.entity.ProductType;
import com.cbs.sacco.producttype.repo.ProductTypeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product-types")
public class ProductTypeController {

    private final ProductTypeRepository repo;

    public ProductTypeController(ProductTypeRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<ProductType> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ProductType get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Product type not found: " + id));
    }

    @PostMapping
    public ProductType create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        if (repo.existsByCode(code)) throw new IllegalArgumentException("product code exists: " + code);
        ProductType p = new ProductType();
        p.setCode(code);
        p.setName(name);
        p.setCategory(str(body, "category") == null ? "Saving" : str(body, "category"));
        p.setDescription(str(body, "description"));
        p.setStatus("Pending");
        return repo.save(p);
    }

    @PostMapping("/{id}/verify")
    public ProductType verify(@PathVariable Long id) {
        ProductType p = get(id);
        p.setStatus("Verified");
        return repo.save(p);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
