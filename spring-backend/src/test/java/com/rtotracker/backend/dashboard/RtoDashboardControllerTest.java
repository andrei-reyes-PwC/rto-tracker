package com.rtotracker.backend.dashboard;

import com.rtotracker.backend.ApiExceptionHandler;
import com.rtotracker.backend.auth.AdminAuthorizationService;
import com.rtotracker.backend.auth.AuthSession;
import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.jspecify.annotations.NonNull;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.http.ContentDisposition;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Set;
import java.util.List;
import java.util.Objects;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RtoDashboardControllerTest {
    private final UserService users = mock(UserService.class);
    private final RtoDashboardService dashboard = mock(RtoDashboardService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new RtoDashboardController(dashboard,
                new AdminAuthorizationService(users), new RtoDashboardExcelExporter()))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }

    private @NonNull MockHttpSession session(String roleCode) {
        Role role = mock(Role.class);
        when(role.getCode()).thenReturn(roleCode);
        when(users.findByEmail("viewer@example.com")).thenReturn(new User("viewer@example.com", "hash", Set.of(role)));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthSession.AUTHENTICATED_EMAIL_ATTRIBUTE, "viewer@example.com");
        return session;
    }

    private ResultActions perform(MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(Objects.requireNonNull(request));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "SUPER_ADMIN"})
    void dashboardRolesCanDownloadTheSelectedWeekAndSite(String role) throws Exception {
        var empty = RtoDashboardExcelExporterTest.report(true);
        when(dashboard.getWeeklyReport(any(), any())).thenReturn(
                new RtoDashboardService.WeeklyRtoReport(empty.summary(), "North Office", List.of()));
        perform(get("/api/dashboard/rto/export").param("weekStart", "2026-10-26").param("siteId", "1").session(session(role)))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(result -> assertEquals("rto-dashboard-2026-10-26-site-North Office.xlsx",
                        ContentDisposition.parse(Objects.requireNonNull(result.getResponse().getHeader("Content-Disposition"))).getFilename()))
                .andExpect(header().string("Cache-Control", "no-store"));
        verify(dashboard).getWeeklyReport(java.time.LocalDate.of(2026, 10, 26), 1L);
    }

    @Test
    void exportFilenameSupportsUnicodeAndReplacesInvalidFilenameCharacters() throws Exception {
        var empty = RtoDashboardExcelExporterTest.report(true);
        when(dashboard.getWeeklyReport(any(), any())).thenReturn(
                new RtoDashboardService.WeeklyRtoReport(empty.summary(), "München / HQ", List.of()));
        perform(get("/api/dashboard/rto/export").param("weekStart", "2026-10-26").param("siteId", "1").session(session("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(result -> assertEquals("rto-dashboard-2026-10-26-site-München _ HQ.xlsx",
                        ContentDisposition.parse(Objects.requireNonNull(result.getResponse().getHeader("Content-Disposition"))).getFilename()));
    }

    @Test
    void allSitesExportKeepsAllSitesFilename() throws Exception {
        when(dashboard.getWeeklyReport(any(), any())).thenReturn(RtoDashboardExcelExporterTest.report(true));
        perform(get("/api/dashboard/rto/export").param("weekStart", "2026-10-26").session(session("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(result -> assertEquals("rto-dashboard-2026-10-26-all-sites.xlsx",
                        ContentDisposition.parse(Objects.requireNonNull(result.getResponse().getHeader("Content-Disposition"))).getFilename()));
    }

    @Test
    void rejectsSignedOutUsersAndUsersWithoutDashboardAccess() throws Exception {
        perform(get("/api/dashboard/rto/export").param("weekStart", "2026-10-26")).andExpect(status().isUnauthorized());
        perform(get("/api/dashboard/rto/export").param("weekStart", "2026-10-26").session(session("USER")))
                .andExpect(status().isForbidden());
        verifyNoInteractions(dashboard);
    }

    @Test
    void rejectsMissingMalformedAndNonMondayWeeksBeforeLoadingData() throws Exception {
        @NonNull MockHttpSession session = session("ADMIN");
        perform(get("/api/dashboard/rto/export").session(session)).andExpect(status().isBadRequest());
        perform(get("/api/dashboard/rto/export").param("weekStart", "not-a-date").session(session)).andExpect(status().isBadRequest());
        perform(get("/api/dashboard/rto/export").param("weekStart", "2026-10-27").session(session))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(dashboard);
    }
}
