package com.rtotracker.backend.auth;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AssistantJwtServiceTest {
    @TempDir
    Path directory;
    private AssistantJwtService service;
    private KeyPair keys;

    @BeforeEach
    void createService() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keys = generator.generateKeyPair();
        Path privateKey = directory.resolve("private.pem");
        Path publicKey = directory.resolve("public.pem");
        Files.writeString(privateKey, pem("PRIVATE KEY", keys.getPrivate().getEncoded()));
        Files.writeString(publicKey, pem("PUBLIC KEY", keys.getPublic().getEncoded()));
        service = new AssistantJwtService("test-issuer", "test-audience", privateKey.toString(), publicKey.toString());
    }

    @Test
    void acceptsAnIssuedToken() {
        AssistantJwtService.Token token = service.issue("user@example.com");
        assertEquals("user@example.com", service.requireUserEmail("Bearer " + token.access_token()));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = "wrong-audience")
    void rejectsMissingOrIncorrectAudience(String audience) throws Exception {
        Instant now = Instant.now();
        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                .issuer("test-issuer").subject("user@example.com")
                .issueTime(Date.from(now)).expirationTime(Date.from(now.plusSeconds(60)))
                .claim("scope", AssistantJwtService.REQUIRED_SCOPE);
        if (audience != null) claims.audience(audience);
        SignedJWT token = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims.build());
        token.sign(new RSASSASigner((RSAPrivateKey) keys.getPrivate()));

        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> service.requireUserEmail("Bearer " + token.serialize()));

        assertEquals(HttpStatus.UNAUTHORIZED, failure.getStatusCode());
    }

    private static String pem(String label, byte[] bytes) {
        return "-----BEGIN " + label + "-----\n" + Base64.getEncoder().encodeToString(bytes)
                + "\n-----END " + label + "-----\n";
    }
}
