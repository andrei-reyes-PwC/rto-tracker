# RTO Tracker Requirements

This document is the shared source of truth for the system's users, access rules, and product behavior. It describes the behavior currently represented by the application and backend as reviewed on 2026-10-20. When a requirement changes, update this document first or in the same change as the implementation, and record unresolved product decisions under [Open questions](#open-questions).

## 1. Users and access

| User type | Access |
| --- | --- |
| Signed-out visitor | Can use the sign-in page. Visiting a protected page redirects to sign-in. |
| `USER` | Can sign in, view and manage their own monthly office-day schedule, view saved office days for other users in their platform, view global events and events for their platform, and sign out. They cannot use administrative management. |
| `SUPER_ADMIN` | Has authenticated user capabilities and can manage users, roles assigned through user management, platforms, platform memberships, work schedules and assignments, Sites and assignments, and global/platform events. |
| `LUNCH` | Can preview and lock one recipient list per lunch date and scan user credentials to track receipt. |

All authenticated users have a personal account identified by email. User accounts are created by an administrator; there is no public registration flow. New accounts receive the `USER` role by default. The system may attach multiple roles to an account. `SUPER_ADMIN` cannot be assigned to another user or removed, but a signed-in SUPER_ADMIN can edit their own email and assignments while retaining that role. SUPER_ADMINs can assign the `LUNCH` role to grant lunch procurement access.

### Access rules

- The planner requires an authenticated session.
- User and platform management require `SUPER_ADMIN`. The frontend hides these routes from unauthorized users; the backend independently enforces authorization for administrative API operations.
- Office-day reads and updates require an authenticated session and always apply to the signed-in account. A caller cannot select another account as the schedule owner.
- Office-day selections for today and past dates are locked. Users may add or remove future dates only; monthly updates preserve saved dates on or before today, and the backend rejects attempts to add such dates.
- Platform office-day reads require an authenticated session and return saved office dates only for colleagues sharing the signed-in user's platform; the caller cannot choose another platform, and their own schedule is excluded from this view.
- Event management requires `SUPER_ADMIN`; authenticated planner reads return global events plus events for the signed-in user's platform. Users cannot select another platform's events.
- Lunch procurement (`/lunch`) and its API endpoints require the `LUNCH` or `SUPER_ADMIN` role; backend authorization is enforced for roster reads and locking.
- A `SUPER_ADMIN` cannot delete their own account. Other protected users cannot be edited; a signed-in SUPER_ADMIN may edit their own account while retaining SUPER_ADMIN access.
- Signing out invalidates the session.

## 2. Feature requirements

### Authentication and account session

- **AUTH-01** — As an account holder, I can sign in with my email and password to access the planner and the features permitted by my role.
- **AUTH-02** — As an account holder, I can see the identity, roles, and optional platform associated with my active session.
- **AUTH-03** — As an account holder, I can sign out, after which the session is no longer valid.
- **AUTH-04** — Invalid credentials or an invalid session do not grant access to protected features.
- **AUTH-05** — When an unauthenticated visitor opens a protected route, successful sign-in returns them to that same route, including its query string; unsafe external return destinations are ignored.
- **AUTH-06** — Unmatched routes show a PwC-themed not-found page with a link home; unauthenticated visitors are routed to sign-in by the existing root route guard.

### Office planner

- **PLAN-01** — As an authenticated user, I can view a monthly calendar and move between months or return to the current month.
- **PLAN-02** — As an authenticated user, I can mark or clear future dates as office days, select remaining weekdays, and clear future selections; today and past dates are locked.
- **PLAN-03** — As an authenticated user, I can save a month's office-day selections and see saved selections when I revisit that month.
- **PLAN-04** — As an authenticated user, I can edit a month before saving; unsaved changes are treated as a draft and save failures are surfaced in the planner.
- **PLAN-05** — The planner shows a weekday count and the next planned office day for the selected month and current date.
- **PLAN-06** — The planner shows upcoming events managed by administrators in chronological order for the selected month, including global events and events scoped to the user's platform. Each event shows its day of the month, time, and location.
- **PLAN-07** — As a `USER` assigned to a platform, I can see the daily count of other platform members with a saved office plan in each calendar cell and select a date to see their email addresses. Counts exclude my own plan; users without a platform do not see the counts or colleague list.

### User and role administration

