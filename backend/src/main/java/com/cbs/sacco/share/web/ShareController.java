package com.cbs.sacco.share.web;

import com.cbs.sacco.share.entity.DividendRun;
import com.cbs.sacco.share.entity.ShareTransfer;
import com.cbs.sacco.share.repo.DividendRunRepository;
import com.cbs.sacco.share.repo.ShareTransferRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shares")
public class ShareController {

    private final ShareTransferRepository transferRepository;
    private final DividendRunRepository dividendRepository;

    public ShareController(ShareTransferRepository transferRepository, DividendRunRepository dividendRepository) {
        this.transferRepository = transferRepository;
        this.dividendRepository = dividendRepository;
    }

    @GetMapping("/transfers")
    public List<ShareTransfer> transfers() {
        return transferRepository.findAll();
    }

    @GetMapping("/dividends")
    public List<DividendRun> dividends() {
        return dividendRepository.findAll();
    }

    @PostMapping("/transfers")
    public ShareTransfer createTransfer(@RequestBody Map<String, Object> body) {
        String from = str(body, "fromMember");
        String to = str(body, "toMember");
        Integer shares = intOf(body, "shares");
        if (from == null || to == null) throw new IllegalArgumentException("fromMember and toMember are required");
        if (shares == null || shares <= 0) throw new IllegalArgumentException("shares must be a positive integer");
        BigDecimal value = dec(body, "value");
        if (value == null) value = BigDecimal.ZERO;

        ShareTransfer t = new ShareTransfer();
        t.setDate(LocalDate.now());
        t.setFromMember(from);
        t.setToMember(to);
        t.setShares(shares);
        t.setValue(value);
        t.setStatus("Pending");
        return transferRepository.save(t);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static Integer intOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.intValue() : Integer.valueOf(v.toString());
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