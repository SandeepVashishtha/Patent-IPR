"use client";
import { useEffect, useState } from "react";
import {
  getClientPatentFilings,
  getClientNonPatentFilingsList,
  getClientPatentFilingPayment,
  getClientNonPatentFilingPayment,
} from "@/lib/api";


function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN");
}

function formatINR(amount) {
  if (amount === null || amount === undefined) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

const STATUS_STYLES = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING: "bg-amber-100 text-amber-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const TYPE_STYLES = {
  patent: "bg-indigo-100 text-indigo-700",
  trademark: "bg-purple-100 text-purple-700",
  copyright: "bg-cyan-100 text-cyan-700",
  design: "bg-teal-100 text-teal-700",
};

const TYPE_ICONS = {
  patent: "inventory_2",
  trademark: "trademark",
  copyright: "copyright",
  design: "design_services",
};

export default function PaymentsPage() {
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [patentRes, nonPatentRes] = await Promise.all([
          getClientPatentFilings({ page: 0, size: 100 }),
          getClientNonPatentFilingsList({ page: 0, size: 100 }),
        ]);

        const patents = (patentRes.ok ? patentRes.items || [] : []).map((f) => ({
          ...f,
          _category: "patent",
        }));

        const nonPatents = (nonPatentRes.ok ? nonPatentRes.items || [] : []).map((f) => ({
          ...f,
          _category: f.filingType || "non-patent",
        }));

        // sort by submittedAt desc
        const all = [...patents, ...nonPatents].sort((a, b) => {
          const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return tb - ta;
        });

        setFilings(all);
        if (!patentRes.ok && !nonPatentRes.ok) {
          setError("Unable to load filings. Please try again.");
        }

        // Batch-fetch payment/estimation for items missing estimation
        const needsPayment = all.filter((f) => (f.estimation === null || f.estimation === undefined) && f.id);
        if (needsPayment.length > 0) {
          const payResults = await Promise.all(
            needsPayment.map((f) => {
              const fetcher = f._category === "patent"
                ? getClientPatentFilingPayment
                : getClientNonPatentFilingPayment;
              return fetcher(f.id).then((r) => ({ id: f.id, r }));
            })
          );
          setFilings((prev) =>
            prev.map((f) => {
              const found = payResults.find((p) => p.id === f.id);
              if (found?.r?.ok && found.r.payment) {
                return {
                  ...f,
                  estimation: found.r.payment.estimation ?? f.estimation,
                  adminNote: found.r.payment.adminNote || f.adminNote || "",
                };
              }
              return f;
            })
          );
        }
      } catch (e) {
        setError("An unexpected error occurred.");
      }
      setLoading(false);
    };
    load();
  }, []);

  const withEstimation = filings.filter((f) => f.estimation !== null && f.estimation !== undefined);
  const totalEstimation = withEstimation.reduce((s, f) => s + Number(f.estimation || 0), 0);
  const approvedTotal = filings
    .filter((f) => f.status === "APPROVED" && f.estimation !== null && f.estimation !== undefined)
    .reduce((s, f) => s + Number(f.estimation || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0d1b2a]">Payments</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View cost estimations set by admin across your IP portfolio. All amounts in Indian Rupees (₹).
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-xl text-amber-500">receipt_long</span>
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Total Filings</span>
          </div>
          <p className="text-3xl font-bold text-[#0d1b2a]">{filings.length}</p>
          <p className="text-xs text-gray-400 mt-1">Patent + Non-Patent cases</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-xl text-blue-500">payments</span>
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Total Estimation</span>
          </div>
          <p className="text-3xl font-bold text-[#0d1b2a]">{withEstimation.length > 0 ? formatINR(totalEstimation) : "—"}</p>
          <p className="text-xs text-gray-400 mt-1">{withEstimation.length} filing{withEstimation.length !== 1 ? "s" : ""} with estimation</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-xl text-green-600">check_circle</span>
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Approved Cases</span>
          </div>
          <p className="text-3xl font-bold text-[#0d1b2a]">
            {filings.filter((f) => f.status === "APPROVED").length}
          </p>
          {approvedTotal > 0 && (
            <p className="text-xs text-gray-400 mt-1">Est. {formatINR(approvedTotal)} approved</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0d1b2a]">All Cases &amp; Estimations</h2>
          <span className="text-xs text-gray-400">Amounts shown in ₹ (Indian Rupees)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Ref #", "Title", "Type", "Status", "Estimation", "Submitted"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-[#1a3d54] rounded-full animate-spin mr-2 align-middle" />
                    Loading filings…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-red-500">{error}</td>
                </tr>
              )}
              {!loading && !error && filings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    No filings found. Submit a patent or non-patent filing to get started.
                  </td>
                </tr>
              )}
              {filings.map((f, i) => {
                const cat = f._category || "patent";
                const tc = TYPE_STYLES[cat] || "bg-gray-100 text-gray-600";
                const ti = TYPE_ICONS[cat] || "description";
                const typeLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
                const statusClass = STATUS_STYLES[f.status] || "bg-gray-100 text-gray-600";
                return (
                  <tr
                    key={f.id || i}
                    className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === filings.length - 1 ? "border-0" : ""}`}
                  >
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {f.referenceNumber || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#0d1b2a] text-sm truncate max-w-[200px]">{f.title || "Untitled"}</p>
                      {f.adminNote && (
                        <p className="text-[10px] text-blue-600 mt-0.5 truncate max-w-[200px]">
                          Note: {f.adminNote}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded tracking-wider ${tc}`}>
                        <span className="material-symbols-outlined text-[11px]">{ti}</span>
                        {typeLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded tracking-wider ${statusClass}`}>
                        {f.status || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {f.estimation !== null && f.estimation !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-[#0d1b2a]">
                          <span className="material-symbols-outlined text-base text-green-600">currency_rupee</span>
                          {Number(f.estimation).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not set yet</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(f.submittedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Footer note */}
        {!loading && filings.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
            <span className="material-symbols-outlined text-sm">info</span>
            Estimations are set by the admin after reviewing your filing. Contact support for payment queries.
          </div>
        )}
      </div>
    </div>
  );
}
