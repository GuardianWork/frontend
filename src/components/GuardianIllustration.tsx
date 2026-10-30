const assets = {
  discovery: ["01-candidate-job-discovery.png", 446, 380],
  teamwork: ["04-recruiter-teamwork.png", 585, 334],
  onboarding: ["recruiter-login-illustration.png", 481, 338],
  posting: ["06-recruiter-job-posting-clean.png", 529, 312],
  review: ["07-staff-dossier-review.png", 430, 320],
  careers: ["08-multi-industry-careers.png", 575, 325],
  growth: ["09-career-growth-clean.png", 519, 313],
} as const;

/** Decorative art repeats adjacent HTML. A picture source avoids fetching hidden desktop art. */
export function GuardianIllustration({
  name,
  className = "",
  desktopOnly = false,
}: {
  name: keyof typeof assets;
  className?: string;
  desktopOnly?: boolean;
}) {
  const [file, width, height] = assets[name];
  const src = `/images/illustrations/${file}`;
  return (
    <picture className={`guardian-art ${desktopOnly ? "guardian-art--desktop" : ""} ${className}`}>
      {desktopOnly && <source media="(min-width: 1100px)" srcSet={src} />}
      <img
        src={desktopOnly ? "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" : src}
        width={width}
        height={height}
        alt=""
        loading={name === "careers" ? "eager" : "lazy"}
        fetchPriority={name === "careers" ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}
