# RTO Tracker Requirements

This document is the shared source of truth for the system's users, access rules, and product behavior. It describes the behavior currently represented by the application and backend as reviewed on 2026-10-20. When a requirement changes, update this document first or in the same change as the implementation, and record unresolved product decisions under [Open questions](#open-questions).

## 1. Users and access

| User type | Access |
| --- | --- |
| Signed-out visitor | Can use the sign-in page. Visiting a protected page redirects to sign-in. |
| `USER` | Can sign in, view and manage their own monthly office-day schedule, view saved office days for other users in their platform, view global events and events for their platform, and sign out. They cannot use administrative management. |
| `SUPER_ADMIN` | Has authenticated user capabilities and can manage users, roles assigned through user management, platforms, platform memberships, work schedules, work schedule assignments, and global/platform events. |

All authenticated users have a personal account identified by email. User accounts are created by an administrator; there is no public registration flow. New accounts receive the `USER` role by default. The system may attach multiple roles to an account, but `SUPER_ADMIN` is protected from assignment and modification through the user-management flow.

### Access rules

- The planner requires an authenticated session.
- User and platform management require `SUPER_ADMIN`. The frontend hides these routes from unauthorized users; the backend independently enforces authorization for administrative API operations.
- Office-day reads and updates require an authenticated session and always apply to the signed-in account. A caller cannot select another account as the schedule owner.
- Platform office-day reads require an authenticated session and return saved office dates only for colleagues sharing the signed-in user's platform; the caller cannot choose another platform, and their own schedule is excluded from this view.
- Event management requires `SUPER_ADMIN`; authenticated planner reads return global events plus events for the signed-in user's platform. Users cannot select another platform's events.
- A `SUPER_ADMIN` cannot delete their own account. Protected users cannot be deleted or edited through user management.
- Signing out invalidates the session.

## 2. Feature requirements

### Authentication and account session

- **AUTH-01** — As an account holder, I can sign in with my email and password to access the planner and the features permitted by my role.
- **AUTH-02** — As an account holder, I can see the identity, roles, and optional platform associated with my active session.
- **AUTH-03** — As an account holder, I can sign out, after which the session is no longer valid.
- **AUTH-04** — Invalid credentials or an invalid session do not grant access to protected features.

### Office planner

- **PLAN-01** — As an authenticated user, I can view a monthly calendar and move between months or return to the current month.
- **PLAN-02** — As an authenticated user, I can mark individual dates as office days, mark weekdays, or clear the selected month.
- **PLAN-03** — As an authenticated user, I can save a month's office-day selections and see saved selections when I revisit that month.
- **PLAN-04** — As an authenticated user, I can edit a month before saving; unsaved changes are treated as a draft and save failures are surfaced in the planner.
- **PLAN-05** — The planner shows a weekday count and the next planned office day for the selected month and current date.
- **PLAN-06** — The planner shows events managed by administrators for the selected month, including global events and events scoped to the user's platform.
- **PLAN-07** — As a `USER` assigned to a platform, I can see the daily count of other platform members with a saved office plan in each calendar cell and select a date to see their email addresses. Counts exclude my own plan; users without a platform do not see the counts or colleague list.

### User and role administration

- **USER-01** — As a `SUPER_ADMIN`, I can view a paginated user list, search within the displayed results, and filter users by platform.
- **USER-02** — As a `SUPER_ADMIN`, I can create a user with an email and password. The new user receives the `USER` role by default.
- **USER-03** — As a `SUPER_ADMIN`, I can update an eligible user's email and assignable roles. Existing password, platform, work schedule, and linked office-day records are preserved when the email changes.
- **USER-04** — As a `SUPER_ADMIN`, I can delete an eligible user, subject to self-delete and protected-user restrictions.
- **USER-05** — As a `SUPER_ADMIN`, I can view the available platform options and each listed user's optional platform.
- **USER-06** — User listing supports page navigation and page sizes of 10, 25, 50, or 100 in the management interface; the API accepts page sizes up to 100.
- **USER-07** — User creation and update validate email and password/role inputs. Duplicate emails are rejected, and protected roles cannot be assigned through this flow.

