# RTO Tracker Requirements

This document is the shared source of truth for the system's users, access rules, and product behavior. It describes the behavior currently represented by the application and backend as reviewed on 2026-10-20. When a requirement changes, update this document first or in the same change as the implementation, and record unresolved product decisions under [Open questions](#open-questions).

## 1. Users and access

| User type | Access |
| --- | --- |
| Signed-out visitor | Can use the sign-in page. Visiting a protected page redirects to sign-in. |
| `USER` | Can sign in, view and manage their own monthly office-day schedule, view saved office days for other users in their platform, view global events and events for their platform, and sign out. They cannot use administrative management. |
| `SUPER_ADMIN` | Has authenticated user capabilities and can manage users, roles assigned through user management, platforms, platform memberships, work schedules, work schedule assignments, and global/platform events. |
| `LUNCH` | Can lock one recipient list per lunch date, view the daily recipients, and mark whether each person received lunch. |

All authenticated users have a personal account identified by email. User accounts are created by an administrator; there is no public registration flow. New accounts receive the `USER` role by default. The system may attach multiple roles to an account, but `SUPER_ADMIN` is protected from assignment and modification through the user-management flow.

### Access rules

- The planner requires an authenticated session.
- User and platform management require `SUPER_ADMIN`. The frontend hides these routes from unauthorized users; the backend independently enforces authorization for administrative API operations.
- Office-day reads and updates require an authenticated session and always apply to the signed-in account. A caller cannot select another account as the schedule owner.
- Office-day selections for today and past dates are locked. Users may add or remove future dates only; monthly updates preserve saved dates on or before today, and the backend rejects attempts to add such dates.
- Platform office-day reads require an authenticated session and return saved office dates only for colleagues sharing the signed-in user's platform; the caller cannot choose another platform, and their own schedule is excluded from this view.
- Event management requires `SUPER_ADMIN`; authenticated planner reads return global events plus events for the signed-in user's platform. Users cannot select another platform's events.
- Lunch procurement and receiving routes (`/lunch` and `/lunch/receiving`) and their API endpoints require the `LUNCH` or `SUPER_ADMIN` role; backend authorization is enforced for roster reads, daily lists, locking, and receipt updates.
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
- **PLAN-02** — As an authenticated user, I can mark or clear future dates as office days, select remaining weekdays, and clear future selections; today and past dates are locked.
- **PLAN-03** — As an authenticated user, I can save a month's office-day selections and see saved selections when I revisit that month.
- **PLAN-04** — As an authenticated user, I can edit a month before saving; unsaved changes are treated as a draft and save failures are surfaced in the planner.
- **PLAN-05** — The planner shows a weekday count and the next planned office day for the selected month and current date.
- **PLAN-06** — The planner shows upcoming events managed by administrators in chronological order for the selected month, including global events and events scoped to the user's platform. Each event shows its day of the month, time, and location.
- **PLAN-07** — As a `USER` assigned to a platform, I can see the daily count of other platform members with a saved office plan in each calendar cell and select a date to see their email addresses. Counts exclude my own plan; users without a platform do not see the counts or colleague list.

### User and role administration

- **USER-01** — As a `SUPER_ADMIN`, I can view a paginated user list, search the full roster by email or role, and filter users by role, platform, and work schedule.
- **USER-02** — As a `SUPER_ADMIN`, I can create a user with an email and password. The new user receives the `USER` role by default.
- **USER-03** — As a `SUPER_ADMIN`, I can update an eligible user's email, assignable roles, platform, and work schedule, including clearing either assignment. Existing password and linked office-day records are preserved when the email changes.
- **USER-04** — As a `SUPER_ADMIN`, I can delete an eligible user, subject to self-delete and protected-user restrictions.
- **USER-05** — As a `SUPER_ADMIN`, I can view the available platform options and each listed user's optional platform.
- **USER-06** — User listing supports page navigation and page sizes of 10, 25, 50, or 100 in the management interface; the API accepts page sizes up to 100.
- **USER-07** — User creation and update validate email and password/role inputs. Duplicate emails are rejected, and protected roles cannot be assigned through this flow.
- **USER-08** — Role, platform, and work-schedule filter choices for Manage Users are returned together. Search and filters apply across pages and can be combined, including filters for users with no platform or no work schedule.

### Platform administration

- **PLAT-01** — As a `SUPER_ADMIN`, I can view platforms and each platform's member count.
- **PLAT-02** — As a `SUPER_ADMIN`, I can create and edit a platform by setting its name and assigning users by email. When editing, I can expand a bounded, scrollable list of its currently assigned users. A user may belong to zero or one platform; a platform may contain multiple users.
- **PLAT-03** — As a `SUPER_ADMIN`, I can inspect a platform's member email addresses and remove a platform.
- **PLAT-04** — Platform names are required, limited to 20 characters, and unique without regard to letter case. Membership references must identify existing users.
- **PLAT-05** — Platform names appear in the signed-in user's session profile when the user belongs to those platforms.

### Work schedule administration

