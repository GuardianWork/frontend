/**
 * Loading placeholders for the job browser. Each block mirrors the listing or detail
 * it replaces, so the page keeps its shape while postings arrive instead of flashing
 * the "no results" state. The single live message lives in the results heading.
 */

import type { CSSProperties } from "react";

const GRID_CARDS = 9;
const STACK_CARDS = 4;
const DETAIL_ROWS = 4;

/** Stagger the sheen so the grid breathes instead of pulsing in unison. */
function skeletonDelay(index: number) {
  return { "--skeleton-delay": `${(index % 4) * 110}ms` } as CSSProperties;
}

function Bar({ width, height, className }: { width: string; height?: number; className?: string }) {
  return (
    <span
      className={`career-skeleton__bar${className ? ` ${className}` : ""}`}
      style={{ width, ...(height ? { height } : {}) }}
    />
  );
}

function JobCardSkeleton({ index }: { index: number }) {
  return (
    <div className="career-skeleton__card" style={skeletonDelay(index)}>
      <div className="career-skeleton__company">
        <span className="career-skeleton__mark" />
        <Bar width="42%" />
        <span className="career-skeleton__pill" />
      </div>
      <div className="career-skeleton__title">
        <Bar width="88%" height={17} />
        <Bar width="56%" height={17} />
      </div>
      <Bar width="38%" height={14} className="career-skeleton__salary" />
      <div className="career-skeleton__location">
        <span className="career-skeleton__dot" />
        <Bar width="30%" />
      </div>
      <div className="career-skeleton__bottom">
        <Bar width="46%" height={10} />
        <Bar width="76px" height={10} />
      </div>
    </div>
  );
}

/** The catalogue grid, or the keyword stack plus its reading pane. */
export function JobListSkeleton({
  split = false,
  count = GRID_CARDS,
}: {
  split?: boolean;
  count?: number;
}) {
  if (split)
    return (
      <div className="career-split" aria-hidden="true">
        <div className="career-split__stack">
          {Array.from({ length: STACK_CARDS }, (_, index) => (
            <JobCardSkeleton key={index} index={index} />
          ))}
        </div>
        <div className="career-split__detail">
          <JobDetailSkeleton embedded />
        </div>
      </div>
    );

  return (
    <div className="career-job-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <JobCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

function DetailLine({ width }: { width: string }) {
  return <Bar width={width} height={11} />;
}

/** One listing sheet: header, description, verification note, apply card and facts. */
export function JobDetailSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <>
      {!embedded && (
        <p className="sr-only" role="status">
          Đang tải tin tuyển dụng…
        </p>
      )}
      <article
        className={`${embedded ? "career-detail career-detail--pane" : "career-container career-detail"} career-skeleton`}
        aria-hidden="true"
        style={skeletonDelay(0)}
      >
        {!embedded && (
          <div className="career-skeleton__back">
            <Bar width="132px" height={12} />
          </div>
        )}
        <div className="career-detail__layout">
          <div className="career-detail__sheet">
            <header className="career-detail__header">
              <div className="career-detail__company">
                <span className="career-skeleton__mark career-skeleton__mark--lg" />
                <div className="career-skeleton__stack">
                  <Bar width="160px" />
                  <span className="career-skeleton__pill" />
                </div>
              </div>
              <div className="career-skeleton__title career-skeleton__title--detail">
                <Bar width="92%" height={22} />
                <Bar width="58%" height={22} />
              </div>
              <div className="career-skeleton__meta">
                {Array.from({ length: DETAIL_ROWS }, (_, index) => (
                  <span key={index} className="career-skeleton__meta-item">
                    <span className="career-skeleton__dot" />
                    <Bar width={["86px", "112px", "98px", "74px"][index]} />
                  </span>
                ))}
              </div>
            </header>

            <div className="career-detail__main">
              <section className="career-skeleton__section">
                <Bar width="172px" height={16} className="career-skeleton__heading" />
                {["100%", "94%", "88%", "62%"].map((width) => (
                  <DetailLine key={width} width={width} />
                ))}
              </section>
              <section className="career-skeleton__section">
                <Bar width="146px" height={16} className="career-skeleton__heading" />
                {["96%", "90%", "72%"].map((width) => (
                  <DetailLine key={width} width={width} />
                ))}
              </section>
              <section className="career-skeleton__section">
                <Bar width="132px" height={16} className="career-skeleton__heading" />
                <div className="career-skeleton__note">
                  <DetailLine width="92%" />
                  <DetailLine width="78%" />
                </div>
              </section>
            </div>
          </div>

          <aside className="career-detail__aside">
            <div className="career-apply-card">
              <Bar width="150px" height={16} />
              <DetailLine width="96%" />
              <DetailLine width="74%" />
              <span className="career-skeleton__button" />
              <DetailLine width="88%" />
            </div>
            <div className="career-facts">
              <Bar width="120px" height={14} />
              <div className="career-skeleton__facts">
                {["72px", "58px", "64px", "80px"].map((label, index) => (
                  <span key={label} className="career-skeleton__fact">
                    <Bar width={label} height={10} />
                    <Bar width={["96px", "72px", "88px", "64px"][index]} height={10} />
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
