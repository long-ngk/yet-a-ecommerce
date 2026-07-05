"use client";

/**
 * Profile edit page — maps to /account/edit
 *
 * Client Component: manages form state, client-side validation,
 * and dispatches profile:update Custom Event on successful save.
 */
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { dispatch } from "@yet-a-ecommerce/communication";
import { loadProfile, saveProfile } from "@/lib/actions";
import type { UserProfile } from "@/lib/api-client";

// ─── Validation ───────────────────────────────────────────────────────────────

/** Phone format regex */
const PHONE_REGEX = /^[+]?[\d\s\-()\u0028\u0029]{7,20}$/;

interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

function validate(fields: {
  name: string;
  phone: string;
  address: string;
  avatar: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Full name is required.";
  }

  if (fields.phone.trim() && !PHONE_REGEX.test(fields.phone.trim())) {
    errors.phone =
      "Phone number must be 7–20 characters and may include digits, spaces, +, -, (, ).";
  }

  if (fields.avatar.trim()) {
    try {
      new URL(fields.avatar.trim());
    } catch {
      errors.avatar = "Avatar must be a valid URL.";
    }
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter();

  // Form field state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState("");

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load current profile on mount
  useEffect(() => {
    let cancelled = false;

    loadProfile()
      .then((profile: UserProfile) => {
        if (!cancelled) {
          setName(profile.name ?? "");
          setPhone(profile.phone ?? "");
          setAddress(profile.address ?? "");
          setAvatar(profile.avatar ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          // If we can't load the profile, redirect to view page
          router.replace("/account");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // client-side validation with field-specific errors
    const validationErrors = validate({ name, phone, address, avatar });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      // call server action to update profile
      const updated = await saveProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });

      // dispatch profile:update Custom Event with new name
      dispatch("profile:update", {
        type: "profile:update",
        data: { name: updated.name },
        timestamp: Date.now(),
        source: "account",
      });

      setNotification({
        type: "success",
        message: "Profile updated successfully.",
      });

      // Navigate back to view page after short delay
      setTimeout(() => router.push("/account"), 1500);
    } catch (err) {
      // show error notification on failure
      setNotification({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to save profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={{ color: "#6b7280", textAlign: "center" }}>
            Loading profile…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Edit Profile</h1>
          <button
            type="button"
            onClick={() => router.push("/account")}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div
            role="alert"
            aria-live="polite"
            style={
              notification.type === "success"
                ? styles.notificationSuccess
                : styles.notificationError
            }
          >
            {notification.message}
          </div>
        )}

        {/* Edit form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {/* Full Name */}
          <div style={styles.fieldGroup}>
            <label htmlFor="name" style={styles.label}>
              Full Name <span style={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-describedby={errors.name ? "name-error" : undefined}
              aria-invalid={!!errors.name}
              style={errors.name ? { ...styles.input, ...styles.inputError } : styles.input}
              autoComplete="name"
            />
            {errors.name && (
              <p id="name-error" role="alert" style={styles.fieldError}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div style={styles.fieldGroup}>
            <label htmlFor="phone" style={styles.label}>
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              aria-invalid={!!errors.phone}
              placeholder="+1 (555) 000-0000"
              style={errors.phone ? { ...styles.input, ...styles.inputError } : styles.input}
              autoComplete="tel"
            />
            {errors.phone && (
              <p id="phone-error" role="alert" style={styles.fieldError}>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Address */}
          <div style={styles.fieldGroup}>
            <label htmlFor="address" style={styles.label}>
              Address
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-describedby={errors.address ? "address-error" : undefined}
              aria-invalid={!!errors.address}
              rows={3}
              style={
                errors.address
                  ? { ...styles.input, ...styles.inputError, resize: "vertical" }
                  : { ...styles.input, resize: "vertical" }
              }
              autoComplete="street-address"
            />
            {errors.address && (
              <p id="address-error" role="alert" style={styles.fieldError}>
                {errors.address}
              </p>
            )}
          </div>

          {/* Avatar URL */}
          <div style={styles.fieldGroup}>
            <label htmlFor="avatar" style={styles.label}>
              Avatar URL
            </label>
            <input
              id="avatar"
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              aria-describedby={errors.avatar ? "avatar-error" : undefined}
              aria-invalid={!!errors.avatar}
              placeholder="https://example.com/avatar.jpg"
              style={errors.avatar ? { ...styles.input, ...styles.inputError } : styles.input}
            />
            {errors.avatar && (
              <p id="avatar-error" role="alert" style={styles.fieldError}>
                {errors.avatar}
              </p>
            )}
            {/* Avatar preview */}
            {avatar.trim() && !errors.avatar && (
              <div style={styles.avatarPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar.trim()}
                  alt="Avatar preview"
                  style={styles.avatarImg}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={styles.actions}>
            <button
              type="submit"
              disabled={saving}
              style={saving ? { ...styles.saveBtn, opacity: 0.6, cursor: "not-allowed" } : styles.saveBtn}
              aria-busy={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
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

  cancelBtn: {
    padding: "8px 20px",
    backgroundColor: "transparent",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  } as React.CSSProperties,

  notificationSuccess: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "6px",
    padding: "12px 16px",
    marginBottom: "20px",
    fontSize: "14px",
  } as React.CSSProperties,

  notificationError: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "12px 16px",
    marginBottom: "20px",
    fontSize: "14px",
  } as React.CSSProperties,

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  } as React.CSSProperties,

  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  } as React.CSSProperties,

  label: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
  } as React.CSSProperties,

  required: {
    color: "#ef4444",
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#111827",
    backgroundColor: "#ffffff",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  } as React.CSSProperties,

  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fff7f7",
  } as React.CSSProperties,

  fieldError: {
    margin: 0,
    fontSize: "13px",
    color: "#ef4444",
  } as React.CSSProperties,

  avatarPreview: {
    marginTop: "8px",
  } as React.CSSProperties,

  avatarImg: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    objectFit: "cover" as const,
    border: "2px solid #e5e7eb",
  } as React.CSSProperties,

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "8px",
  } as React.CSSProperties,

  saveBtn: {
    padding: "10px 28px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
} as const;
