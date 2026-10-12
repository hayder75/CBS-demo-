package com.cbs.sacco.holiday.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.holiday.entity.Holiday;
import com.cbs.sacco.holiday.repo.HolidayRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayRepository repo;

    public HolidayController(HolidayRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Holiday> list(@RequestParam(required = false) String from,
                              @RequestParam(required = false) String to) {
        if (from != null && to != null) {
            return repo.findByHolidayDateBetweenOrderByHolidayDateAsc(LocalDate.parse(from), LocalDate.parse(to));
        }
        return repo.findAllByOrderByHolidayDateAsc();
    }

    @GetMapping("/{id}")
    public Holiday get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Holiday not found: " + id));
    }

    @PostMapping
    public Holiday create(@RequestBody Map<String, Object> body) {
        String name = str(body, "name");
        String date = str(body, "holidayDate");
        if (name == null || date == null) throw new IllegalArgumentException("name and holidayDate are required");
        Holiday h = new Holiday();
        h.setName(name);
        h.setHolidayDate(LocalDate.parse(date));
        h.setRecurring(bool(body, "recurring", false));
        h.setHolidayType(orDefault(str(body, "holidayType"), "Public"));
        h.setDescription(str(body, "description"));
        h.setStatus(orDefault(str(body, "status"), "Active"));
        return repo.save(h);
    }

    @PutMapping("/{id}")
    public Holiday update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Holiday h = get(id);
        if (body.containsKey("name")) h.setName(str(body, "name"));
        if (body.containsKey("holidayDate")) h.setHolidayDate(LocalDate.parse(str(body, "holidayDate")));
        if (body.containsKey("recurring")) h.setRecurring(bool(body, "recurring", h.getRecurring()));
        if (body.containsKey("holidayType")) h.setHolidayType(str(body, "holidayType"));
        if (body.containsKey("description")) h.setDescription(str(body, "description"));
        if (body.containsKey("status")) h.setStatus(str(body, "status"));
        return repo.save(h);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static boolean bool(Map<String, Object> body, String key, boolean fallback) {
        Object v = body.get(key);
        return v == null ? fallback : Boolean.parseBoolean(v.toString());
    }

    private static String orDefault(String v, String fallback) {
        return v == null || v.isBlank() ? fallback : v;
    }
}
