---
version: 1
slug: "src-routes-admin-compliance-tsx"
primary_target: "src/routes/admin/compliance.tsx"
related_targets: ["src/components/admin/compliance.css", "src/components/admin/AdminPagination.tsx", "src/components/admin/pagination.css", "src/components/admin/AdminDraftPage.tsx", "src/routes/admin/verifications.tsx"]
---

# Admin published job moderation

Mode: Operate. Preserve Guardian Blue, Hanken Grotesk, white panels, restrained semantic statuses, and existing admin navigation.

The list contains already-published JDs flagged by AI. Admins inspect the JD and detection excerpts, record review, or change publication visibility after publication. There is no job prepublication approval step. Company verification remains a separate workflow.

AI findings and moderation actions are explicitly illustrative until a backend API is available. Never imply sample actions persist to the backend.

All admin record lists use shared pagination with a default of 10 records per page, visible ranges, accessible previous/next controls, and disabled boundaries. Filters reset to the first page. Company verification uses API pagination; sample lists paginate locally. Phone controls preserve their touch targets and fit the viewport.
