export function readSessionRevokeAllButtonLabel(armed: boolean) {
  return armed ? "Confirm sign out" : "Sign out everywhere"
}

export function readSessionRevokeAllHelperText(armed: boolean) {
  return armed
    ? "This signs out every active web and admin session for this account. Select Confirm sign out to continue."
    : "Use this if a device is lost or an account session looks unfamiliar. Select Sign out everywhere once to confirm your intent."
}
