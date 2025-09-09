/* eslint-disable no-console */

import api from "./api";
import type { User } from "./authService";
import type { Proposal } from "./proposalService";

/* =========================
   Types
   ========================= */
export interface AdminUser extends User {
  _id: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDashboardStats {
  activeUsers: number;
  conflicts: number;
  totalProposals: number;
  totalVotes: number;
}

export interface EvaluationMetrics {
  negotiationId: string;
  timeToConsensus: number | null;
  numberOfRounds: number;
  utilityGain: number;
  stakeholderSatisfaction: number | null;
  resolutionSuccessRate: number;
  resolutionStability: number;
  decisionConsistency: number;
}

/** Flexible shape for blockchain logs (decoded args are optional) */
export interface BlockchainLog {
  index?: number;
  proposalId?: string;
  submitterIds?: string[];
  summaryId?: string;
  preferenceId?: string;
  negotiationId?: string;
  smartDataId?: string;
  finalProposalId?: string;

  // on-chain metadata
  network?: string;
  blockNumber?: number;
  logIndex?: number;
  address?: string;
  transactionHash?: string; // preferred key
  txHash?: string;          // some providers use this
  topic0?: string;
  event?: string | null;
  args?: Record<string, any> | null;
  timestamp?: string | number; // ISO string (preferred) or unix/ms
}

/** Optional query params for logs */
export type GetLogsParams = {
  network?: "local" | "sepolia";
  lookback?: number;
  fromBlock?: number;
  toBlock?: number | "latest";
  proposalId?: string;
  limit?: number;
};

/* =========================
   Internal helpers
   ========================= */
const extractError = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

const timestamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

/** Coerce any backend payload into a flat array of logs */
const coerceLogs = (data: any): BlockchainLog[] => {
  if (Array.isArray(data)) return data as BlockchainLog[];
  if (Array.isArray(data?.logs)) return data.logs as BlockchainLog[];
  if (data && typeof data === "object") return [data as BlockchainLog];
  return [];
};

/* =========================
   Admin Dashboard
   ========================= */
export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    const res = await api.get<{ data: AdminDashboardStats }>("/admin/dashboard-stats");
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching admin dashboard stats:", error);
    throw new Error(extractError(error, "Failed to fetch dashboard stats."));
  }
};

/* =========================
   Users
   ========================= */
export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    const res = await api.get<AdminUser[]>("/admin/users", {
      headers: { "Cache-Control": "no-cache" },
    });
    return res.data || [];
  } catch (error: any) {
    console.error("Error fetching all users:", error);
    throw new Error(extractError(error, "Failed to fetch users."));
  }
};

