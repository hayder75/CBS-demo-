package com.cbs.sacco.sms.client;

import com.cbs.sacco.sms.config.AfroSmsProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class AfroSmsClient {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    private final AfroSmsProperties props;
    private final RestClient restClient;

    public AfroSmsClient(AfroSmsProperties props) {
        this.props = props;
        this.restClient = RestClient.builder()
                .baseUrl(props.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + safe(props.getApiKey()))
                .build();
    }

    public Map<String, Object> sendSms(String to, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("to", to);
        body.put("message", message);
        if (hasText(props.getFrom())) body.put("from", props.getFrom());
        if (hasText(props.getSender())) body.put("sender", props.getSender());
        Map<String, Object> response = restClient.post()
                .uri("/send")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(MAP_TYPE);
        return response == null ? Map.of() : response;
    }

    public Map<String, Object> challenge(String to) {
        Map<String, Object> response = restClient.get()
                .uri(builder -> {
                    builder.path("/challenge").queryParam("to", to);
                    if (hasText(props.getFrom())) builder.queryParam("from", props.getFrom());
                    if (hasText(props.getSender())) builder.queryParam("sender", props.getSender());
                    builder.queryParam("len", props.getOtpLength());
                    builder.queryParam("ttl", props.getOtpTtlSeconds());
                    return builder.build();
                })
                .retrieve()
                .body(MAP_TYPE);
        return response == null ? Map.of() : response;
    }

    public Map<String, Object> verify(String to, String verificationId, String code) {
        Map<String, Object> response = restClient.get()
                .uri(builder -> {
                    builder.path("/verify").queryParam("to", to).queryParam("code", code);
                    if (hasText(verificationId)) builder.queryParam("vc", verificationId);
                    return builder.build();
                })
                .retrieve()
                .body(MAP_TYPE);
        return response == null ? Map.of() : response;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }
}
