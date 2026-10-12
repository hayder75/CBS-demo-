package com.cbs.sacco.message.web;

import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.message.entity.Message;
import com.cbs.sacco.message.repo.MessageRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository repo;

    public MessageController(MessageRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Message> list(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return repo.findAll().stream().filter(m -> status.equalsIgnoreCase(m.getStatus())).toList();
        }
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public Message get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Message not found: " + id));
    }

    @PostMapping
    public Message create(@RequestBody Map<String, Object> body,
                          @AuthenticationPrincipal AppUserPrincipal principal) {
        String title = str(body, "title");
        if (title == null) throw new IllegalArgumentException("title is required");
        Message m = new Message();
        m.setTitle(title);
        m.setBody(str(body, "body"));
        m.setCategory(orDefault(str(body, "category"), "General"));
        m.setAudience(orDefault(str(body, "audience"), "All"));
        m.setChannel(orDefault(str(body, "channel"), "In-App"));
        m.setCreatedBy(principal == null ? "System" : principal.name());
        m.setCreatedAt(Instant.now());
        boolean send = Boolean.TRUE.equals(body.get("send"));
        m.setStatus(send ? "Sent" : "Draft");
        if (send) m.setSentAt(Instant.now());
        return repo.save(m);
    }

    @PostMapping("/{id}/send")
    public Message send(@PathVariable Long id) {
        Message m = get(id);
        m.setStatus("Sent");
        m.setSentAt(Instant.now());
        return repo.save(m);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static String orDefault(String v, String fallback) {
        return v == null || v.isBlank() ? fallback : v;
    }
}
