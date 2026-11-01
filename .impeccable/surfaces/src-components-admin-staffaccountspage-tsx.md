---
version: 1
slug: "src-components-admin-staffaccountspage-tsx"
primary_target: "src/components/admin/StaffAccountsPage.tsx"
related_targets: ["src/components/admin/staff-accounts.css", "src/services/staffAccounts.ts"]
---

# Staff account operations

Mode: Operate. Extend the incumbent Guardian Blue workspace using the existing admin shell, white bordered panels, inherited Hanken Grotesk typography, compact tables, and semantic status badges. Preserve the root design system.

Provide user and company tabs with a labeled search field, paginated results, and a separate account detail view. Keep company verification status distinct from access restrictions. Account data and ban/unban permissions come from the staff account API; do not infer authorization from presentation state.

Ban and unban actions require a confirmation dialog and reason. Bans offer temporary expiry or permanence. Explain the consequence before submission, show current restriction information in the detail view, and use semantic error color for destructive confirmation. Display times in Vietnam time.

Use the shared admin pagination with this endpoint's local page size of 20. Search and tab changes reset pagination. Preserve loading, empty, retry, stale-detail, and mutation feedback states. Retain accessible table overflow on desktop. Preserve keyboard tab navigation, visible focus, dialog focus behavior, and return focus when closing detail.

Staff action confirmations use the shared bottom-right toast host in StaffShell, with semantic status icons, a Vietnamese dismiss control, a six-second duration, and desktop viewport insets. Keep correction and retry errors beside their form fields.
