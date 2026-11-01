import { ListSearch } from "@/components/ListSearch";
import { matchesSearch } from "@/lib/list-search";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RecruiterOverview } from "@/components/RecruiterOverview";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/rec/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Tổng quan tuyển dụng — GuardianWork" },
      {
        name: "description",
        content: "Quản lý tin tuyển dụng, hồ sơ công ty và xem danh sách ứng viên minh họa.",
      },
    ],
  }),
  component: RecruiterIndexPage,
});

type CandidateItem = {
  id: string;
  role: string;
  location: string;
  experience: string;
  fit: "STRONG FIT" | "GOOD FIT" | "MATCH";
  matchRate: number;
  stage: "Applied" | "Audited" | "Interview" | "Offer";
  description: string;
  skills: string[];
};

const CANDIDATES: CandidateItem[] = [
  {
    id: "sc-1",
    role: "Kỹ sư Hệ thống Cấp cao",
    location: "TP. Hồ Chí Minh, Việt Nam",
    experience: "6 năm K8s & Go",
    fit: "STRONG FIT",
    matchRate: 98,
    stage: "Interview",
    description:
      "6 năm quản lý hạ tầng Kubernetes. Chuyên sâu về cổng lưu lượng lớn, vi dịch vụ viết bằng Go và giám sát hệ thống bằng Prometheus.",
    skills: ["Kubernetes", "Go", "Docker", "Prometheus", "Distributed Systems"],
  },
  {
    id: "sc-2",
    role: "Kỹ sư Backend Cấp cao (Go)",
    location: "TP. Hồ Chí Minh, Việt Nam",
    experience: "5 năm Go & Redis",
    fit: "STRONG FIT",
    matchRate: 96,
    stage: "Audited",
    description:
      "5 năm kinh nghiệm xây dựng các cổng API an toàn bằng Go. Chuyên môn sâu về bộ nhớ đệm Redis, tối ưu hóa truy vấn PostgreSQL và tích hợp Kafka.",
    skills: ["Go", "Redis", "PostgreSQL", "Kafka", "High Throughput"],
  },
  {
    id: "sc-3",
    role: "Kỹ sư DevOps Nền tảng",
    location: "Hà Nội, Việt Nam",
    experience: "4 năm Terraform",
    fit: "GOOD FIT",
    matchRate: 89,
    stage: "Applied",
    description:
      "Kỹ sư lập trình Go vững vàng với 4 năm tự động hóa hạ tầng bằng Ansible, Terraform và Docker Swarm.",
    skills: ["Ansible", "Terraform", "Docker Swarm", "CI/CD", "Linux"],
  },
  {
    id: "sc-4",
    role: "Kỹ sư Di động Cấp cao",
    location: "Hà Nội, Việt Nam",
    experience: "5 năm React Native",
    fit: "STRONG FIT",
    matchRate: 95,
    stage: "Interview",
    description:
      "5 năm xây dựng ứng dụng di động native và React Native. Chuyên gia tối ưu hóa hiệu năng UI và tích hợp ZaloPay.",
    skills: ["React Native", "TypeScript", "iOS Native", "Android", "Payment SDK"],
  },
  {
    id: "sc-5",
    role: "Kỹ sư React Native",
    location: "Hà Nội, Việt Nam",
    experience: "3 năm TypeScript",
    fit: "GOOD FIT",
    matchRate: 85,
    stage: "Applied",
    description:
      "3 năm kinh nghiệm phát triển ứng dụng di động đa nền tảng. Thành thạo TypeScript, Redux Toolkit và lưu trữ token bảo mật.",
    skills: ["React Native", "Redux Toolkit", "Security", "REST API"],
  },
  {
    id: "sc-6",
    role: "Kỹ sư Frontend Cấp cao",
    location: "TP. Hồ Chí Minh, Việt Nam",
    experience: "7 năm React Architecture",
    fit: "STRONG FIT",
    matchRate: 97,
    stage: "Offer",
    description:
      "7 năm thiết kế kiến trúc React hiệu năng cao và hệ thống thiết kế web (Design Systems).",
    skills: ["React", "Next.js", "Design Systems", "Web Performance", "TypeScript"],
  },
];

const fitLabels = { "STRONG FIT": "Phù hợp cao", "GOOD FIT": "Phù hợp tốt", MATCH: "Phù hợp" };
const stageLabels = {
  Applied: "Đã ứng tuyển",
  Audited: "Đã đánh giá",
  Interview: "Phỏng vấn",
  Offer: "Đã gửi đề nghị",
};