### Platform administration

- **PLAT-01** — As a `SUPER_ADMIN`, I can view platforms and each platform's member count.
- **PLAT-02** — As a `SUPER_ADMIN`, I can create and edit a platform by setting its name and assigning users by email. A user may belong to zero or one platform; a platform may contain multiple users.
- **PLAT-03** — As a `SUPER_ADMIN`, I can inspect a platform's member email addresses and remove a platform.
- **PLAT-04** — Platform names are required, limited to 20 characters, and unique without regard to letter case. Membership references must identify existing users.
- **PLAT-05** — Platform names appear in the signed-in user's session profile when the user belongs to those platforms.

### Work schedule administration

- **WSCH-01** — As a `SUPER_ADMIN`, I can list, create, edit, and delete named work schedules and assign users to them.
- **WSCH-02** — Work schedule names are required and limited to 10 characters.
- **WSCH-03** — A user may have zero or one work schedule; a work schedule may be assigned to multiple users.
- **WSCH-04** — Deleting a work schedule keeps its user accounts and clears their work schedule assignment.

### Event management

- **EVNT-01** — As a `SUPER_ADMIN`, I can create, view, edit, and delete events with a date, title, type, time, location, and optional office requirement.
- **EVNT-02** — An event can be global or scoped to one platform; a platform-scoped event must reference an existing platform.
- **EVNT-03** — As an authenticated user, I see global events and events scoped to my own platform in the selected planner month.
- **EVNT-04** — Deleting a platform also deletes its platform-scoped events.

### RTO dashboard

- **DASH-01** — As a `SUPER_ADMIN`, I can review saved office-day plans for a selected Monday–Friday week.
- **DASH-02** — The dashboard shows attendance for each weekday, total planned RTO days, distinct attendees, and total and daily breakdowns by each attendee's current platform and work schedule.
- **DASH-03** — Users with no platform or work schedule are included in the corresponding unassigned breakdown.

## 3. Product and system boundaries

- The web application is a Next.js frontend; the REST API is a Spring Boot backend.
- The frontend sends API requests through its same-origin `/api/*` proxy to the backend. Direct cross-origin API access is configured separately for the frontend origin.
- MySQL stores users, roles, platform memberships, work schedules, events, and office-day records. Flyway manages schema changes.
- A user's office-day schedule is stored by date and queried or replaced by month. The account identity comes from the authenticated session.
- Platform office-day visibility is limited to same-platform colleagues and a selected date; only saved plans are shown.
- The system has no company-calendar integration; administrators manage events directly. There is no public self-service registration.

## 4. Open questions

These are product decisions not established by the current implementation. Resolve them before treating the corresponding behavior as a long-term product commitment.

- What is the organization's definitive RTO policy: required number of office days, eligible weekdays, holidays, exceptions, and enforcement rules?
- Who owns the accuracy and maintenance of administrator-managed company events and mandatory RTO requirements?
- Should standard users have access to additional views such as team schedules, or remain limited to their own planner?
- What account lifecycle is expected (password reset, account deactivation, invitation, and credential rotation)?
- What should happen to a user's office-day history if an administrator deletes the account?
- Should role assignment remain limited to the current protected-role rules, and which roles should exist beyond `USER` and `SUPER_ADMIN`?
- What working-day rules or other behavior should a named work schedule define beyond its current user assignment?

## 5. Change and review convention

- Use the requirement IDs above in feature discussions and implementation reviews.
- When a change alters user-visible behavior, permissions, persistence, or system boundaries, update this document alongside the affected code and project notes.
- Keep implemented behavior and intended future behavior distinct. Add unresolved decisions to the open-questions section instead of silently treating assumptions as requirements.
