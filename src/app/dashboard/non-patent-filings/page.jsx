"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getClientNonPatentFilingsList,
  deleteClientNonPatentFiling,
  getClientNonPatentFilingPayment,
  getClientNonPatentFilingAgent,
} from "@/lib/api";

const PAGE_SIZE = 20;
const STATUS_FILTERS = ["All", "DRAFT", "PENDING", "IN_REVIEW", "APPROVED", "REJECTED"];
const TYPE_FILTERS = ["All", "TRADEMARK", "COPYRIGHT", "DESIGN"];

const STATUS_STYLES = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const TYPE_STYLES = {
  TRADEMARK: "bg-purple-100 text-purple-700",
  COPYRIGHT: "bg-indigo-100 text-indigo-700",
  DESIGN: "bg-cyan-100 text-cyan-700",
};

const TYPE_ICONS = {
  TRADEMARK: "trademark",
  COPYRIGHT: "copyright",
  DESIGN: "design_services",
};

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function FilingDetailDrawer({ filing, onClose, onDelete }) {
  const [payment, setPayment] = useState(null);
  const [agentInfo, setAgentInfo] = useState(null);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  useEffect(() => {
    if (!filing?.id) return;
    setLoadingExtra(true);
    Promise.all([
      getClientNonPatentFilingPayment(filing.id),
      getClientNonPatentFilingAgent(filing.id),
    ]).then(([payRes, agRes]) => {
      if (payRes.ok) setPayment(payRes.payment);
      if (agRes.ok) setAgentInfo(agRes);
      setLoadingExtra(false);
    });
  }, [filing?.id]);

  const handleDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    setDeleteErr("");
    const result = await deleteClientNonPatentFiling(filing.id);
    if (result.ok) {
      onDelete(filing.id);
      onClose();
    } else {
      setDeleteErr(result.data?.message || "Failed to delete. Only DRAFT filings can be deleted.");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const statusClass = STATUS_STYLES[filing?.status] || "bg-gray-100 text-gray-700";
  const typeLabel = filing.filingType ? filing.filingType.toUpperCase() : "NON-PATENT";
  const typeClass = TYPE_STYLES[typeLabel] || "bg-gray-100 text-gray-700";
  const typeIcon = TYPE_ICONS[typeLabel] || "description";

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative ml-auto w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 z-10">
          <h2 className="text-base font-bold text-[#0d1b2a]">Filing Detail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#0d1b2a]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded tracking-wider ${typeClass}`}>
                <span className="material-symbols-outlined text-[11px]">{typeIcon}</span>
                {typeLabel}
              </span>
              <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded tracking-wider ${statusClass}`}>
                {filing.status || "—"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0d1b2a]">{filing.title || "Untitled Filing"}</h3>
            <p className="text-xs text-gray-400 mt-1 font-mono">{filing.referenceNumber || "—"}</p>
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Filing Type</p>
              <p className="font-semibold text-[#0d1b2a] mt-1">{typeLabel}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Submitted</p>
              <p className="font-semibold text-[#0d1b2a] mt-1">{formatDate(filing.submittedAt)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Filing ID</p>
              <p className="font-semibold text-[#0d1b2a] mt-1 font-mono text-[10px] truncate">{filing.id || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 uppercase tracking-wider text-[10px]">Updated</p>
              <p className="font-semibold text-[#0d1b2a] mt-1">{formatDate(filing.updatedAt)}</p>
            </div>
          </div>

          {/* Payment / estimation */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#0d1b2a] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-amber-500">payments</span>
              Payment Estimation
            </h4>
            {loadingExtra ? (
              <p className="text-xs text-gray-400 animate-pulse">Loading…</p>
            ) : payment ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#0d1b2a]">
                    {payment.estimation !== null ? `₹${Number(payment.estimation).toLocaleString()}` : "Not set"}
                  </span>
                  {payment.estimation !== null && (
                    <span className="text-xs text-gray-400">estimated cost</span>
                  )}
                </div>
                {payment.adminNote && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                    <span className="font-semibold">Admin Note: </span>{payment.adminNote}
                  </div>
                )}
                {payment.updatedAt && (
                  <p className="text-[10px] text-gray-400">Last updated: {formatDate(payment.updatedAt)}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400">No estimation set yet.</p>
            )}
          </div>

          {/* Assigned agent */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#0d1b2a] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#1a3d54]">person_pin</span>
              Assigned Agent
            </h4>
            {loadingExtra ? (
              <p className="text-xs text-gray-400 animate-pulse">Loading…</p>
            ) : agentInfo?.assigned ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0d1b2a] flex items-center justify-center text-white text-sm font-bold">
                    {(agentInfo.agent?.name || "A").charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0d1b2a]">{agentInfo.agent?.name || "—"}</p>
                    <p className="text-xs text-gray-500">{agentInfo.agent?.email || "—"}</p>
                  </div>
                </div>
                {agentInfo.assignedAt && (
                  <p className="text-[10px] text-gray-400">Assigned on: {formatDate(agentInfo.assignedAt)}</p>
                )}
                {agentInfo.agent?.memberSince && (
                  <p className="text-[10px] text-gray-400">
                    Agent since: {formatDate(agentInfo.agent.memberSince)}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="material-symbols-outlined text-base">person_off</span>
                No agent assigned yet. An agent will be assigned shortly.
              </div>
            )}
          </div>

          {/* Delete (DRAFT only) */}
          {filing.status === "DRAFT" && (
            <div className="border border-red-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base">delete_forever</span>
                Danger Zone
              </h4>
              {deleteErr && <p className="text-xs text-red-500">{deleteErr}</p>}
              <p className="text-xs text-gray-500">
                This filing is in DRAFT status and can be permanently deleted.
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
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-base">delete</span>
                )}
                {deleting ? "Deleting…" : deleteConfirm ? "Confirm Delete?" : "Delete Filing"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NonPatentFilingsPage() {
  const [filings, setFilings] = useState([]);
  const [meta, setMeta] = useState({ page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [activeStatus, setActiveStatus] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedFiling, setSelectedFiling] = useState(null);

  const load = async (p = 0, status = activeStatus, type = activeType, q = search) => {
    setLoading(true);
    setError("");
    const result = await getClientNonPatentFilingsList({
      page: p,
      size: PAGE_SIZE,
      status: status === "All" ? undefined : status,
      filingType: type === "All" ? undefined : type,
      search: q || undefined,
    });
    if (!result.ok) {
      setError(result.data?.message || "Unable to load non-patent filings.");
      setFilings([]);
    } else {
      const items = result.items || [];
      setFilings(items);
      setMeta(result.pagination);

      // Fetch agent info for each filing that doesn't already have an agent name
      // and merge it in so the Agent column populates correctly
      const needsAgent = items.filter((f) => !f.assignedAgentName && f.id);
      if (needsAgent.length > 0) {
        const agentResults = await Promise.all(
          needsAgent.map((f) => getClientNonPatentFilingAgent(f.id).then((r) => ({ id: f.id, r })))
        );
        setFilings((prev) =>
          prev.map((f) => {
            const found = agentResults.find((a) => a.id === f.id);
            if (found?.r?.ok && found.r.assigned && found.r.agent?.name) {
              return { ...f, assignedAgentName: found.r.agent.name, assignedAgentEmail: found.r.agent.email || "", assignedAt: found.r.assignedAt || f.assignedAt };
            }
            return f;
          })
        );
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(page, activeStatus, activeType, search); }, [page, activeStatus, activeType]);

  const handleSearch = (e) => {
    if (e.key === "Enter") { setPage(0); load(0, activeStatus, activeType, search); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return filings;
    const q = search.toLowerCase();
    return filings.filter(
      (f) =>
        (f.title || "").toLowerCase().includes(q) ||
        (f.referenceNumber || "").toLowerCase().includes(q)
    );
  }, [filings, search]);

  const handleDelete = (id) => {
    setFilings((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b2a]">Non-Patent Filings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your trademark, copyright, and design filings.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/cases/new/trademark"
            className="flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">trademark</span>
            Trademark
          </Link>
          <Link
            href="/dashboard/cases/new/copyright"
            className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">copyright</span>
            Copyright
          </Link>
          <Link
            href="/dashboard/cases/new/design"
            className="flex items-center gap-1.5 bg-cyan-100 text-cyan-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-cyan-200 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">design_services</span>
            Design
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-gray-400 text-base">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search by title or reference… (Enter)"
            className="text-sm text-gray-600 bg-transparent outline-none w-full placeholder:text-gray-400"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Type filter */}
          <div className="flex flex-wrap gap-2">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase self-center mr-1">Type:</p>
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => { setActiveType(t); setPage(0); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  activeType === t
                    ? "bg-[#1a3d54] text-white border-[#1a3d54]"
                    : "border-gray-200 text-gray-500 hover:border-[#1a3d54]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase self-center mr-1">Status:</p>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => { setActiveStatus(s); setPage(0); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  activeStatus === s
                    ? "bg-[#1a3d54] text-white border-[#1a3d54]"
                    : "border-gray-200 text-gray-500 hover:border-[#1a3d54]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-6 py-3">Ref #</th>
                <th className="text-left text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-4 py-3">Title</th>
                <th className="text-left text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-4 py-3">Type</th>
                <th className="text-left text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-4 py-3">Status</th>
                <th className="text-left text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-4 py-3">Estimation</th>
                <th className="text-left text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-4 py-3">Agent</th>
                <th className="text-left text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-4 py-3">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                    Loading filings…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-6 py-6 text-center text-sm text-red-500">{error}</td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                    No non-patent filings found.
                  </td>
                </tr>
              )}
              {filtered.map((f, i) => {
                const tl = f.filingType ? f.filingType.toUpperCase() : "";
                const tc = TYPE_STYLES[tl] || "bg-gray-100 text-gray-700";
                const ti = TYPE_ICONS[tl] || "description";
                return (
                  <tr
                    key={f.id || i}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                      i === filtered.length - 1 ? "border-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{f.referenceNumber || "—"}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#0d1b2a] text-sm">{f.title || "Untitled"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded tracking-wider ${tc}`}>
                        <span className="material-symbols-outlined text-[11px]">{ti}</span>
                        {tl || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded tracking-wider ${STATUS_STYLES[f.status] || "bg-gray-100 text-gray-700"}`}>
                        {f.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {f.estimation !== null && f.estimation !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[12px]">payments</span>
                          ₹{Number(f.estimation).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {f.assignedAgentName ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#1a3d54] font-medium">
                          <span className="material-symbols-outlined text-sm">person</span>
                          {f.assignedAgentName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500">{formatDate(f.submittedAt)}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedFiling(f)}
                        className="text-gray-400 hover:text-[#1a3d54] transition-colors"
                        title="View details"
                      >
                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {meta.totalElements} filing{meta.totalElements !== 1 ? "s" : ""} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-7 h-7 rounded text-xs font-semibold bg-[#1a3d54] text-white">
              {meta.totalPages === 0 ? 0 : page + 1}
            </button>
            <span className="text-xs text-gray-400">/ {meta.totalPages || 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={meta.totalPages === 0 || page >= meta.totalPages - 1}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedFiling && (
        <FilingDetailDrawer
          filing={selectedFiling}
          onClose={() => setSelectedFiling(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
