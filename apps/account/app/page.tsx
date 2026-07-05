/**
 * Profile view page — maps to /account
 *
 * Server Component: fetches session + profile data server-side.
 * Displays: name, email, phone, address, avatar.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth-guard";
import { getProfile, type UserProfile } from "@/lib/api-client";

export default async function AccountPage() {
  // redirect to login if unauthenticated
  await requireAuth();

  let profile: UserProfile | null = null;
  let fetchError: string | null = null;

  try {
    // Forward cookies for authentication
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    
    profile = await getProfile(cookieHeader);
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Failed to load profile.";
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Profile</h1>
          <Link href="/edit" style={styles.editLink}>
            Edit Profile
          </Link>
        </div>

        {fetchError && (
          <div role="alert" style={styles.errorBanner}>
            {fetchError}
          </div>
        )}

        {profile && (
          <div style={styles.profileBody}>
            {/* Avatar */}
            <div style={styles.avatarSection}>
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt={`${profile.name ?? "User"} avatar`}
                  style={styles.avatarImg}
                />
              ) : (
                <div style={styles.avatarPlaceholder} aria-label="No avatar">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>

            {/* Profile fields */}
            <dl style={styles.fieldList}>
              <ProfileField label="Full Name" value={profile.name} />
              <ProfileField label="Email" value={profile.email} />
              <ProfileField label="Phone" value={profile.phone ?? "—"} />
              <ProfileField label="Address" value={profile.address ?? "—"} />
            </dl>
          </div>
        )}
      </div>
    </main>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div style={styles.field}>
      <dt style={styles.fieldLabel}>{label}</dt>
      <dd style={styles.fieldValue}>{value}</dd>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const styles = {
  main: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    padding: "40px 16px",
  } as React.CSSProperties,

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    padding: "32px",
    width: "100%",
    maxWidth: "560px",
  } as React.CSSProperties,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  } as React.CSSProperties,

  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  } as React.CSSProperties,

  editLink: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 20px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    textDecoration: "none",
  } as React.CSSProperties,

  errorBanner: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "12px 16px",
    marginBottom: "24px",
    fontSize: "14px",
  } as React.CSSProperties,

  profileBody: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  } as React.CSSProperties,

  avatarSection: {
    display: "flex",
    justifyContent: "center",
  } as React.CSSProperties,

  avatarImg: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    objectFit: "cover" as const,
    border: "2px solid #e5e7eb",
  } as React.CSSProperties,

  avatarPlaceholder: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: "36px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,

  fieldList: {
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  } as React.CSSProperties,

  field: {
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "16px",
  } as React.CSSProperties,

  fieldLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "4px",
  } as React.CSSProperties,

  fieldValue: {
    fontSize: "16px",
    color: "#111827",
    margin: 0,
  } as React.CSSProperties,
} as const;
