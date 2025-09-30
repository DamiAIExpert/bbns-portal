/* eslint-disable no-console */

import api from "./api";
import type { User } from "./authService";
import type { Proposal } from "./proposalService";

// Re-export Proposal type for admin usage
export type { Proposal };

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
  negotiationsInProgress: number;
  finalizedNegotiations: number;
  averageTTC: number;
  averageSatisfaction: number;
  recentActivity: number;
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

export interface Negotiation {
  _id: string;
  proposalId?: string;
  proposals?: string[];
  participants: string[];
  status: 'pending' | 'in_progress' | 'finalized' | 'completed' | 'success' | 'partial' | 'impasse' | 'withdrawn' | 'canceled';
  maxRounds: number;
  startedAt?: string;
  finalizedAt?: string;
  metrics: {
    ttcMs?: number;
    ttcSeconds?: number;
    rounds?: number;
    utilityGain?: number;
    resolutionSuccess?: boolean;
    ssMean?: number;
    ssN?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conflict {
  _id: string;
  negotiationId: string;
  proposalId?: string;
  type: string;
  detector?: string;
  clauses?: any[];
  severity: number;
  description?: string;
  conflictingParties?: any;
  resolution?: string;
  resolutionMethod?: string;
  resolutionSummary?: string;
  resolved: boolean;
  detectedAt: string;
  resolvedAt?: string;
  roundNumber?: number;
  status?: 'open' | 'resolved';
  chain?: {
    txHash?: string | null;
    blockNumber?: number | null;
    network?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface BenchmarkResult {
  _id: string;
  negotiationId: {
    _id: string;
    status: string;
  };
  mainContribution: {
    method: string;
    preferences: Array<{
      stakeholder: string;
      priorities: {
        cost: number;
        timeline: number;
        quality: number;
      };
      role: string;
    }>;
    decision: {
      finalAgreement: string;
      utility: number;
      consensus: boolean;
    };
    ttcSeconds: number;
    rounds: number;
    resolutionSuccess: boolean;
    ssMean: number;
    ssN: number;
    utilityGain: number;
    conflictsCount: number;
    conflictsResolved: number;
    fairnessJain: number;
    participationGini: number;
    timestamp: string;
  };
  benchmarks: Array<{
    method: string;
    elicitationMethod: string;
    decisionMethod: string;
    preferences: Array<{
      stakeholder: string;
      priorities: {
        cost: number;
        timeline: number;
        quality: number;
      };
      role: string;
    }>;
    decision: {
      finalAgreement: string;
      utility: number;
      consensus: boolean;
    };
    ttcSeconds: number;
    rounds: number;
    resolutionSuccess: boolean;
    ssMean: number;
    ssN: number;
    utilityGain: number;
    conflictsCount: number;
    conflictsResolved: number;
    fairnessJain: number;
    participationGini: number;
    error?: string | null;
    _id?: string;
    timestamp: string;
  }>;
  metrics: {
    comparison: {
      methodEffectiveness: any[];
    };
    benchmarks: any[];
  };
  proposalId: string;
  stakeholderCount: number;
  stakeholderRoles: string[];
  blockchainAnchored: boolean;
  blockchainTxHash?: string | null;
  blockchainBlockNumber?: number | null;
  analysisComplete: boolean;
  analysisNotes?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface FeasibilityAnalysis {
  _id: string;
  proposalId: string | {
    _id: string;
    title: string;
    description: string;
    status: string;
  };
  negotiationId?: string | null;
  analysisType: 'initial' | 'revision' | 'final';
  analyzedBy: string;
  overallFeasibility: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dimensions: {
    time: {
      score: number;
      issues: Array<{
        type: string;
        severity: string;
        message: string;
        impact: string;
        conflicts: any[];
        _id: string;
      }>;
      estimatedDuration: number;
      timeConflicts: Array<{
        type: string;
        severity: string;
        message: string;
        impact: string;
        indicators: string[];
        resolution: string;
      }>;
      urgencyLevel: string;
    };
    cost: {
      score: number;
      issues: Array<{
        type: string;
        severity: string;
        message: string;
        impact: string;
        estimatedCost?: number;
        ratio?: number;
        indicators: string[];
        _id: string;
      }>;
      estimatedCost: number;
      budgetConflicts: Array<{
        type: string;
        severity: string;
        message: string;
        impact: string;
        indicators: string[];
        resolution: string;
      }>;
      costBenefitRatio: number;
    };
    complexity: {
      score: number;
      issues: Array<{
        type: string;
        severity: string;
        message: string;
        impact: string;
        technicalComplexity?: number;
        stakeholderComplexity?: number;
        integrationComplexity?: number;
        conflicts: any[];
        _id: string;
      }>;
      complexityLevel: string;
      technicalComplexity: number;
      stakeholderComplexity: number;
      integrationComplexity: number;
    };
    resourceWaste: {
      score: number;
      issues: Array<{
        type: string;
        severity: string;
        message: string;
        impact: string;
        indicators: string[];
        _id: string;
      }>;
      wasteIndicators: string[];
      efficiencyScore: number;
      redundancyLevel: number;
    };
  };
  conflicts: Array<{
    type: string;
    severity: string;
    message: string;
    stakeholders: string[];
    _id: string;
  }>;
  recommendations: Array<{
    category: string;
    priority: string;
    message: string;
    actions: string[];
    _id: string;
  }>;
  stakeholderAnalysis: {
    totalStakeholders: number;
    stakeholderRoles: string[];
    stakeholderConflicts: Array<{
      type: string;
      severity: string;
      message: string;
      impact: string;
      indicators: string[];
      resolution: string;
    }>;
    participationLevel: number;
  };
  wasteEvents: Array<{
    type: string;
    _id: string;
  }>;
  analysisVersion: string;
  analysisNotes: string;
  blockchainAnchored: boolean;
  status: string;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  __v: number;
}

export interface FeedbackAnalytics {
  summary: {
    totalFeedback: number;
    averageSatisfaction: number;
    responseRate: number;
  };
  satisfactionAnalysis: {
    overall: number;
    process: number;
    outcome: number;
    fairness: number;
    transparency: number;
    efficiency: number;
  };
  qualityAnalysis: {
    requirementQuality: number;
    processEfficiency: number;
    decisionQuality: number;
    stakeholderEngagement: number;
  };
  expectationAnalysis: {
    expectationGap: number;
    timelineAccuracy: number;
    outcomeAlignment: number;
  };
  roleAnalysis: {
    [role: string]: {
      count: number;
      averageSatisfaction: number;
      commonConcerns: string[];
    };
  };
  trendAnalysis: {
    satisfactionTrend: 'improving' | 'declining' | 'stable';
    qualityTrend: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
}

export interface ResearchData {
  negotiationId: string;
  roundRobinTurns: number;
  swingWeightingAdjustments: number;
  nashBargainingSessions: number;
  conflictEvents: number;
  stakeholderFeedback: number;
  performanceMetrics: {
    timeToConsensus: number;
    negotiationRounds: number;
    nashFairnessIndex: number;
    utilityGain: number;
    conflictResolutionRate: number;
  };
  benchmarkComparison: Array<{
    method: string;
    ttc: number;
    rounds: number;
    success: boolean;
    ssMean: number;
    utility: number;
    fairness: number;
  }>;
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

export const getComprehensiveDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    // Get basic stats
    const basicStats = await getAdminDashboardStats();
    
    // Try to get additional metrics, but don't fail if they don't exist
    let negotiations: Negotiation[] = [];
    let feedback: FeedbackAnalytics | null = null;

    try {
      negotiations = await getAllNegotiations();
    } catch (error) {
      console.warn("Could not fetch negotiations:", error);
    }


    try {
      feedback = await getFeedbackAnalytics();
    } catch (error) {
      console.warn("Could not fetch feedback:", error);
    }

    const negotiationsInProgress = negotiations.filter(n => 
      ['pending', 'in_progress'].includes(n.status)
    ).length;
    
    const finalizedNegotiations = negotiations.filter(n => 
      ['finalized', 'completed', 'success'].includes(n.status)
    ).length;

    const averageTTC = negotiations.length > 0 
      ? negotiations.reduce((sum, n) => sum + (n.metrics.ttcSeconds || 0), 0) / negotiations.length
      : 0;

    const averageSatisfaction = feedback?.summary?.averageSatisfaction || 0;

    const recentActivity = negotiations.filter(n => {
      const createdAt = new Date(n.createdAt);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdAt > oneWeekAgo;
    }).length;

    return {
      ...basicStats,
      negotiationsInProgress,
      finalizedNegotiations,
      averageTTC: Math.round(averageTTC * 100) / 100,
      averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
      recentActivity
    };
  } catch (error: any) {
    console.error("Error fetching comprehensive dashboard stats:", error);
    // Return basic stats even if comprehensive fails
    return {
      activeUsers: 0,
      conflicts: 0,
      totalProposals: 0,
      totalVotes: 0,
      negotiationsInProgress: 0,
      finalizedNegotiations: 0,
      averageTTC: 0,
      averageSatisfaction: 0,
      recentActivity: 0
    };
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
   Negotiations
   ========================= */
export const getAllNegotiations = async (): Promise<Negotiation[]> => {
  try {
    const res = await api.get<Negotiation[]>("/negotiation/all", {
      headers: { "Cache-Control": "no-cache" },
    });
    return res.data || [];
  } catch (error: any) {
    console.error("Error fetching negotiations:", error);
    throw new Error(extractError(error, "Failed to fetch negotiations."));
  }
};

export const getNegotiationById = async (negotiationId: string): Promise<Negotiation> => {
  try {
    const res = await api.get<Negotiation>(`/negotiation/${negotiationId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching negotiation:", error);
    throw new Error(extractError(error, "Failed to fetch negotiation details."));
  }
};

export const startNegotiation = async (proposalId: string) => {
  try {
    const res = await api.post(`/negotiation/initiate/${proposalId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error starting negotiation:", error);
    throw new Error(extractError(error, "Failed to start negotiation."));
  }
};

export const finalizeNegotiation = async (negotiationId: string) => {
  try {
    const res = await api.post(`/negotiation/finalize/${negotiationId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error finalizing negotiation:", error);
    throw new Error(extractError(error, "Failed to finalize negotiation."));
  }
};

export const cancelNegotiation = async (negotiationId: string) => {
  try {
    const res = await api.post(`/negotiation/cancel/${negotiationId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error canceling negotiation:", error);
    throw new Error(extractError(error, "Failed to cancel negotiation."));
  }
};

export const reopenNegotiation = async (negotiationId: string) => {
  try {
    const res = await api.post(`/negotiation/reopen/${negotiationId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error reopening negotiation:", error);
    throw new Error(extractError(error, "Failed to reopen negotiation."));
  }
};

// Function to start negotiations for all pending proposals
export const startAllNegotiations = async () => {
  try {
    const res = await api.post("/negotiation/negotiate/all");
    return res.data;
  } catch (error: any) {
    console.error("Error starting all negotiations:", error);
    throw new Error(extractError(error, "Failed to start all negotiations."));
  }
};

/* =========================
   Conflicts
   ========================= */
export const getConflictsByNegotiation = async (negotiationId: string): Promise<Conflict[]> => {
  try {
    const res = await api.get<{ conflicts: Conflict[] }>(`/conflicts/${negotiationId}`);
    return res.data.conflicts || [];
  } catch (error: any) {
    console.error("Error fetching conflicts:", error);
    throw new Error(extractError(error, "Failed to fetch conflicts."));
  }
};

export const getConflictsAggregate = async () => {
  try {
    const res = await api.get("/evaluation/conflicts/aggregate");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching conflict aggregate:", error);
    throw new Error(extractError(error, "Failed to fetch conflict aggregate."));
  }
};

export const getAllConflicts = async (status?: string, type?: string, limit: number = 50, offset: number = 0): Promise<Conflict[]> => {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const res = await api.get(`/conflicts/all?${params.toString()}`);
    // Extract data from the wrapped response
    return res.data?.data || res.data || [];
  } catch (error: any) {
    console.error("Error fetching all conflicts:", error);
    throw new Error(extractError(error, "Failed to fetch conflicts."));
  }
};

export const getProposalsWithConflicts = async () => {
  try {
    const res = await api.get("/conflicts/proposals-with-conflicts");
    // Extract data from the wrapped response
    return res.data?.data || res.data || null;
  } catch (error: any) {
    console.error("Error fetching proposals with conflicts:", error);
    throw new Error(extractError(error, "Failed to fetch proposals with conflicts."));
  }
};

/* =========================
   Benchmarking
   ========================= */
export const runBenchmarking = async (proposalId: string, stakeholderIds: string[], maxRounds: number = 3): Promise<BenchmarkResult> => {
  try {
    const res = await api.post<BenchmarkResult>("/benchmarking/run", {
      proposalId,
      stakeholderIds,
      maxRounds
    });
    return res.data;
  } catch (error: any) {
    console.error("Error running benchmarking:", error);
    throw new Error(extractError(error, "Failed to run benchmarking."));
  }
};

export const getAllBenchmarkResults = async (): Promise<BenchmarkResult[]> => {
  try {
    const res = await api.get<{
      success: boolean;
      message: string;
      timestamp: string;
      data: BenchmarkResult[];
    }>('/benchmarking/results');
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching all benchmark results:", error);
    throw new Error(extractError(error, "Failed to fetch benchmark results."));
  }
};

export const getBenchmarkResults = async (benchmarkId: string): Promise<BenchmarkResult> => {
  try {
    // First try to get by benchmark ID
    try {
      const res = await api.get<BenchmarkResult>(`/benchmarking/results/${benchmarkId}`);
      return res.data;
    } catch (error) {
      // If that fails, try to get by negotiation ID
      console.warn("Failed to fetch by benchmark ID, trying negotiation ID:", error);
      const res = await api.get<BenchmarkResult>(`/benchmarking/results/negotiation/${benchmarkId}`);
      return res.data;
    }
  } catch (error: any) {
    console.error("Error fetching benchmark results:", error);
    throw new Error(extractError(error, "Failed to fetch benchmark results."));
  }
};

export const getBenchmarkAnalysis = async (negotiationId: string) => {
  try {
    const res = await api.get(`/benchmarking/analysis/${negotiationId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching benchmark analysis:", error);
    throw new Error(extractError(error, "Failed to fetch benchmark analysis."));
  }
};

export const getMethodComparison = async () => {
  try {
    const res = await api.get("/benchmarking/methods/comparison");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching method comparison:", error);
    throw new Error(extractError(error, "Failed to fetch method comparison."));
  }
};

export const getBenchmarkMetricsSummary = async () => {
  try {
    const res = await api.get("/benchmarking/metrics/summary");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching benchmark metrics summary:", error);
    throw new Error(extractError(error, "Failed to fetch benchmark metrics summary."));
  }
};

export const exportBenchmarkCSV = async (negotiationId?: string): Promise<void> => {
  let urlObj: string | null = null;
  try {
    const endpoint = negotiationId 
      ? `/benchmarking/export/csv?negotiationId=${negotiationId}`
      : "/benchmarking/export/csv";
    
    const res = await api.get(endpoint, { responseType: "blob" });
    urlObj = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = urlObj;
    link.setAttribute("download", `benchmark_results_${timestamp()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    console.error("Error exporting benchmark CSV:", error);
    throw new Error(extractError(error, "Failed to export benchmark CSV."));
  } finally {
    if (urlObj) window.URL.revokeObjectURL(urlObj);
  }
};

/* =========================
   Feasibility Analysis
   ========================= */
export const analyzeFeasibility = async (proposalId: string, analysisType: 'initial' | 'revision' | 'final' = 'initial', includeStakeholders: boolean = true, options: any = {}): Promise<FeasibilityAnalysis> => {
  try {
    const res = await api.post(`/feasibility/analyze/${proposalId}`, {
      analysisType,
      includeStakeholders,
      options
    });
    // Extract data from the wrapped response structure: { statusCode, response: { success, message, data } }
    return res.data?.response?.data || res.data?.data || res.data;
  } catch (error: any) {
    console.error("Error analyzing feasibility:", error);
    throw new Error(extractError(error, "Failed to analyze feasibility."));
  }
};

export const getFeasibilityResults = async (proposalId: string): Promise<FeasibilityAnalysis> => {
  try {
    const res = await api.get(`/feasibility/results/${proposalId}`);
    // Extract data from the wrapped response structure: { statusCode, response: { success, message, data } }
    return res.data?.response?.data || res.data?.data || res.data;
  } catch (error: any) {
    console.error("Error fetching feasibility results:", error);
    throw new Error(extractError(error, "Failed to fetch feasibility results."));
  }
};

export const getAllFeasibilityAnalyses = async (): Promise<FeasibilityAnalysis[]> => {
  try {
    const res = await api.get("/feasibility/all");
    // Extract data from the wrapped response structure: { statusCode, response: { success, message, data } }
    return res.data?.response?.data || res.data?.data || res.data || [];
  } catch (error: any) {
    console.error("Error fetching all feasibility analyses:", error);
    throw new Error(extractError(error, "Failed to fetch feasibility analyses."));
  }
};

export const getFeasibilitySummary = async () => {
  try {
    const res = await api.get("/feasibility/summary");
    // Extract data from the wrapped response structure: { statusCode, response: { success, message, data } }
    return res.data?.response?.data || res.data?.data || res.data || null;
  } catch (error: any) {
    console.error("Error fetching feasibility summary:", error);
    throw new Error(extractError(error, "Failed to fetch feasibility summary."));
  }
};

export const getCriticalFeasibilityIssues = async () => {
  try {
    const res = await api.get("/feasibility/critical");
    // Extract data from the wrapped response structure: { statusCode, response: { success, message, data } }
    return res.data?.response?.data || res.data?.data || res.data || [];
  } catch (error: any) {
    console.error("Error fetching critical feasibility issues:", error);
    throw new Error(extractError(error, "Failed to fetch critical feasibility issues."));
  }
};

export const getFeasibilityRecommendations = async (proposalId: string) => {
  try {
    const res = await api.get(`/feasibility/recommendations/${proposalId}`);
    // Extract data from the wrapped response
    return res.data?.data || res.data || [];
  } catch (error: any) {
    console.error("Error fetching feasibility recommendations:", error);
    throw new Error(extractError(error, "Failed to fetch feasibility recommendations."));
  }
};

export const exportFeasibilityCSV = async (): Promise<void> => {
  let urlObj: string | null = null;
  try {
    const res = await api.get("/feasibility/export/csv", { responseType: "blob" });
    urlObj = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = urlObj;
    link.setAttribute("download", `feasibility_analysis_${timestamp()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    console.error("Error exporting feasibility CSV:", error);
    throw new Error(extractError(error, "Failed to export feasibility CSV."));
  } finally {
    if (urlObj) window.URL.revokeObjectURL(urlObj);
  }
};

/* =========================
   Feedback Analytics
   ========================= */
export const getFeedbackAnalytics = async (negotiationId?: string, feedbackType?: string, stakeholderRole?: string): Promise<FeedbackAnalytics> => {
  try {
    const params = new URLSearchParams();
    if (negotiationId) params.append('negotiationId', negotiationId);
    if (feedbackType) params.append('feedbackType', feedbackType);
    if (stakeholderRole) params.append('stakeholderRole', stakeholderRole);
    
    const res = await api.get<{ data: FeedbackAnalytics }>(`/admin/feedback/analytics?${params.toString()}`);
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching feedback analytics:", error);
    throw new Error(extractError(error, "Failed to fetch feedback analytics."));
  }
};

export const getFeedbackByNegotiation = async (negotiationId: string) => {
  try {
    const res = await api.get(`/admin/feedback/negotiation/${negotiationId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching feedback by negotiation:", error);
    throw new Error(extractError(error, "Failed to fetch feedback by negotiation."));
  }
};

export const computeFeedback = async (feedbackData: any) => {
  try {
    const res = await api.post("/admin/feedback/compute", feedbackData);
    return res.data;
  } catch (error: any) {
    console.error("Error computing feedback:", error);
    throw new Error(extractError(error, "Failed to compute feedback."));
  }
};

export const getResearchData = async (negotiationId: string): Promise<ResearchData> => {
  try {
    const res = await api.get<{ data: ResearchData }>(`/admin/feedback/research-data?negotiationId=${negotiationId}`);
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching research data:", error);
    throw new Error(extractError(error, "Failed to fetch research data."));
  }
};

/* =========================
   Combined Negotiation
   ========================= */
export const initializeCombinedNegotiation = async (proposalId: string, stakeholderIds: string[], maxRounds: number = 5) => {
  try {
    const res = await api.post("/combined-negotiation/initialize", {
      proposalId,
      stakeholderIds,
      maxRounds
    });
    return res.data;
  } catch (error: any) {
    console.error("Error initializing combined negotiation:", error);
    throw new Error(extractError(error, "Failed to initialize combined negotiation."));
  }
};

export const processStakeholderTurn = async (negotiationId: string, swingWeights: any, comments?: string) => {
  try {
    const res = await api.post(`/combined-negotiation/${negotiationId}/turn`, {
      swingWeights,
      comments
    });
    return res.data;
  } catch (error: any) {
    console.error("Error processing stakeholder turn:", error);
    throw new Error(extractError(error, "Failed to process stakeholder turn."));
  }
};

export const finalizeCombinedNegotiation = async (negotiationId: string) => {
  try {
    const res = await api.post(`/combined-negotiation/${negotiationId}/finalize`);
    return res.data;
  } catch (error: any) {
    console.error("Error finalizing combined negotiation:", error);
    throw new Error(extractError(error, "Failed to finalize combined negotiation."));
  }
};

export const getCombinedNegotiationStatus = async (negotiationId: string) => {
  try {
    const res = await api.get(`/combined-negotiation/${negotiationId}/status`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching combined negotiation status:", error);
    throw new Error(extractError(error, "Failed to fetch combined negotiation status."));
  }
};

/* =========================
   NLP and Summaries
   ========================= */
export const summarizeProposal = async (proposalId: string, anchorOnChain: boolean = false) => {
  try {
    const res = await api.post(`/nlp/proposals/${proposalId}/summarize`, {
      anchorOnChain
    });
    return res.data;
  } catch (error: any) {
    console.error("Error summarizing proposal:", error);
    throw new Error(extractError(error, "Failed to summarize proposal."));
  }
};

export const summarizeAllProposals = async (onlyMissing: boolean = true, limit: number = 0, anchorOnChain: boolean = false) => {
  try {
    const res = await api.post("/nlp/proposals/summarize-all", {
      onlyMissing,
      limit,
      anchorOnChain
    });
    return res.data;
  } catch (error: any) {
    console.error("Error summarizing all proposals:", error);
    throw new Error(extractError(error, "Failed to summarize all proposals."));
  }
};

export const getSummaries = async (q?: string, proposalId?: string, latestOnly: boolean = true, page: number = 1, limit: number = 25, sort: string = "-createdAt", exportFormat?: 'csv' | 'json') => {
  try {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (proposalId) params.append('proposalId', proposalId);
    params.append('latestOnly', latestOnly.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sort', sort);
    if (exportFormat) params.append('export', exportFormat);
    
    const res = await api.get(`/summaries?${params.toString()}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching summaries:", error);
    throw new Error(extractError(error, "Failed to fetch summaries."));
  }
};

/**
 * Get comprehensive NLP analysis of a proposal
 */
export const getProposalNLPAnalysis = async (proposalId: string) => {
  try {
    const res = await api.get(`/nlp/proposals/${proposalId}/analyze`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching NLP analysis:", error);
    throw new Error(extractError(error, "Failed to fetch NLP analysis."));
  }
};

export const downloadSummary = async (summaryId: string): Promise<void> => {
  let urlObj: string | null = null;
  try {
    const res = await api.get(`/summaries/${summaryId}/download`, { responseType: "blob" });
    urlObj = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = urlObj;
    link.setAttribute("download", `summary_${summaryId}_${timestamp()}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    console.error("Error downloading summary:", error);
    throw new Error(extractError(error, "Failed to download summary."));
  } finally {
    if (urlObj) window.URL.revokeObjectURL(urlObj);
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

/* =========================
   Batch Summarization
   ========================= */
export interface BatchSummarizeResponse {
  processed: number;
  onlyMissing: boolean;
  limit: number;
  anchorOnChain: boolean;
  items: Array<{
    proposalId: string;
    summary: string;
    summaryId: string;
    anchored?: {
      enabled: boolean;
      transactionHash?: string;
      blockNumber?: number;
      error?: string;
    };
  }>;
}

export interface BlockchainStorageResponse {
  message: string;
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    proposalId: string;
    title: string;
    status: 'success' | 'failed' | 'dry-run';
    transactionHash?: string;
    blockNumber?: number;
    network?: string;
    error?: string;
    message?: string;
  }>;
  dryRun: boolean;
}

export const storeAllProposalsOnBlockchain = async (options: {
  dryRun?: boolean;
  limit?: number;
} = {}): Promise<BlockchainStorageResponse> => {
  try {
    const response = await api.post('/blockchain/store-all-proposals', options);
    return response.data;
  } catch (error: any) {
    console.error("Error storing proposals on blockchain:", error);
    throw new Error(extractError(error, "Failed to store proposals on blockchain."));
  }
};

export interface BlockchainSummary {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalProposalsStored: number;
  averageTransactionTime: number;
  blockchainHealth: {
    status: string;
    lastTransaction: string | null;
    successRate: number;
    averageResponseTime: number;
    networkStatus: string;
  };
}

export interface BlockchainTransaction {
  _id: string;
  proposalId?: string;
  transactionHash?: string;
  status: string;
  timestamp: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  proposal?: {
    _id: string;
    title: string;
    description: string;
    status: string;
  };
}

export interface BlockchainTransactionsResponse {
  transactions: BlockchainTransaction[];
  totalCount: number;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const getBlockchainSummary = async (): Promise<BlockchainSummary> => {
  try {
    const res = await api.get("/blockchain/summary");
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error("Error fetching blockchain summary:", error);
    throw new Error(extractError(error, "Failed to fetch blockchain summary."));
  }
};

export const getBlockchainTransactions = async (params: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<BlockchainTransactionsResponse> => {
  try {
    const res = await api.get("/blockchain/transactions", { params });
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error("Error fetching blockchain transactions:", error);
    throw new Error(extractError(error, "Failed to fetch blockchain transactions."));
  }
};

/* =========================
   Settings
   ========================= */
export interface SystemInfo {
  database: {
    status: string;
    connected: boolean;
    collections: {
      proposals: number;
      users: number;
      negotiations: number;
      blockchainStored: number;
    };
  };
  blockchain: {
    status: string;
    lastActivity: string | null;
    totalTransactions: number;
  };
  system: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    environment: string;
  };
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    database: {
      status: string;
      message: string;
      details: any;
    };
    collections: {
      status: string;
      message: string;
      details: any;
    };
    memory: {
      status: string;
      message: string;
      details: any;
    };
    uptime: {
      status: string;
      message: string;
      details: any;
    };
  };
  timestamp: string;
}

export interface BackupResponse {
  backupId: string;
  timestamp: string;
  size: number;
  collections: number;
}

export const getSystemInfo = async (): Promise<SystemInfo> => {
  try {
    const res = await api.get("/settings/system-info");
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error("Error fetching system info:", error);
    throw new Error(extractError(error, "Failed to fetch system information."));
  }
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    const res = await api.get("/settings/system-health");
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error("Error fetching system health:", error);
    throw new Error(extractError(error, "Failed to fetch system health."));
  }
};

export const exportSystemData = async (type: string, format: string = 'csv'): Promise<void> => {
  try {
    const res = await api.get("/settings/export-data", {
      params: { type, format },
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error("Error exporting data:", error);
    throw new Error(extractError(error, "Failed to export data."));
  }
};

export const createSystemBackup = async (options: {
  includeBlockchain?: boolean;
  includeUsers?: boolean;
} = {}): Promise<BackupResponse> => {
  try {
    const res = await api.post("/settings/backup", options);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error("Error creating backup:", error);
    throw new Error(extractError(error, "Failed to create system backup."));
  }
};

/**
 * Undo elicitation - remove all preferences from all proposals
 */
export const undoAllElicitation = async (): Promise<{ message: string; deleted: number }> => {
  try {
    const response = await api.delete('/admin/preferences/undo-all');
    return response.data;
  } catch (error: any) {
    console.error("Error undoing elicitation:", error);
    throw new Error(extractError(error, "Failed to undo elicitation."));
  }
};

/**
 * Run automated elicitation for all proposals
 */
export const elicitAllPreferences = async (): Promise<{ message: string; processed: number; created: number }> => {
  try {
    const response = await api.post('/admin/preferences/elicit-all');
    return response.data;
  } catch (error: any) {
    console.error("Error running elicitation for all:", error);
    throw new Error(extractError(error, "Failed to run elicitation for all proposals."));
  }
};

/**
 * Mark individual proposal as elicitation completed
 */
export const markElicitationDone = async (proposalId: string): Promise<{ message: string; proposalId: string }> => {
  try {
    const response = await api.put(`/admin/proposals/${proposalId}/elicitation-done`);
    return response.data;
  } catch (error: any) {
    console.error("Error marking elicitation as done:", error);
    throw new Error(extractError(error, "Failed to mark elicitation as done."));
  }
};
