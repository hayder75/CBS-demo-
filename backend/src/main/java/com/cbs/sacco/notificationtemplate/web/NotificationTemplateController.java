package com.cbs.sacco.notificationtemplate.web;

import com.cbs.sacco.notificationtemplate.entity.NotificationTemplate;
import com.cbs.sacco.notificationtemplate.repo.NotificationTemplateRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notification-templates")
public class NotificationTemplateController {

    private final NotificationTemplateRepository repository;

    public NotificationTemplateController(NotificationTemplateRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<NotificationTemplate> list() {
        return repository.findAll();
    }

    @PostMapping
    public NotificationTemplate create(@RequestBody Map<String, Object> body) {
        String code = text(body, "code");
        String name = text(body, "name");
        String channel = text(body, "channel");
        String event = text(body, "event");
        String subject = text(body, "subject");
        String message = text(body, "body");

        if (blank(code)) throw new IllegalArgumentException("code is required");
        if (blank(name)) throw new IllegalArgumentException("name is required");
        if (blank(message)) throw new IllegalArgumentException("body is required");
        validateChannel(channel);
        if (repository.findByCodeIgnoreCase(code).isPresent()) {
            throw new IllegalArgumentException("Template code " + code + " already exists");
        }
        if ("Email".equals(channel) && blank(subject)) {
            throw new IllegalArgumentException("Email templates require a subject");
        }

        NotificationTemplate template = new NotificationTemplate();
        apply(template, code, name, channel, event, subject, message);
        template.setEnabled(Boolean.TRUE);
        template.setUpdatedAt(Instant.now());
        return repository.save(template);
    }

    @PostMapping("/{id}")
    public NotificationTemplate update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        NotificationTemplate template = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification template not found: " + id));

        String code = body.containsKey("code") ? text(body, "code") : template.getCode();
        String name = body.containsKey("name") ? text(body, "name") : template.getName();
        String channel = body.containsKey("channel") ? text(body, "channel") : template.getChannel();
        String event = body.containsKey("event") ? text(body, "event") : template.getEvent();
        String subject = body.containsKey("subject")
                ? text(body, "subject")
                : (template.getSubject() == null ? "" : template.getSubject());
        String message = body.containsKey("body") ? text(body, "body") : template.getBody();

        if (blank(code)) throw new IllegalArgumentException("code is required");
        if (blank(name)) throw new IllegalArgumentException("name is required");
        if (blank(message)) throw new IllegalArgumentException("body is required");
        validateChannel(channel);
        if (repository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new IllegalArgumentException("Template code " + code + " already exists");
        }
        if ("Email".equals(channel) && blank(subject)) {
            throw new IllegalArgumentException("Email templates require a subject");
        }

        apply(template, code, name, channel, event, subject, message);
        template.setUpdatedAt(Instant.now());
        return repository.save(template);
    }

    @PostMapping("/{id}/toggle")
    public NotificationTemplate toggle(@PathVariable Long id) {
        NotificationTemplate template = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification template not found: " + id));
        template.setEnabled(!Boolean.TRUE.equals(template.getEnabled()));
        template.setUpdatedAt(Instant.now());
        return repository.save(template);
    }

    private static void apply(NotificationTemplate template, String code, String name, String channel,
                              String event, String subject, String message) {
        template.setCode(code);
        template.setName(name);
        template.setChannel(channel);
        template.setEvent(event);
        template.setSubject("Email".equals(channel) ? subject : null);
        template.setBody(message);
    }

    private static void validateChannel(String channel) {
        if (!"Email".equals(channel) && !"SMS".equals(channel)) {
            throw new IllegalArgumentException("channel must be Email or SMS");
        }
    }

    private static String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? "" : value.toString().trim();
    }

    private static boolean blank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