export const updateUser = async (userId: string, data: { name?: string; email?: string }) => {
  try {
    const res = await api.put(`/admin/user/${userId}`, data);
    return res.data;
  } catch (error: any) {
    console.error("Error updating user:", error);
    throw new Error(extractError(error, "Failed to update user."));
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  try {
    const res = await api.put(`/admin/user-role/${userId}`, { role });
    return res.data;
  } catch (error: any) {
    console.error("Error updating user role:", error);
    throw new Error(extractError(error, "Failed to update user role."));
  }
};

/** Backend expects { status: boolean } */
export const updateUserStatus = async (userId: string, status: boolean) => {
  try {
    const res = await api.put(`/admin/user-status/${userId}`, { status });
    return res.data;
  } catch (error: any) {
    console.error("Error updating user status:", error);
    throw new Error(extractError(error, "Failed to update user status."));
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const res = await api.delete(`/admin/user/${userId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error deleting user:", error);
    throw new Error(extractError(error, "Failed to delete user."));
  }
};

/* =========================
   Proposals
   ========================= */
export const getAllProposals = async (): Promise<Proposal[]> => {
  try {
    const res = await api.get<{ proposals: Proposal[] }>("/admin/proposals", {
      headers: { "Cache-Control": "no-cache" },
    });
    return res.data.proposals || [];
  } catch (error: any) {
    console.error("Error fetching all proposals:", error);
    throw new Error(extractError(error, "Failed to fetch proposals."));
  }
};

export const getProposalByIdForAdmin = async (proposalId: string): Promise<Proposal> => {
  try {
    const res = await api.get<{ proposal: Proposal }>(`/proposals/${proposalId}`);
    return res.data.proposal;
  } catch (error: any) {
    console.error("Error fetching proposal by ID for admin:", error);
    throw new Error(extractError(error, "Failed to fetch proposal details."));
  }
};

export const deleteProposal = async (proposalId: string) => {
  try {
    const res = await api.delete(`/admin/proposal/${proposalId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error deleting proposal:", error);
    throw new Error(extractError(error, "Failed to delete proposal."));
  }
};

export const initiateNegotiation = async (proposalId: string) => {
  try {
    const res = await api.post(`/negotiation/initiate/${proposalId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error initiating negotiation:", error);
    throw new Error(extractError(error, "Failed to initiate negotiation."));
  }
};

/* =========================
   Evaluation
   ========================= */
export const getEvaluationMetrics = async (negotiationId: string): Promise<EvaluationMetrics> => {
  try {
    const res = await api.get<EvaluationMetrics>(`/evaluation/${negotiationId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching evaluation metrics:", error);
    throw new Error(extractError(error, "Failed to fetch evaluation metrics."));
  }
};

export const downloadEvaluationReport = async (): Promise<void> => {
  let urlObj: string | null = null;
  try {
    const res = await api.get("/evaluation/download-report", { responseType: "blob" });
    urlObj = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = urlObj;
    link.setAttribute("download", `negotiation_evaluation_report_${timestamp()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    console.error("Error downloading evaluation report:", error);
    throw new Error(extractError(error, "Failed to download evaluation report."));
  } finally {
    if (urlObj) window.URL.revokeObjectURL(urlObj);
  }
};

/* =========================
   Proposals CSV export
   ========================= */
const downloadProposalsByStage = async (
  stage: "pending" | "in_negotiation" | "finalized" | "all"
): Promise<void> => {
  let urlObj: string | null = null;
  const preferred = stage === "all" ? "/admin/proposals/export" : `/admin/proposals/export/${stage}`;

  try {
    let res = await api.get(preferred, { responseType: "blob" });
    // Some proxies return JSON errors as blobs; fallback to generic export
    if (!(res?.data instanceof Blob)) {
      res = await api.get("/admin/proposals/export", { responseType: "blob" });
    }

    urlObj = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = urlObj;
    link.setAttribute("download", `proposals_${stage}_${timestamp()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    // final fallback
    try {
      const res = await api.get("/admin/proposals/export", { responseType: "blob" });
      urlObj = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = urlObj;
      link.setAttribute("download", `proposals_${stage}_${timestamp()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (fallbackErr: any) {
      console.error(`Error downloading ${stage} proposals report:`, fallbackErr);
      throw new Error(extractError(fallbackErr, `Failed to download ${stage} report.`));
    }
  } finally {
    if (urlObj) window.URL.revokeObjectURL(urlObj);
  }
};

export const downloadPendingProposals = () => downloadProposalsByStage("pending");
export const downloadNegotiatingProposals = () => downloadProposalsByStage("in_negotiation");
export const downloadFinalizedProposals = () => downloadProposalsByStage("finalized");
export const downloadAllProposals = () => downloadProposalsByStage("all");

/* =========================
   Blockchain Logs (robust with fallback)
   ========================= */
export const getBlockchainLogs = async (params: GetLogsParams = {}): Promise<BlockchainLog[]> => {
  // Prefer admin endpoint (decoded + filtered)
  try {
    const { data } = await api.get("/admin/blockchain-logs", {
      params,
      headers: { "Cache-Control": "no-cache" },
    });
    const arr = coerceLogs(data);
    if (arr.length) return arr;
  } catch {
    /* fall through to fallback */
  }

  // Fallback to public audit-log (same base /api handled by api instance)
  try {
    const { data } = await api.get("/blockchain/audit-log", {
      params,
      headers: { "Cache-Control": "no-cache" },
    });
    return coerceLogs(data);
  } catch (error: any) {
    console.error("Error fetching blockchain logs:", error);
    throw new Error(extractError(error, "Failed to fetch blockchain logs."));
  }
};
