import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
export async function staffJobApi(page: Page) {
  const review = {
    id: 91,
    jobId: 83,
    companyId: 12,
    revisionNumber: 2,
    state: "PENDING_REVIEW",
    jobVersion: 5,
    revisionVersion: 7,
    content: {
      title: "Chuyên viên kế toán",
      description: "Kiểm tra chứng từ và lập báo cáo tài chính.\nPhối hợp cùng bộ phận vận hành.",
      location: "Hà Nội",
      employmentType: "FULL_TIME",
      workArrangement: "ONSITE",
      headcount: 2,
      deadline: "2027-12-31T17:00:00Z",
      compensation: {
        disclosed: true,
        minimum: 12000000,
        maximum: 18000000,
        currency: "VND",
        payPeriod: "MONTH",
      },
      screeningQuestions: [
        {
          key: "experience",
          type: "SHORT_TEXT",
          prompt: "Kinh nghiệm kế toán của bạn?",
          required: true,
        },
      ],
    },
    submittedAt: "2026-10-29T08:00:00Z",
    submitterUserId: 22,
    decidedAt: null as string | null,
    reviewerUserId: null as number | null,
    rejectionReason: null as string | null,
    withdrawnAt: null,
    withdrawerUserId: null,
    companyVerified: true,
    companySuspended: false,
    needsReassignment: false,
    approvalEligible: true,
    validationIssues: [] as { field: string; code: string }[],
  };
  const state = {
    review,
    failList: false,
    failHistory: false,
    conflict: false,
    empty: false,
    decisions: 0,
    detailLoads: 0,
    historyLoads: 0,
    listPages: [] as number[],
    filters: [] as string[],
  };
  await page.route("**/api/staff/**", async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.includes("/job")) return route.fallback();
    expect(route.request().headers().authorization).toMatch(/^Bearer mock-access-/);
    const json = (data: unknown) => route.fulfill({ json: { status: 200, data } });
    const paged = (content: unknown[], total = content.length) =>
      json({
        content,
        pageNumber: Number(url.searchParams.get("page") || 0),
        pageSize: 20,
        totalElements: total,
        totalPages: Math.ceil(total / 20),
      });
    if (url.pathname.endsWith("/decision")) {
      state.decisions++;
      const body = route.request().postDataJSON();
      expect(route.request().method()).toBe("PUT");
      expect(body.expectedJobVersion).toBe(review.jobVersion);
      expect(body.expectedRevisionVersion).toBe(review.revisionVersion);
      if (state.conflict)
        return route.fulfill({ status: 409, json: { message: "40022 CONCURRENT_MODIFICATION" } });
      review.state = body.outcome;
      review.rejectionReason = body.reason;
      review.reviewerUserId = 4;
      review.decidedAt = "2026-10-30T08:00:00Z";
      review.jobVersion++;
      review.revisionVersion++;
      review.approvalEligible = false;
      return json({
        jobId: 83,
        revisionId: 91,
        outcome: body.outcome,
        publicationStatus: "PAUSED",
        jobVersion: review.jobVersion,
        revisionVersion: review.revisionVersion,
      });
    }
    if (url.pathname === "/api/staff/job-revisions/91") {
      state.detailLoads++;
      return json(review);
    }
    if (url.pathname === "/api/staff/jobs/83/revisions") {
      state.historyLoads++;
      if (state.failHistory)
        return route.fulfill({ status: 503, json: { message: "unavailable" } });
      return paged([review]);
    }
    if (url.pathname === "/api/staff/job-revisions") {
      if (state.failList) return route.fulfill({ status: 503, json: { message: "unavailable" } });
      const status = url.searchParams.get("status")!;
      const currentPage = Number(url.searchParams.get("page"));
      state.listPages.push(currentPage);
      state.filters.push(status);
      if (state.empty || (status !== "ALL" && status !== review.state)) return paged([]);
      return paged(
        currentPage === 0
          ? Array.from({ length: 20 }, (_, i) => ({
              ...review,
              id: 91 + i,
              content: { ...review.content, title: i ? `Tin kế toán ${i}` : review.content.title },
            }))
          : [{ ...review, id: 112 }],
        21,
      );
    }
    return route.fulfill({ status: 404, json: { message: "Unexpected staff job request" } });
  });
  return state;
}
