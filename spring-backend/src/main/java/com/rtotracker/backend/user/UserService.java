package com.rtotracker.backend.user;

import com.rtotracker.backend.office.OfficeDayRepository;
import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.platform.PlatformRepository;
import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.role.RoleRepository;
import com.rtotracker.backend.site.Site;
import com.rtotracker.backend.site.SiteRepository;
import com.rtotracker.backend.workschedule.WorkSchedule;
import com.rtotracker.backend.workschedule.WorkScheduleRepository;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final PasswordHashingService passwordHashingService;
    private final RoleRepository roles;
    private final OfficeDayRepository officeDays;
    private final PlatformRepository platforms;
    private final WorkScheduleRepository workSchedules;
    private final SiteRepository sites;

    public UserService(
            UserRepository users,
            PasswordHashingService passwordHashingService,
            RoleRepository roles,
            OfficeDayRepository officeDays,
            PlatformRepository platforms,
            WorkScheduleRepository workSchedules,
            SiteRepository sites) {
        this.users = users;
        this.passwordHashingService = passwordHashingService;
        this.roles = roles;
        this.officeDays = officeDays;
        this.platforms = platforms;
        this.workSchedules = workSchedules;
        this.sites = sites;
    }

    @Transactional(readOnly = true)
    public Page<UserController.@NonNull UserResponse> findAll(Pageable pageable, Long platformId, boolean withoutPlatform,
                                                      Long workScheduleId, boolean withoutWorkSchedule,
                                                      Long siteId, boolean withoutSite,
                                                      String roleCode, String search) {
        Page<@NonNull User> matchingUsers = users.findAllByFilters(platformId, withoutPlatform, workScheduleId,
                withoutWorkSchedule, siteId, withoutSite, roleCode, normalizeSearch(search), pageable);
        return matchingUsers.map(UserController.UserResponse::from);
    }

    private static String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public @NonNull User findByEmail(String email) {
        return Objects.requireNonNull(users.findById(normalize(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
    }

    public User create(String email, String password) {
        String normalizedEmail = normalize(email);
        if (users.existsById(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists");
        }
        return users.save(new User(normalizedEmail, passwordHashingService.hash(password),
                Set.of(defaultRole())));
    }

    public User update(String currentEmail, String replacementEmail, List<@NonNull String> requestedRoleCodes,
                       MembershipUpdate membershipUpdate, boolean allowProtectedSelfEdit) {
        User current = findByEmail(currentEmail);
        Set<@NonNull String> protectedRoleCodes = current.getRoles().stream().filter(Role::isProtectedRole)
                .map(Role::getCode).collect(Collectors.toSet());
        if (!protectedRoleCodes.isEmpty() && !allowProtectedSelfEdit) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Protected users cannot be edited");
        }

        String normalizedReplacement = normalize(replacementEmail);
        if (!current.getEmail().equals(normalizedReplacement) && users.existsById(normalizedReplacement)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists");
        }

        Set<String> requestedCodes = new HashSet<>();
        requestedRoleCodes.forEach(code -> requestedCodes.add(code.trim()));
        if (requestedCodes.isEmpty() || requestedCodes.contains("")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one valid role");
        }
        List<@NonNull Role> requestedRoles = roles.findAllById(requestedCodes);
        if (requestedRoles.size() != requestedCodes.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more roles do not exist");
        }
        if (requestedRoles.stream().anyMatch(Role::isProtectedRole)
                && (!allowProtectedSelfEdit || requestedRoles.stream().filter(Role::isProtectedRole)
                .anyMatch(role -> !protectedRoleCodes.contains(role.getCode())))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Protected roles cannot be assigned");
        }

        Set<@NonNull Role> replacementRoles = new java.util.HashSet<>(requestedRoles);
        replacementRoles.addAll(current.getRoles().stream().filter(Role::isProtectedRole).toList());
        Platform platform = membershipUpdate == null ? current.getPlatform()
                : membershipUpdate.platformId() == null ? null : Objects.requireNonNull(platforms.findById(membershipUpdate.platformId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Platform not found")));
        WorkSchedule workSchedule = membershipUpdate == null ? current.getWorkSchedule()
                : membershipUpdate.workScheduleId() == null ? null
                : Objects.requireNonNull(workSchedules.findById(membershipUpdate.workScheduleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Work schedule not found")));
        Site site = membershipUpdate == null ? current.getSite()
                : membershipUpdate.siteId() == null ? null
                : Objects.requireNonNull(sites.findById(membershipUpdate.siteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Site not found")));
        if (current.getEmail().equals(normalizedReplacement)) {
            current.setRoles(replacementRoles);
            current.setPlatform(platform);
            current.setWorkSchedule(workSchedule);
            current.setSite(site);
            return current;
        }

        User replacementUser = new User(normalizedReplacement, current.getPasswordHash(), replacementRoles);
        replacementUser.setPlatform(platform);
        replacementUser.setWorkSchedule(workSchedule);
        replacementUser.setSite(site);
        User replacement = users.save(replacementUser);
        users.flush();
        officeDays.updateUserEmail(current.getEmail(), normalizedReplacement);
        users.delete(current);
        users.flush();
        return findByEmail(replacement.getEmail());
    }

    public void updateAssignments(List<@NonNull String> emails, Map<String, Long> assignments, List<@NonNull String> requestedRoleCodes) {
        Set<@NonNull String> allowed = Set.of("platformId", "workScheduleId", "siteId");
        Map<String, Long> requestedAssignments = assignments == null ? Map.of() : assignments;
        if ((requestedAssignments.isEmpty() && requestedRoleCodes == null) || !allowed.containsAll(requestedAssignments.keySet())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose at least one valid field to update");
        }
        Platform platform = requestedAssignments.containsKey("platformId") && requestedAssignments.get("platformId") != null
                ? Objects.requireNonNull(platforms.findById(requestedAssignments.get("platformId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Platform not found"))) : null;
        WorkSchedule workSchedule = requestedAssignments.containsKey("workScheduleId") && requestedAssignments.get("workScheduleId") != null
                ? Objects.requireNonNull(workSchedules.findById(requestedAssignments.get("workScheduleId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Work schedule not found"))) : null;
        Site site = requestedAssignments.containsKey("siteId") && requestedAssignments.get("siteId") != null
                ? Objects.requireNonNull(sites.findById(requestedAssignments.get("siteId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Site not found"))) : null;
        List<@NonNull Role> replacementRoles = null;
        if (requestedRoleCodes != null) {
            Set<String> requestedCodes = new HashSet<>();
            requestedRoleCodes.forEach(code -> requestedCodes.add(code.trim()));
            if (requestedCodes.isEmpty() || requestedCodes.contains("")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one valid role");
            }
            replacementRoles = roles.findAllById(requestedCodes);
            if (replacementRoles.size() != requestedCodes.size() || replacementRoles.stream().anyMatch(Role::isProtectedRole)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected roles are invalid");
            }
        }
        List<@NonNull User> selected = emails.stream().map(this::findByEmail).distinct().toList();
        if (selected.stream().anyMatch(user -> user.getRoles().stream().anyMatch(Role::isProtectedRole))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Protected users cannot be batch edited");
        }
        for (User user : selected) {
            if (requestedAssignments.containsKey("platformId")) user.setPlatform(platform);
            if (requestedAssignments.containsKey("workScheduleId")) user.setWorkSchedule(workSchedule);
            if (requestedAssignments.containsKey("siteId")) user.setSite(site);
            if (replacementRoles != null) user.setRoles(new java.util.HashSet<>(replacementRoles));
        }
    }

    public void delete(String email) {
        User user = findByEmail(email);
        users.delete(user);
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private @NonNull Role defaultRole() {
        return Objects.requireNonNull(roles.findById("USER")
                .orElseThrow(() -> new IllegalStateException("The USER role is missing from the role catalog")));
    }

    public record MembershipUpdate(Long platformId, Long workScheduleId, Long siteId) {
    }
}
