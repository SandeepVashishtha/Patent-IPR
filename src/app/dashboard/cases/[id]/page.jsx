"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getClientFilings,
  getFilingByReference,
  getClientPatentFilingPayment,
  getClientPatentFilingAgent,
  getClientNonPatentFilingPayment,
  getClientNonPatentFilingAgent,
  deleteClientPatentFiling,
  deleteClientNonPatentFiling,
} from "@/lib/api";

const STATUS_STYLES = {
  DRAFT: "text-gray-700 border-gray-300 bg-gray-100",
  PENDING: "text-amber-700 border-amber-300 bg-amber-100",
  IN_REVIEW: "text-blue-700 border-blue-300 bg-blue-100",
  APPROVED: "text-green-700 border-green-300 bg-green-100",
  REJECTED: "text-red-700 border-red-300 bg-red-100",
};

function formatDate(value) {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleString();
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-[#0d1b2a] mt-0.5">{value || "—"}</p>
    </div>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams();
  const referenceNumber = decodeURIComponent(id || "");

  const [filing, setFiling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment & agent data
  const [payment, setPayment] = useState(null);
  const [agentInfo, setAgentInfo] = useState(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");
  const [deleted, setDeleted] = useState(false);

  // Load the filing
  useEffect(() => {
    const loadCase = async () => {
      if (!referenceNumber) {
        setLoading(false);
        setError("Invalid reference number.");
        return;
      }

      setLoading(true);
      setError("");

      const clientList = await getClientFilings({ page: 0, size: 200, sort: "submittedAt,desc" });
      if (clientList.ok) {
        const found = (clientList.items || []).find((p) => p.referenceNumber === referenceNumber);
        if (found) {
          setFiling(found);
          setLoading(false);
          return;
        }
      }

      const result = await getFilingByReference(referenceNumber);
      if (!result.ok) {
        setError(result.data?.message || "Unable to load filing details.");
        setFiling(null);
        setLoading(false);
        return;
      }

      setFiling(result.data || null);
      setLoading(false);
    };

    loadCase();
  }, [referenceNumber]);

  // Load payment & agent info once filing is ready
  useEffect(() => {
    if (!filing?.id) return;
    const isPatent = filing.filingType === "patent" || !filing.filingType;

    setLoadingExtra(true);
    const payFn = isPatent ? getClientPatentFilingPayment : getClientNonPatentFilingPayment;
    const agFn = isPatent ? getClientPatentFilingAgent : getClientNonPatentFilingAgent;

    Promise.all([payFn(filing.id), agFn(filing.id)]).then(([payRes, agRes]) => {
      if (payRes.ok) setPayment(payRes.payment);
      if (agRes.ok) setAgentInfo(agRes);
      setLoadingExtra(false);
    });
  }, [filing?.id, filing?.filingType]);

  const handleDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    setDeleteErr("");
    const isPatent = filing.filingType === "patent" || !filing.filingType;
    const fn = isPatent ? deleteClientPatentFiling : deleteClientNonPatentFiling;
    const result = await fn(filing.id);
    if (result.ok) {
      setDeleted(true);
    } else {
      setDeleteErr(result.data?.message || "Failed to delete. Only DRAFT filings can be deleted.");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const statusClass = STATUS_STYLES[filing?.status] || "text-gray-700 border-gray-300 bg-gray-100";

  const milestones = useMemo(() => {
    if (!filing) return [];
    return [
      {
        label: "Draft Created",
        date: filing.updatedAt || filing.submittedAt,
        state: filing.status === "DRAFT" ? "active" : "done",
      },
      {
        label: "Submitted",
        date: filing.submittedAt,
        state: filing.status === "DRAFT" ? "pending" : "done",
      },
      {
        label: "Under Review",
        date: filing.updatedAt,
        state: filing.status === "IN_REVIEW" ? "active" : filing.status === "APPROVED" || filing.status === "REJECTED" ? "done" : filing.status === "PENDING" ? "active" : "pending",
      },
      {
        label: "Final Decision",
        date: filing.updatedAt,
        state: filing.status === "APPROVED" || filing.status === "REJECTED" ? "done" : "pending",
      },
    ];
  }, [filing]);

  if (loading) {
    return <div className="max-w-5xl mx-auto py-10 text-sm text-gray-500">Loading case details…</div>;
  }

  if (deleted) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 py-10 text-center">
        <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
        <p className="text-lg font-bold text-[#0d1b2a]">Filing deleted successfully.</p>
        <Link href="/dashboard/cases" className="text-sm text-[#1a3d54] hover:underline">
          Back to My Cases
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Link href="/dashboard/cases" className="text-sm text-[#0d1b2a] hover:underline">← Back to cases</Link>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!filing) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Link href="/dashboard/cases" className="text-sm text-[#0d1b2a] hover:underline">← Back to cases</Link>
        <p className="text-sm text-gray-500">No details found for this filing.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/dashboard/cases" className="hover:text-[#0d1b2a] transition-colors">Cases</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#0d1b2a] font-medium">{filing.referenceNumber || referenceNumber}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold tracking-widest border px-2 py-0.5 rounded ${statusClass}`}>
                {filing.status || "—"}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                {filing.typeLabel || "FILING"}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#0d1b2a]">{filing.title || "Untitled Filing"}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">tag</span>
                {filing.referenceNumber || "—"}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">fingerprint</span>
                {filing.typeId || filing.patentId || filing.id || "—"}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                {formatDate(filing.submittedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Progress */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-bold text-[#0d1b2a] mb-5">Filing Progress</h2>
            <div className="space-y-0">
              {milestones.map((step, idx) => (
                <div key={step.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.state === "done" ? "bg-green-500 text-white" :
                      step.state === "active" ? "bg-amber-400 text-white" :
                      "bg-gray-100 text-gray-300"
                    }`}>
                      {step.state === "done" ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : step.state === "active" ? (
                        <span className="material-symbols-outlined text-sm">pending</span>
                      ) : idx + 1}
                    </div>
                    {idx < milestones.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.state === "done" ? "bg-green-200" : "bg-gray-100"}`} style={{ minHeight: "24px" }} />
                    )}
                  </div>
                  <div className={`flex-1 pb-5 ${idx === milestones.length - 1 ? "pb-0" : ""}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${step.state === "pending" ? "text-gray-300" : "text-[#0d1b2a]"}`}>
                        {step.label}
                      </p>
                      <p className={`text-[10px] font-bold tracking-wider uppercase ${
                        step.state === "done" ? "text-green-600" :
                        step.state === "active" ? "text-amber-600" :
                        "text-gray-300"
                      }`}>
                        {step.state === "done" ? "Completed" : step.state === "active" ? "In Progress" : "Pending"}
                      </p>
                    </div>
                    {step.date && step.state !== "pending" && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(step.date)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Estimation card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-bold text-[#0d1b2a] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">payments</span>
              Payment Estimation
            </h2>
            {loadingExtra ? (
              <p className="text-sm text-gray-400 animate-pulse">Loading estimation…</p>
            ) : payment ? (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-[#0d1b2a]">
                    {payment.estimation !== null ? `₹${Number(payment.estimation).toLocaleString()}` : "Not set yet"}
                  </span>
                  {payment.estimation !== null && (
                    <span className="text-sm text-gray-400 mb-1">estimated cost</span>
                  )}
                </div>
                {payment.adminNote && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                    <p className="font-semibold text-xs uppercase tracking-wider mb-1">Admin Note</p>
                    {payment.adminNote}
                  </div>
                )}
                {!payment.estimation && (
                  <p className="text-sm text-gray-400">
                    The admin has not set an estimation yet. You will be notified once set.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No payment estimation available yet.</p>
            )}
          </div>

          {/* Applicant Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-bold text-[#0d1b2a] mb-4">Applicant Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Name" value={filing.applicantName} />
              <InfoRow label="Email" value={filing.applicantEmail} />
              <InfoRow label="Mobile" value={filing.applicantMobile} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Case Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Case Summary</h3>
            <InfoRow label="Category" value={filing.fieldOfInvention} />
            {filing.fieldOfInventionOther && (
              <InfoRow label="Other Field" value={filing.fieldOfInventionOther} />
            )}
            <InfoRow label="Updated At" value={formatDate(filing.updatedAt)} />
          </div>

          {/* Assigned Agent */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#1a3d54]">person_pin</span>
              Assigned Agent
            </h3>
            {loadingExtra ? (
              <p className="text-xs text-gray-400 animate-pulse">Loading…</p>
            ) : agentInfo?.assigned ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0d1b2a] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(agentInfo.agent?.name || "A").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0d1b2a] truncate">{agentInfo.agent?.name || "—"}</p>
                    <p className="text-xs text-gray-500 truncate">{agentInfo.agent?.email || "—"}</p>
                  </div>
                </div>
                {agentInfo.assignedAt && (
                  <p className="text-[10px] text-gray-400">
                    Assigned: {formatDate(agentInfo.assignedAt)}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="material-symbols-outlined text-base">person_off</span>
                No agent assigned yet.
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {filing.abstractText || "No description available."}
            </p>
          </div>

          {/* Document */}
          <div className="bg-[#0d1b2a] rounded-xl p-5 text-white">
            <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-3">Document</p>
            {filing.supportingDocumentUrl ? (
              <a
                href={filing.supportingDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#e0eaf3] text-[#1a3d54] text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-[#d2deea] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Open Attachment
              </a>
            ) : (
              <p className="text-xs text-white/70">No attachment URL available.</p>
            )}
          </div>

          {/* Delete (DRAFT only) */}
          {filing.status === "DRAFT" && (
            <div className="border border-red-100 rounded-xl p-5 space-y-3">
              <h3 className="text-[10px] font-bold tracking-widest text-red-500 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">delete_forever</span>
                Danger Zone
              </h3>
              {deleteErr && <p className="text-xs text-red-500">{deleteErr}</p>}
              <p className="text-xs text-gray-500">
                This is a DRAFT filing and can be permanently deleted.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`w-full text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  deleteConfirm
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "border border-red-300 text-red-500 hover:bg-red-50"
                }`}
              >
                {deleting ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-base">delete</span>
                )}
                {deleting ? "Deleting…" : deleteConfirm ? "Confirm — Delete Forever?" : "Delete This Filing"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
