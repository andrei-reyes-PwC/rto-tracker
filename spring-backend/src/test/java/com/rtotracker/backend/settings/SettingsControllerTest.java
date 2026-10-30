package com.rtotracker.backend.settings;

import com.rtotracker.backend.ApiExceptionHandler;
import com.rtotracker.backend.auth.AdminAuthorizationService;
import com.rtotracker.backend.auth.AuthSession;
import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.jspecify.annotations.NonNull;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Set;
import java.util.Objects;

import static org.mockito.Mockito.*;
import static com.rtotracker.backend.settings.SchedulingMode.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SettingsControllerTest {
    private final UserService users = mock(UserService.class);
    private final SettingsService settings = mock(SettingsService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new SettingsController(settings, new AdminAuthorizationService(users)))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }

    private ResultActions perform(MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(Objects.requireNonNull(request));
    }

    private @NonNull MockHttpSession session(String roleCode, boolean assigned) {
        Role role = mock(Role.class);
        when(role.getCode()).thenReturn(roleCode);
        User actor = new User("manager@example.com", "hash", Set.of(role));
        if (assigned) {
            Platform platform = mock(Platform.class);
            when(platform.getId()).thenReturn(2L);
            actor.setPlatform(platform);
        }
        when(users.findByEmail(actor.getEmail())).thenReturn(actor);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthSession.AUTHENTICATED_EMAIL_ATTRIBUTE, actor.getEmail());
        return session;
    }

    @Test
    void settingsReadsRejectSignedOutStandardAndUnassignedAdmins() throws Exception {
        perform(get("/api/settings")).andExpect(status().isUnauthorized());
        perform(get("/api/settings").session(session("USER", true))).andExpect(status().isForbidden());
        perform(get("/api/settings").session(session("ADMIN", false))).andExpect(status().isForbidden());
        verifyNoInteractions(settings);
    }

    @Test
    void platformAdminsCannotWriteGlobalOrAnotherPlatformsSettings() throws Exception {
        var session = session("ADMIN", true);
        perform(put("/api/settings/global").session(session).contentType(MediaType.APPLICATION_JSON)
                .content("{\"saturdayDayOff\":true,\"sundayDayOff\":true,\"schedulingMode\":\"FLEXIBLE\"}")).andExpect(status().isForbidden());
        perform(put("/api/settings/platforms/3").session(session).contentType(MediaType.APPLICATION_JSON)
                .content("{\"inheritGlobal\":false,\"saturdayDayOff\":true,\"sundayDayOff\":false,\"schedulingMode\":\"FLEXIBLE\"}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(settings);
    }

    @Test
    void platformAdminCanReadAndUpdateOnlyOwnPlatform() throws Exception {
        var session = session("ADMIN", true);
        var rules = new SettingsService.PlanningRules(true, false, PEZA);
        when(settings.managementSettings(any(), eq(false))).thenReturn(new SettingsService.ManagementSettings(rules,
                List.of(new SettingsService.PlatformSettings(2L, "Own platform", true, rules))));
        when(settings.updatePlatform(2L, false, true, false, PEZA))
                .thenReturn(new SettingsService.PlatformSettings(2L, "Own platform", false, rules));
        perform(get("/api/settings").session(session)).andExpect(status().isOk())
                .andExpect(jsonPath("$.platforms.length()").value(1));
        perform(put("/api/settings/platforms/2").session(session).contentType(MediaType.APPLICATION_JSON)
                .content("{\"inheritGlobal\":false,\"saturdayDayOff\":true,\"sundayDayOff\":false,\"schedulingMode\":\"PEZA\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.effective.saturdayDayOff").value(true))
                .andExpect(jsonPath("$.effective.schedulingMode").value("PEZA"));
    }

    @Test
    void superAdminCanUpdateGlobalAndAnyPlatformAndMissingBooleansAreRejected() throws Exception {
        var session = session("SUPER_ADMIN", false);
        when(settings.updateGlobal(true, true, FLEXIBLE)).thenReturn(new SettingsService.PlanningRules(true, true, FLEXIBLE));
        perform(put("/api/settings/global").session(session).contentType(MediaType.APPLICATION_JSON)
                .content("{\"saturdayDayOff\":true,\"sundayDayOff\":true,\"schedulingMode\":\"FLEXIBLE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.sundayDayOff").value(true));
        perform(put("/api/settings/platforms/3").session(session).contentType(MediaType.APPLICATION_JSON)
                .content("{\"inheritGlobal\":true,\"saturdayDayOff\":false,\"sundayDayOff\":false,\"schedulingMode\":\"FLEXIBLE\"}"))
                .andExpect(status().isOk());
        verify(settings).updatePlatform(3L, true, false, false, FLEXIBLE);
        perform(put("/api/settings/global").session(session).contentType(MediaType.APPLICATION_JSON)
                .content("{\"saturdayDayOff\":null}"))
                .andExpect(status().isBadRequest());
        perform(put("/api/settings/platforms/3").session(session).contentType(MediaType.APPLICATION_JSON)
                .content("{\"saturdayDayOff\":true,\"sundayDayOff\":true,\"schedulingMode\":\"FLEXIBLE\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingUnknownAndOversizedModesAreRejected() throws Exception {
        var session = session("SUPER_ADMIN", false);
        for (String mode : List.of("", ",\"schedulingMode\":\"UNKNOWN\"", ",\"schedulingMode\":\"" + "X".repeat(26) + "\"")) {
            perform(put("/api/settings/global").session(session).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"saturdayDayOff\":false,\"sundayDayOff\":false" + mode + "}"))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(settings);
    }
}
