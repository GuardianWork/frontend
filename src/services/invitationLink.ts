// Invitation credentials live only in this browser tab's memory, never in storage or navigation.
let pendingSecret = "";
export function captureInvitationLink() {
  if (typeof window === "undefined") return "";
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  if (fragment.has("secret")) {
    pendingSecret = fragment.get("secret") || "";
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  return pendingSecret;
}
export function hasPendingInvitation() {
  return Boolean(pendingSecret);
}
export function clearInvitationLink() {
  pendingSecret = "";
}
