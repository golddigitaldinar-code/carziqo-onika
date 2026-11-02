# Project memory

## Product intent & audience

- Car rental/income platform with a member-facing app and a separate administrative workspace.
- Members can rent cars, manage wallet funds, request cash-ins and withdrawals, and monitor active rentals.
- Administrators oversee financial requests, member accounts, balances, and fleet inventory.

## Brand personality & voice

- Production-oriented, trustworthy, and operationally clear.
- Financial and account actions should use precise labels, visible statuses, confirmations, and audit-friendly explanations.
- Avoid ambiguity around approval, rejection, blocking, balance changes, and rental earnings.

## Visual design & UX direction

- Keep the member experience and admin experience clearly separated; admin access is available at `/admin`.
- Admin workspace should prioritize dashboards, tables/lists, filters or status views, detail panels, and explicit action controls for high-impact operations.
- Show clear status treatments for pending, approved, rejected, blocked, and active records.
- Cash-in requests should expose payment proof images; withdrawal requests should show the member’s withdrawal address/details.
- Balance edits should provide a live resulting-balance preview, require a reason, and surface the resulting transaction record.
- Car management should support creating and editing inventory details including price, daily return, stock, category, and imagery.
- Blocked members should be visually distinct and unable to continue using the member app until unblocked.
- Live Fleet cards should show the rented car image and key rental details, with an expandable interaction for the full description, rental period, daily income, total return, days remaining, accrued earnings, start date, and progress through the rental term.
- Favor responsive cards and readable data layouts so operational details remain usable on smaller screens.

## Decisions, constraints & rationale

- Admin functionality is separated from the user application rather than mixed into member navigation.
- Admin authentication uses a dedicated username/password flow, with password change available from the admin Account area; do not expose credentials in UI copy or client-visible documentation.
- Admin actions cover:
  - approving or rejecting cash-in requests;
  - approving or rejecting withdrawals;
  - adding and editing cars;
  - crediting or deducting member balances;
  - blocking and unblocking members.
- Balance adjustments are recorded as transactions and should retain the admin-provided reason.
- Blocking a member signs them out and prevents subsequent sign-in until access is restored.
- The data layer includes the database functions and migrations required by rentals, daily earnings, points exchange, referrals, game/mall features, admin access, and related triggers.
- Existing implementation reportedly builds successfully; typecheck previously timed out due to resources and should be treated separately from build verification.
- Continue using the existing Vite/React architecture and project conventions; avoid introducing unnecessary UI dependencies.

## Open questions & assumptions

- Exact role model and whether multiple admin accounts or admin permission levels are needed are not established.
- Authentication/security details beyond username/password (session expiry, MFA, rate limiting, password recovery, and audit logs) are unspecified.
- Approval workflows, including whether rejection requires a reason and whether approved actions can be reversed, remain undefined.
- Currency, balance limits, withdrawal rules, and required validation for manual balance edits are not documented.
- It is assumed the current rental records contain enough data to populate the expanded Live Fleet details; fallback behavior for missing legacy fields may be needed.
- It is unclear whether admin activity history, member notifications, or real-time updates are required after approvals and account changes.