- **WSCH-01** — As a `SUPER_ADMIN`, I can list, create, edit, and delete named work schedules and assign users to them. When editing, I can expand a bounded, scrollable list of its currently assigned users.
- **WSCH-02** — Work schedule names are required, limited to 10 characters, and unique without regard to letter case.
- **WSCH-03** — A user may have zero or one work schedule; a work schedule may be assigned to multiple users.
- **WSCH-04** — Deleting a work schedule keeps its user accounts and clears their work schedule assignment.

### Event management

- **EVNT-01** — As a `SUPER_ADMIN`, I can create, view, edit, and delete events with a date, title (up to 50 characters), type, time, location, and optional office requirement.
- **EVNT-02** — An event can be global or scoped to one platform; a platform-scoped event must reference an existing platform.
- **EVNT-03** — As an authenticated user, I see global events and events scoped to my own platform in the selected planner month.
- **EVNT-04** — Deleting a platform also deletes its platform-scoped events.
- **EVNT-05** — As a `SUPER_ADMIN`, I can filter the event management list by an optional date and clear the date filter to show events from all dates.

### RTO dashboard

- **DASH-01** — As a `SUPER_ADMIN`, I can review saved office-day plans for a selected Monday–Friday week.
- **DASH-02** — The dashboard shows attendance for each weekday, total planned RTO days, distinct attendees, and total and daily breakdowns by each attendee's current platform and work schedule.
- **DASH-03** — Users with no platform or work schedule are included in the corresponding unassigned breakdown.

### Lunch procurement

- **LUNCH-01** — As a user with the `LUNCH` or `SUPER_ADMIN` role, I can lock all existing users as free-lunch recipients for a selected date with one action.
- **LUNCH-06** — Before locking, I can review the full user roster and a platform-row/work-schedule-column summary for the selected date.
- **LUNCH-07** — Lunch procurement and recipient handout tracking are available on separate routes.
- **LUNCH-08** — Before locking, I can filter only the “Users to be included” list by platform and work schedule. These filters do not change the breakdown or all-users lock action.
- **LUNCH-09** — The filtered “Users to be included” list supports pagination with selectable page sizes.
- **LUNCH-02** — A date can have only one locked lunch list. Once locked, its recipients cannot be added or removed.
- **LUNCH-03** — As a user with the `LUNCH` or `SUPER_ADMIN` role, I can view the recipients for a selected date and mark each person as received or not received.
- **LUNCH-04** — The system stores one received status per locked recipient and date. Deleted user accounts are removed from recipient records.
- **LUNCH-05** — The daily dashboard shows recipient totals by platform in rows and work schedule in columns, including received counts.

### RTO planning assistant

- **AI-01** — An authenticated user can ask the planner assistant about planning their RTO schedule in this app, their visible events, and team RTO attendance available to them. The frontend sends prompts directly to the AI service with a short-lived token obtained from Spring. The service rejects out-of-scope questions before calling Bedrock and does not answer questions about other platforms, companies, or services.
- **AI-02** — Bedrock can request the user's visible events, other platform members' daily saved RTO counts, and the user's saved office days through read-only tools. Spring derives the account and platform from the verified token. Read-only data ranges may include dates from the first of the current month through the end of next month; responses must label dates before today as historical and explain that they are not upcoming.
- **AI-03** — Assistant planning is limited to the current and following month. New RTO suggestions must be future dates, starting tomorrow, and responses are drafts that do not save schedule changes.
- **AI-04** — Event lookups fetch current Spring data for every request. Refresh follow-ups retain the preceding event query's date range and must invoke the live event tool again before responding; “today” is a one-day range only when explicitly requested.
- **AI-05** — The assistant opens from a floating lower-right button on the planner route (`/`) only.
- **AI-06** — A monthly request for N RTO days is a total target unless the user says “additional” or “more.” Count already-saved days in that month, including past days, and suggest only the remaining future dates.
- **AI-07** — Monthly RTO recommendations state which saved dates count and how many remain, suggest available weekdays within the requested month before using weekends as a last resort, and give a brief factual reason per date based on current event and team-attendance data. Follow-ups retain the active month, apply unavailable dates and weekday preferences, and recalculate from fresh data when constraints change. If constraints leave too few dates, explain the shortfall and ask what to relax. Ask a focused question when ambiguity would change the plan; otherwise state an assumption and proceed. Dates use readable formatting with correct weekday names.
- **AI-08** — The assistant retains up to eight recent chat turns for follow-up questions and explains recommendations using available schedule, event, attendance, and preference facts.

## 3. Product and system boundaries

- The web application is a Next.js frontend; the REST API is a Spring Boot backend.
- The frontend sends API requests through its same-origin `/api/*` proxy to the backend. Direct cross-origin API access is configured separately for the frontend origin.
- MySQL stores users, roles, platform memberships, work schedules, events, and office-day records. Flyway manages schema changes.
- A user's office-day schedule is stored by date and queried or replaced by month. The account identity comes from the authenticated session.
- The frontend sends assistant prompts directly to the Python Bedrock AI service using a short-lived Spring-issued token. Bedrock may choose among allowlisted, read-only Spring tools for user-scoped events, attendance counts, and saved office days; the AI service does not persist schedule data.
- The assistant is restricted to this application's RTO planning, the authenticated user's visible events, and accessible team RTO attendance. The AI service gates out-of-scope requests before invoking Bedrock and its system instructions prohibit answering about other platforms, companies, or services.
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
