package com.rtotracker.backend.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;

@Component
public class ClientAddressResolver {

    private final List<@NonNull Cidr> trustedProxies;

    public ClientAddressResolver(RateLimitProperties properties) {
        this.trustedProxies = properties.getTrustedProxies().stream()
                .map(String::trim).filter(value -> !value.isEmpty()).map(Cidr::parse).toList();
    }

    public String resolve(HttpServletRequest request) {
        String remote = normalize(request.getRemoteAddr());
        if (remote == null || trustedProxies.stream().noneMatch(cidr -> cidr.contains(remote))) {
            return remote == null ? "unknown" : remote;
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank()) return remote;
        String[] chain = forwarded.split(",");
        String candidate = remote;
        for (int index = chain.length - 1; index >= 0; index--) {
            String hop = normalize(chain[index].trim());
            if (hop == null) break;
            candidate = hop;
            String current = hop;
            if (trustedProxies.stream().noneMatch(cidr -> cidr.contains(current))) break;
        }
        return candidate;
    }

    private static @Nullable String normalize(@Nullable String value) {
        if (value == null || !value.matches("[0-9a-fA-F:.]+")) return null;
        try {
            return InetAddress.getByName(value).getHostAddress();
        } catch (UnknownHostException exception) {
            return null;
        }
    }

    private record Cidr(byte[] network, int prefix) {
        static @NonNull Cidr parse(String value) {
            String[] parts = value.split("/", -1);
            String address = normalize(parts[0]);
            if (address == null) throw new IllegalArgumentException("Invalid trusted proxy address: " + value);
            try {
                byte[] bytes = InetAddress.getByName(address).getAddress();
                int prefix = parts.length == 1 ? bytes.length * 8 : Integer.parseInt(parts[1]);
                if (parts.length > 2 || prefix < 0 || prefix > bytes.length * 8) {
                    throw new IllegalArgumentException("Invalid trusted proxy CIDR: " + value);
                }
                return new Cidr(bytes, prefix);
            } catch (UnknownHostException | NumberFormatException exception) {
                throw new IllegalArgumentException("Invalid trusted proxy CIDR: " + value, exception);
            }
        }

        boolean contains(String address) {
            try {
                byte[] candidate = InetAddress.getByName(address).getAddress();
                if (candidate.length != network.length) return false;
                int wholeBytes = prefix / 8;
                int remainingBits = prefix % 8;
                for (int index = 0; index < wholeBytes; index++) {
                    if (candidate[index] != network[index]) return false;
                }
                if (remainingBits == 0) return true;
                int mask = 0xff << (8 - remainingBits);
                return (candidate[wholeBytes] & mask) == (network[wholeBytes] & mask);
            } catch (UnknownHostException exception) {
                return false;
            }
        }
    }
}
