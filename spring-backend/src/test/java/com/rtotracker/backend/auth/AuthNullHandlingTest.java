package com.rtotracker.backend.auth;

import com.rtotracker.backend.platform.PlatformService;
import com.rtotracker.backend.user.PasswordHashingService;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AuthNullHandlingTest {
    @Test
    void rejectsAnAccountWithoutAPasswordHash() {
        UserRepository users = mock(UserRepository.class);
        PasswordHashingService passwords = mock(PasswordHashingService.class);
        when(users.findById("user@example.com")).thenReturn(Optional.of(new User("user@example.com", null)));
        AuthService service = new AuthService(users, passwords);

        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> service.authenticate("User@Example.com", "password"));

        assertEquals(HttpStatus.UNAUTHORIZED, failure.getStatusCode());
        verifyNoInteractions(passwords);
    }

    @Test
    void rejectsAnUnknownAccount() {
        UserRepository users = mock(UserRepository.class);
        PasswordHashingService passwords = mock(PasswordHashingService.class);
        when(users.findById("user@example.com")).thenReturn(Optional.empty());

        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> new AuthService(users, passwords).authenticate("user@example.com", "password"));

        assertEquals(HttpStatus.UNAUTHORIZED, failure.getStatusCode());
        verifyNoInteractions(passwords);
    }

    @Test
    void returnsAnAuthenticatedUserWithoutAPlatform() {
        AuthService auth = mock(AuthService.class);
        PlatformService platforms = mock(PlatformService.class);
        User user = new User("user@example.com", "hash");
        when(auth.findByEmail(user.getEmail())).thenReturn(user);
        when(platforms.findForUser(user.getEmail())).thenReturn(Optional.empty());
        AuthController controller = new AuthController(auth, platforms, mock(AssistantJwtService.class), false);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.getSession().setAttribute(AuthSession.AUTHENTICATED_EMAIL_ATTRIBUTE, user.getEmail());

        AuthController.LoginResponse response = controller.currentUser(request);

        assertEquals(user.getEmail(), response.email());
        assertNull(response.platform());
    }
}
