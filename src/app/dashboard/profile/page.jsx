"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClientProfile,
  updateClientProfile,
  changeClientPassword,
  clientForgotPassword,
} from "@/lib/api";

function Alert({ type = "success", message, onClose }) {
  if (!message) return null;
  const styles = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-600",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className={`flex items-start gap-3 border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      <span className="material-symbols-outlined text-base mt-0.5">
        {type === "success" ? "check_circle" : type === "error" ? "error" : "info"}
      </span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-60 hover:opacity-100">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#0d1b2a] block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#0d1b2a] outline-none focus:border-[#1a3d54] transition-colors placeholder:text-gray-300";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ id: "", name: "", email: "", role: "CLIENT", created_at: null });
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAlert, setProfileAlert] = useState(null);

  // ── Change Password state ──────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwAlert, setPwAlert] = useState(null);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // ── Forgot Password state ──────────────────────────────────────────────────
  const [fpForm, setFpForm] = useState({ email: "", newPassword: "", confirm: "" });
  const [fpSaving, setFpSaving] = useState(false);
  const [fpAlert, setFpAlert] = useState(null);

  // ── Load profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setProfileLoading(true);
      const result = await getClientProfile();
      if (result.ok && result.profile) {
        setProfile(result.profile);
        setProfileForm({ name: result.profile.name || "", email: result.profile.email || "" });
        setFpForm((f) => ({ ...f, email: result.profile.email || "" }));
      }
      setProfileLoading(false);
    };
    load();
  }, []);

  // ── Profile save ───────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!profileForm.name.trim() && !profileForm.email.trim()) {
      setProfileAlert({ type: "error", message: "At least one field is required." });
      return;
    }
    setProfileSaving(true);
    setProfileAlert(null);
    const result = await updateClientProfile({ name: profileForm.name, email: profileForm.email });
    if (result.ok) {
      setProfile((p) => ({ ...p, name: profileForm.name, email: profileForm.email }));
      setProfileAlert({ type: "success", message: "Profile updated successfully!" });
    } else {
      const msg = result.data?.message || result.data?.error || "Failed to update profile.";
      setProfileAlert({ type: "error", message: msg });
    }
    setProfileSaving(false);
  };

  // ── Change password ────────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwAlert({ type: "error", message: "All fields are required." });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwAlert({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwAlert({ type: "error", message: "New passwords do not match." });
      return;
    }
    setPwSaving(true);
    setPwAlert(null);
    const result = await changeClientPassword({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
    if (result.ok) {
      setPwAlert({ type: "success", message: "Password changed successfully!" });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } else {
      const msg = result.data?.message || result.data?.error || "Failed to change password.";
      setPwAlert({ type: "error", message: msg });
    }
    setPwSaving(false);
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const forgotPassword = async () => {
    if (!fpForm.email || !fpForm.newPassword) {
      setFpAlert({ type: "error", message: "Email and new password are required." });
      return;
    }
    if (fpForm.newPassword.length < 8) {
      setFpAlert({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (fpForm.newPassword !== fpForm.confirm) {
      setFpAlert({ type: "error", message: "Passwords do not match." });
      return;
    }
    setFpSaving(true);
    setFpAlert(null);
    const result = await clientForgotPassword({ email: fpForm.email, newPassword: fpForm.newPassword });
    if (result.ok) {
      setFpAlert({ type: "success", message: "Password reset successfully! You can now log in." });
      setFpForm((f) => ({ ...f, newPassword: "", confirm: "" }));
    } else {
      const msg = result.data?.message || result.data?.error || "Failed to reset password.";
      setFpAlert({ type: "error", message: msg });
    }
    setFpSaving(false);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const tabs = [
    { key: "profile", label: "Profile Info", icon: "person" },
    { key: "security", label: "Change Password", icon: "lock" },
    { key: "reset", label: "Forgot Password", icon: "key" },
  ];

  const initials = (profile.name || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b2a]">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account information and security.</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Log Out
        </button>
      </div>

      {/* Avatar Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a3d54] to-[#0d1b2a] flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {profileLoading ? "…" : initials}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-[#0d1b2a] truncate">
              {profileLoading ? "Loading…" : profile.name || "—"}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{profile.role}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{profile.email}</p>
          </div>
          {profile.created_at && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Member Since</p>
              <p className="text-xs font-semibold text-[#0d1b2a] mt-0.5">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-[#1a3d54] text-[#1a3d54]"
                : "border-transparent text-gray-500 hover:text-[#0d1b2a]"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Profile Info ── */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="text-base font-bold text-[#0d1b2a]">Personal Information</h2>

          {profileAlert && (
            <Alert
              type={profileAlert.type}
              message={profileAlert.message}
              onClose={() => setProfileAlert(null)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name">
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Email Address">
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Role">
              <input
                type="text"
                value={profile.role}
                readOnly
                className={`${INPUT_CLS} bg-gray-50 cursor-default text-gray-500`}
              />
            </Field>
            {profile.id && (
              <Field label="User ID">
                <input
                  type="text"
                  value={profile.id}
                  readOnly
                  className={`${INPUT_CLS} bg-gray-50 cursor-default text-gray-400 font-mono text-xs`}
                />
              </Field>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={saveProfile}
              disabled={profileSaving || profileLoading}
              className="bg-[#1a3d54] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#153144] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {profileSaving && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {profileSaving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => setProfileForm({ name: profile.name, email: profile.email })}
              className="text-sm font-medium text-gray-500 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Change Password ── */}
      {activeTab === "security" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#0d1b2a]">Change Password</h2>
            <p className="text-xs text-gray-500 mt-1">Requires your current password. Minimum 8 characters.</p>
          </div>

          {pwAlert && (
            <Alert type={pwAlert.type} message={pwAlert.message} onClose={() => setPwAlert(null)} />
          )}

          <div className="space-y-4">
            {[
              { key: "currentPassword", label: "Current Password", showKey: "current" },
              { key: "newPassword", label: "New Password", showKey: "new" },
              { key: "confirm", label: "Confirm New Password", showKey: "confirm" },
            ].map(({ key, label, showKey }) => (
              <Field key={key} label={label}>
                <div className="relative">
                  <input
                    type={showPw[showKey] ? "text" : "password"}
                    value={pwForm[key]}
                    onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className={`${INPUT_CLS} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, [showKey]: !s[showKey] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0d1b2a]"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPw[showKey] ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </Field>
            ))}
          </div>

          {/* Password strength hint */}
          {pwForm.newPassword && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    pwForm.newPassword.length >= n * 3
                      ? n <= 1 ? "bg-red-400" : n <= 2 ? "bg-amber-400" : n <= 3 ? "bg-yellow-400" : "bg-green-400"
                      : "bg-gray-100"
                  }`}
                />
              ))}
              <span className="text-[10px] text-gray-400 w-14 text-right">
                {pwForm.newPassword.length < 4 ? "Weak" : pwForm.newPassword.length < 8 ? "Fair" : pwForm.newPassword.length < 12 ? "Good" : "Strong"}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={changePassword}
              disabled={pwSaving}
              className="bg-[#1a3d54] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#153144] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {pwSaving && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
            <button
              onClick={() => { setPwForm({ currentPassword: "", newPassword: "", confirm: "" }); setPwAlert(null); }}
              className="text-sm font-medium text-gray-500 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Forgot Password ── */}
      {activeTab === "reset" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#0d1b2a]">Reset Password</h2>
            <p className="text-xs text-gray-500 mt-1">
              Forgot your password? Enter your email and set a new one directly.
              <span className="ml-1 text-amber-600 font-medium">(No current password required)</span>
            </p>
          </div>

          {fpAlert && (
            <Alert type={fpAlert.type} message={fpAlert.message} onClose={() => setFpAlert(null)} />
          )}

          <div className="space-y-4">
            <Field label="Email Address">
              <input
                type="email"
                value={fpForm.email}
                onChange={(e) => setFpForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="New Password">
              <input
                type="password"
                value={fpForm.newPassword}
                onChange={(e) => setFpForm((f) => ({ ...f, newPassword: e.target.value }))}
                placeholder="••••••••"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                value={fpForm.confirm}
                onChange={(e) => setFpForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
                className={INPUT_CLS}
              />
            </Field>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2 text-xs text-amber-700">
            <span className="material-symbols-outlined text-base mt-0.5">warning</span>
            <span>
              This is a simplified reset flow. In production, a verification code is sent to your email first.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={forgotPassword}
              disabled={fpSaving}
              className="bg-amber-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {fpSaving && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {fpSaving ? "Resetting…" : "Reset Password"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