function fitBadgeClass(fit: CandidateItem["fit"]) {
  return fit === "STRONG FIT" ? "status-tag status-tag--success" : "status-tag";
}

function RecruiterIndexPage() {
  const [candidates, setCandidates] = useState<CandidateItem[]>(CANDIDATES);
  const [selectedId, setSelectedId] = useState(CANDIDATES[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "strong" | "interview">("all");
  const [pitchedCandidateId, setPitchedCandidateId] = useState<string | null>(null);

  const filteredCandidates = candidates.filter((c) => {
    if (!matchesSearch(query, c.role, c.location, c.experience, ...c.skills)) return false;
    if (filter === "strong") return c.fit === "STRONG FIT";
    if (filter === "interview") return c.stage === "Interview" || c.stage === "Offer";
    return true;
  });

  const activeCandidate =
    filteredCandidates.find((c) => c.id === selectedId) || filteredCandidates[0];
  const pitchSent = pitchedCandidateId === activeCandidate?.id;

  const handleUpdateStage = (newStage: CandidateItem["stage"]) => {
    if (!activeCandidate) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === activeCandidate.id ? { ...c, stage: newStage } : c)),
    );
  };

  return (
    <AdminShell title="Tổng quan" role="recruiter">
      <RecruiterOverview
        total={candidates.length}
        strong={candidates.filter((c) => c.fit === "STRONG FIT").length}
        interviews={candidates.filter((c) => c.stage === "Interview").length}
        offers={candidates.filter((c) => c.stage === "Offer").length}
      />
      <details open className="workspace-data-note">
        <summary>Danh sách ứng viên minh họa</summary>
        <p>
          Thử gửi lời mời chỉ ghi nhận thao tác, không gửi tin nhắn tới ứng viên. Danh sách ứng viên
          và tiến độ dưới đây là dữ liệu minh họa. Cập nhật tiến độ chỉ áp dụng trong phiên xem; hồ
          sơ công ty sử dụng dịch vụ xác minh riêng.
        </p>
      </details>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Theo dõi ứng viên</h2>
        <Link to="/rec/talent" className="text-sm font-semibold text-primary">
          Xem tất cả ứng viên →
        </Link>
      </div>
      <ListSearch
        value={query}
        onChange={setQuery}
        label="Tìm chức danh, kỹ năng hoặc địa điểm"
        count={filteredCandidates.length}
      />
      {/* Main Split Grid */}
      <div className="workspace-split">
        {/* Left Pane: Candidates list */}
        <div className="workspace-result-list">
          <div className="workspace-tabs">
            <div className="flex flex-wrap gap-2">
              <button
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                  filter === "all"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text"
                }`}
              >
                Tất cả ({candidates.length})
              </button>
              <button
                aria-pressed={filter === "strong"}
                onClick={() => setFilter("strong")}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                  filter === "strong"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text"
                }`}
              >
                Phù hợp cao
              </button>
              <button
                aria-pressed={filter === "interview"}
                onClick={() => setFilter("interview")}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                  filter === "interview"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text"
                }`}
              >
                Phỏng vấn & đề nghị
              </button>
            </div>
            <span className="text-sm text-charcoal-40">Dữ liệu minh họa</span>
          </div>

          {filteredCandidates.length === 0 && (
            <p className="p-6 text-sm text-charcoal-83">
              Không tìm thấy ứng viên phù hợp. Hãy đổi từ khóa hoặc bộ lọc.
            </p>
          )}
          {filteredCandidates.map((c) => {
            const isActive = c.id === activeCandidate?.id;
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(c.id);
                    setPitchedCandidateId(null);
                  }
                }}
                onClick={() => {
                  setSelectedId(c.id);
                  setPitchedCandidateId(null);
                }}
                className={isActive ? "workspace-result is-selected" : "workspace-result"}
              >
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight text-charcoal-text">
                      {c.role}
                    </h3>
                    <p className="text-sm text-charcoal-83 mt-0.5 font-medium">{c.location}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${fitBadgeClass(c.fit)}`}
                  >
                    {fitLabels[c.fit]}
                  </span>
                </div>

                <p className="text-sm text-charcoal-83 line-clamp-2 mt-2 leading-relaxed">
                  {c.description}
                </p>

                <div className="mt-3 pt-3 border-t border-warm-border flex items-center justify-between text-sm">
                  <span className="text-sm font-semibold text-primary">
                    Kinh nghiệm: {c.experience}
                  </span>
                  <span className="text-xs font-bold text-charcoal-40 bg-surface-container px-2 py-0.5 rounded">
                    Tiến độ: {stageLabels[c.stage]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Pane: Candidate Inspector & Pipeline Tracker */}
        {activeCandidate && (
          <div className="workspace-detail-column">
            <div className="workspace-detail">
              {/* Header */}
              <div className="workspace-detail-header">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-paper-2 text-ink border border-rule">
                      Mức độ phù hợp: {activeCandidate.matchRate}%
                    </span>
                    <span className="text-sm text-charcoal-40">
                      ID: #{activeCandidate.id.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-charcoal-text mt-1">
                    {activeCandidate.role}
                  </h3>
                  <p className="text-sm text-charcoal-83 font-medium">{activeCandidate.location}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPitchedCandidateId(activeCandidate.id)}
                    className="px-4 py-2 bg-primary text-on-primary text-sm font-bold rounded-lg hover:opacity-90 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Icon name="send" className="!text-base" />
                    <span aria-live="polite">
                      {pitchSent ? "Đã thử gửi lời mời" : "Thử gửi lời mời"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="workspace-prose">
                {/* Pipeline Stage Control */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-warm-border">
                  <span className="text-sm font-semibold text-charcoal-40 block mb-2">
                    Tiến độ tuyển dụng · chỉ lưu trong phiên này
                  </span>
                  <div
                    role="group"
                    aria-label="Tiến độ tuyển dụng"
                    className="recruiter-stage-controls"
                  >
                    {(["Applied", "Audited", "Interview", "Offer"] as const).map((st) => (
                      <button
                        key={stageLabels[st]}
                        aria-pressed={activeCandidate.stage === st}
                        onClick={() => handleUpdateStage(st)}
                        className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                          activeCandidate.stage === st
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-paper-white border border-warm-border text-charcoal-83 hover:bg-surface-container"
                        }`}
                      >
                        {stageLabels[st]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Verification Note */}
                <div className="workspace-reference-note flex gap-4">
                  <Icon name="verified_user" className="text-primary mt-0.5 !text-2xl shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal-text mb-1">
                      Thông tin ứng viên minh họa
                    </h4>
                    <p className="text-sm text-charcoal-83 leading-relaxed mb-2">
                      Hồ sơ, kỹ năng và mức độ phù hợp là dữ liệu mẫu, chưa được xác thực. Thao tác
                      trên trang này không gửi tin nhắn tới ứng viên.
                    </p>
                    <div className="text-sm text-charcoal-83 flex items-center gap-1">
                      <Icon name="info" className="!text-sm" /> Tiến độ chỉ được lưu trong phiên xem
                    </div>
                  </div>
                </div>

                {/* Candidate Experience */}
                <div>
                  <h4 className="font-semibold text-sm text-charcoal-40 mb-2 flex items-center gap-2">
                    <Icon name="account_box" className="!text-[18px]" />
                    Tổng quan năng lực ứng viên
                  </h4>
                  <div className="text-[15px] leading-7 text-charcoal-text">
                    {activeCandidate.description}
                  </div>
                </div>

                {/* Skills Tags */}
                <div>
                  <h4 className="font-semibold text-sm text-charcoal-40 mb-2">
                    Kỹ năng trong hồ sơ mẫu
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeCandidate.skills.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 bg-surface-container border border-warm-border rounded-md text-sm font-semibold text-charcoal-text"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Automated Outreach Pitch Draft */}
                <div>
                  <h4 className="font-semibold text-sm text-charcoal-40 mb-2 flex items-center gap-2">
                    <Icon name="mark_email_read" className="!text-[18px] text-primary" />
                    Mẫu tin nhắn mời trao đổi
                  </h4>
                  <div className="text-[15px] leading-7 text-charcoal-text">
                    Chào bạn, chúng tôi theo dõi hồ sơ {activeCandidate.role} của bạn với chuyên môn
                    nổi bật về {activeCandidate.skills.slice(0, 3).join(", ")}. Công ty chúng tôi có
                    vị trí tương ứng với chuyên môn của bạn. Bạn có sẵn sàng trao đổi ngắn 15 phút
                    tuần này không?
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Job Modal with AI Compliance Guard */}
    </AdminShell>
  );
}
