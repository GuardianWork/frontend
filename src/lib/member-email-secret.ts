// Memory only: never persist the secret in storage, router state, logs or analytics.
let pendingSecret: string | null = null;
let invitationSecret: string | null = null;
export function captureMemberEmailSecret() {
  if (typeof window === "undefined") return;
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const invitation = fragment.get("secret");
  if (invitation !== null) {
    invitationSecret = invitation;
    fragment.delete("secret");
  }
  const secret = fragment.get("memberEmailSecret");
  if (secret !== null) {
    pendingSecret = secret;
    fragment.delete("memberEmailSecret");
  }
  if (secret !== null || invitation !== null) {
    const remainder = fragment.toString();
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search + (remainder ? `#${remainder}` : ""),
    );
  }
}
export function getMemberEmailSecret() {
  return pendingSecret;
}
export function clearMemberEmailSecret() {
  pendingSecret = null;
}

let legacyRegistrationLink = false;
export function isLegacyRegistrationLink() {
  return legacyRegistrationLink;
}
export function captureLegacyRegistrationLink() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of ["registrationId", "continuationToken"]) {
    if (url.searchParams.has(key)) {
      legacyRegistrationLink = true;
      url.searchParams.delete(key);
    }
  }
  if (legacyRegistrationLink)
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

export function getInvitationSecret() {
  return invitationSecret;
}
export function clearInvitationSecret() {
  invitationSecret = null;
}
