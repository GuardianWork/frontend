const assets = {
  discovery: ["01-candidate-job-discovery.webp", 278, 324],
  teamwork: ["04-recruiter-teamwork.webp", 500, 304],
  onboarding: ["recruiter-login-illustration.webp", 640, 463],
  posting: ["06-recruiter-job-posting-clean.webp", 313, 302],
  review: ["07-staff-dossier-review.webp", 289, 354],
  careers: ["08-multi-industry-careers.webp", 496, 281],
  growth: ["09-career-growth-clean.webp", 306, 280],
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
  const src = `/images/guardianwork/${file}`;
  return (
    <picture className={`guardian-art ${desktopOnly ? "guardian-art--desktop" : ""} ${className}`}>
      {desktopOnly && <source media="(min-width: 1100px)" srcSet={src} />}
      <img
        src={desktopOnly ? "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" : src}
        width={width}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}
