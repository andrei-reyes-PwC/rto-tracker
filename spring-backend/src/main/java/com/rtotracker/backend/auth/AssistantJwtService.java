package com.rtotracker.backend.auth;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;

@Service
public class AssistantJwtService {

    public static final String REQUIRED_SCOPE = "assistant:chat";
    public static final Duration TOKEN_LIFETIME = Duration.ofMinutes(5);
    private static final String KEY_ID = "rto-assistant-rsa";

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final String issuer;
    private final String audience;

    public AssistantJwtService(
            @Value("${app.jwt.issuer:rto-tracker-local}") String issuer,
            @Value("${app.jwt.audience:rto-assistant-services}") String audience,
            @Value("${app.jwt.private-key-path:.secrets/jwt-private.pem}") String privateKeyPath,
            @Value("${app.jwt.public-key-path:.secrets/jwt-public.pem}") String publicKeyPath,
            @Value("${app.jwt.private-key-pem:}") String privateKeyPem,
            @Value("${app.jwt.public-key-pem:}") String publicKeyPem) {
        this.issuer = issuer;
        this.audience = audience;
        try {
            RSAPublicKey publicKey = loadPublicKey(publicKeyPath, publicKeyPem);
            RSAPrivateKey privateKey = loadPrivateKey(privateKeyPath, privateKeyPem);
            RSAKey signingKey = new RSAKey.Builder(publicKey)
                    .privateKey(privateKey)
                    .keyID(KEY_ID)
                    .build();
            this.encoder = new NimbusJwtEncoder(
                    new ImmutableJWKSet<SecurityContext>(new JWKSet(signingKey)));

            NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withPublicKey(publicKey)
                    .signatureAlgorithm(SignatureAlgorithm.RS256)
                    .build();
            OAuth2TokenValidator<Jwt> audienceValidator = jwt ->
                    jwt.getAudience().contains(audience)
                            ? OAuth2TokenValidatorResult.success()
                            : OAuth2TokenValidatorResult.failure(
                                    new OAuth2Error("invalid_token", "Invalid token audience", null));
            OAuth2TokenValidator<Jwt> scopeValidator = jwt -> {
                String scope = jwt.getClaimAsString("scope");
                return scope != null && List.of(scope.split(" ")).contains(REQUIRED_SCOPE)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(
                                new OAuth2Error("invalid_token", "Required assistant scope is missing", null));
            };
            jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                    JwtValidators.createDefaultWithIssuer(issuer), audienceValidator, scopeValidator));
            this.decoder = jwtDecoder;
        } catch (IOException | GeneralSecurityException exception) {
            throw new IllegalStateException("Could not load the assistant JWT RSA keys", exception);
        }
    }

    public Token issue(String email) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(email)
                .audience(List.of(audience))
                .issuedAt(now)
                .expiresAt(now.plus(TOKEN_LIFETIME))
                .id(UUID.randomUUID().toString())
                .claim("scope", REQUIRED_SCOPE)
                .build();
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256)
                .keyId(KEY_ID)
                .build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new Token(token, "Bearer", TOKEN_LIFETIME.toSeconds());
    }

    public String requireUserEmail(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw unauthorized();
        }
        try {
            String email = decoder.decode(authorizationHeader.substring(7).trim()).getSubject();
            if (email == null || email.isBlank()) {
                throw unauthorized();
            }
            return email;
        } catch (JwtException exception) {
            throw unauthorized();
        }
    }

    private static RSAPrivateKey loadPrivateKey(String path, String pem) throws IOException, GeneralSecurityException {
        byte[] der = decodePem(readPem(path, pem), "PRIVATE KEY");
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private static RSAPublicKey loadPublicKey(String path, String pem) throws IOException, GeneralSecurityException {
        byte[] der = decodePem(readPem(path, pem), "PUBLIC KEY");
        return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
    }

    private static String readPem(String path, String pem) throws IOException {
        return pem == null || pem.isBlank() ? Files.readString(Path.of(path)) : pem;
    }

    private static byte[] decodePem(String pem, String label) {
        String content = pem.replace("-----BEGIN " + label + "-----", "")
                .replace("-----END " + label + "-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(content);
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired assistant token");
    }

    public record Token(String access_token, String token_type, long expires_in) {
    }
}