- **USER-01** — As a `SUPER_ADMIN`, I can view a paginated user list, search the full roster by email or role, and filter users by role, platform, work schedule, and Site.
- **USER-02** — As a `SUPER_ADMIN`, I can create a user with an email and password. The new user receives the `USER` role by default.
- **USER-03** — As a `SUPER_ADMIN`, I can update an eligible user's email, assignable roles, platform, work schedule, and Site, including clearing assignments. I can also edit my own email and assignments while retaining SUPER_ADMIN access. Existing password and linked office-day records are preserved when the email changes.
- **USER-04** — As a `SUPER_ADMIN`, I can delete an eligible user, subject to self-delete and protected-user restrictions.
- **USER-05** — As a `SUPER_ADMIN`, I can view the available platform options and each listed user's optional platform.
- **USER-06** — User listing supports page navigation and page sizes of 10, 25, 50, or 100 in the management interface; the API accepts page sizes up to 100.
- **USER-07** — User creation and update validate email and password/role inputs. Duplicate emails are rejected, and `SUPER_ADMIN` cannot be assigned through this flow. `LUNCH` is assignable to grant lunch procurement access.
- **USER-08** — Role, platform, work-schedule, and Site filter choices for Manage Users are returned together. Search and filters apply across pages and can be combined, including filters for users with no platform, no work schedule, or no Site.
- **USER-09** — As a `SUPER_ADMIN`, I can select multiple editable users and batch update their platform, work schedule, Site, and roles. Each assignment can be left unchanged or set/cleared; role replacement is explicit, and protected users cannot be batch edited.

### Platform administration

- **PLAT-01** — As a `SUPER_ADMIN`, I can view platforms and each platform's member count.
- **PLAT-02** — As a `SUPER_ADMIN`, I can create, edit, list, and delete platforms by name. User platform assignments are managed from Manage Users. A user may belong to zero or one platform; a platform may contain multiple users.
- **PLAT-03** — As a `SUPER_ADMIN`, I can inspect a platform's member email addresses and remove a platform.
- **PLAT-04** — Platform names are required, limited to 20 characters, and unique without regard to letter case.
- **PLAT-05** — Platform names appear in the signed-in user's session profile when the user belongs to those platforms.

### Work schedule administration

- **WSCH-01** — As a `SUPER_ADMIN`, I can list, create, edit, and delete named work schedules by name. User work schedule assignments are managed from Manage Users.
- **WSCH-02** — Work schedule names are required, limited to 10 characters, and unique without regard to letter case.
- **WSCH-03** — A user may have zero or one work schedule; a work schedule may be assigned to multiple users.
- **WSCH-04** — Deleting a work schedule keeps its user accounts and clears their work schedule assignment.

### Site administration

- **SITE-01** - As a SUPER_ADMIN, I can list, create, edit, and delete named Sites. User Site assignments are managed from Manage Users.
- **SITE-02** - Site names are required, limited to 25 characters, and unique without regard to letter case.
- **SITE-03** - A user may have zero or one Site; a Site may be assigned to multiple users.
- **SITE-04** - Deleting a Site keeps its user accounts and clears their Site assignment.

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
- **DASH-04** - As an ADMIN or SUPER_ADMIN, I can filter the RTO dashboard by all Sites or one Site. The Site filter appears above the week selector and applies to attendance totals and every breakdown.

### Lunch procurement

- **LUNCH-01** — As a user with the `LUNCH` or `SUPER_ADMIN` role, I can lock users assigned to a selected Site who have a saved office day on the selected date as free-lunch recipients with one action.
- **LUNCH-06** — Before locking, I can review the roster of users with a saved office day for the selected Site and date, plus a platform-row/work-schedule-column summary.
- **LUNCH-08** — Before locking, I must choose a Site and lunch date, and can filter the eligible roster by platform and work schedule. A user is eligible only when assigned to the selected Site and scheduled for an office day on that date. The Site and date together identify the lock; the summary, breakdown, roster, scan list, and lock action use that Site. Separate Sites can be locked for the same date. There is no All Sites option.
- **LUNCH-09** — The filtered “Users to be included” list supports pagination with selectable page sizes.
- **LUNCH-02** — A Site and date can have only one locked lunch list. Once locked, its Site and recipients cannot be changed.
- **LUNCH-03** — As a user with the `LUNCH` or `SUPER_ADMIN` role, I can scan a recipient's credential to mark lunch received; scans identify recipients not on the locked list and recipients already marked received. The system records the authenticated person in charge who handed out the lunch.
- **LUNCH-04** — The system stores one received status and handout operator identity per locked recipient, Site, and date. Deleted user accounts are removed from recipient records.
- **LUNCH-05** — The daily overview shows recipient received/total counts by platform in rows and work schedule in columns once locked.
- **LUNCH-10** — An authenticated user can see a Lunch badge on calendar dates when a procurement is locked for the user's assigned Site; the calendar lookup exposes dates only, not recipients or receipt details.

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
- The assistant first assesses whether a request or its context can help the authenticated user plan or understand their RTO schedule. It can answer relevant practical questions; when relevance or a needed planning constraint is unclear, it asks a focused clarification before refusing. Clearly unrelated requests are declined. The assistant may use only this application's user-visible events, saved schedule, and accessible team attendance, and must not provide or infer another platform's or company's private RTO information.
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
