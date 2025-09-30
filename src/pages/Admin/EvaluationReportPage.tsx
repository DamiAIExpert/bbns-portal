// src/pages/Admin/EvaluationReportPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Typography,
  Spin,
  Alert,
  Select,
  Row,
  Col,
  Statistic,
  Button,
  Empty,
  Progress,
  App,
  Tooltip,
  Table,
  Space,
  Divider,
  InputNumber,
  Input,
  Slider,
  DatePicker,
  Badge,
  Tag,
  Drawer,
  Rate,
  Tabs,
  notification,
} from "antd";
import {
  BarChartOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  SmileOutlined,
  CheckSquareOutlined,
  LikeOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  SearchOutlined,
  EyeOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { getAllProposals, getEvaluationMetrics, downloadEvaluationReport } from "../../services/adminService";
import { getComprehensiveDashboardData } from "../../services/dashboardService";
import api from "../../services/api";
import type { Proposal } from "../../services/proposalService";
import type { EvaluationMetrics } from "../../services/adminService";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;

/* ───────────────────────────────── Types ───────────────────────────────── */

interface UIProposal extends Omit<Proposal, 'status' | 'createdAt' | 'updatedAt' | 'stakeholders' | 'negotiationId'> {
  negotiationId?: string | null;
  status?: 'pending' | 'finalized' | 'in_negotiation' | 'rejected' | string;
  title: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  stakeholders?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  performanceScore?: number;
}

interface EvalRow {
  negotiationId: string;
  proposalTitles?: string;
  timeToConsensus: number | null; // seconds
  numberOfRounds: number;
  utilityGain: number;
  stakeholderSatisfaction: number | null; // 1..5
  resolutionSuccessRate: number; // %
  resolutionStability: number; // %
  decisionConsistency: number; // %
  createdAt?: string;
  updatedAt?: string;
  performanceScore?: number; // calculated overall score
  trend?: 'improving' | 'stable' | 'declining';
}

interface SelectOption { 
  value: string; 
  label: string;
  disabled?: boolean;
  metadata?: Record<string, any>;
}

interface FilterState {
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  status?: string[];
  stakeholders?: string[];
  performanceRange?: [number, number];
  searchTerm?: string;
}

interface DashboardMetrics {
  totalNegotiations: number;
  avgPerformanceScore: number;
  topPerformingNegotiation: string;
  recentTrend: 'up' | 'down' | 'stable';
  stakeholderSatisfactionTrend: number;
}

/* ────────────────────────────── Helpers ─────────────────────────────── */

const isFinalized = (status?: string): boolean => {
  const s = (status || "").toLowerCase();
  return (
    s === "finalized" ||
    s === "final" ||
    s === "completed" ||
    s === "closed" ||
    s.includes("final")
  );
};

const safeAvg = (arr: (number | null | undefined)[]): number | null => {
  const vals = arr.map((x) => (typeof x === "number" ? x : NaN)).filter((x) => !Number.isNaN(x));
  if (!vals.length) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum / vals.length;
};

const pct = (v?: number | null): number => (typeof v === "number" ? Math.max(0, Math.min(100, v)) : 0);

const calculatePerformanceScore = (evaluation: EvalRow): number => {
  const weights = {
    utilityGain: 0.25,
    stakeholderSatisfaction: 0.20,
    resolutionSuccessRate: 0.20,
    resolutionStability: 0.15,
    decisionConsistency: 0.20
  };
  
  let score = 0;
  score += (evaluation.utilityGain || 0) * weights.utilityGain * 100;
  score += ((evaluation.stakeholderSatisfaction || 0) / 5) * weights.stakeholderSatisfaction * 100;
  score += (evaluation.resolutionSuccessRate || 0) * weights.resolutionSuccessRate;
  score += (evaluation.resolutionStability || 0) * weights.resolutionStability;
  score += (evaluation.decisionConsistency || 0) * weights.decisionConsistency;
  
  return Math.round(score);
};

const getTrendIcon = (trend?: string) => {
  switch (trend) {
    case 'improving': return <RiseOutlined style={{ color: '#52c41a' }} />;
    case 'declining': return <FallOutlined style={{ color: '#ff4d4f' }} />;
    default: return <SyncOutlined style={{ color: '#1890ff' }} />;
  }
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};


const toCsv = (rows: EvalRow[]): string => {
  const headers = [
    "negotiationId",
    "proposalTitles",
    "timeToConsensus",
    "numberOfRounds",
    "utilityGain",
    "stakeholderSatisfaction",
    "resolutionSuccessRate",
    "resolutionStability",
    "decisionConsistency",
    "performanceScore",
    "createdAt",
    "updatedAt"
  ];
  
  const esc = (s: any): string => {
    const str = s == null ? "" : String(s);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const lines = [headers.join(",")].concat(
    rows.map((r) =>
      [
        r.negotiationId,
        r.proposalTitles ?? "",
        r.timeToConsensus ?? "",
        r.numberOfRounds ?? "",
        r.utilityGain ?? "",
        r.stakeholderSatisfaction ?? "",
        r.resolutionSuccessRate ?? "",
        r.resolutionStability ?? "",
        r.decisionConsistency ?? "",
        r.performanceScore ?? "",
        r.createdAt ?? "",
        r.updatedAt ?? "",
      ]
        .map(esc)
        .join(",")
    )
  );
  return lines.join("\n");
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const tsStamp = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(
    d.getMinutes()
  )}-${p(d.getSeconds())}`;
};

const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string, description?: string): void => {
  notification[type]({
    message,
    description,
    placement: 'topRight',
    duration: 4.5,
  });
};

/* ────────────────────────────── Component ───────────────────────────── */

// Mock data for evaluations
const mockEvaluations: EvalRow[] = [
  {
    negotiationId: 'neg-001',
    proposalTitles: 'User Authentication System',
    timeToConsensus: 3600,
    numberOfRounds: 3,
    utilityGain: 0.85,
    stakeholderSatisfaction: 4.2,
    resolutionSuccessRate: 90,
    resolutionStability: 85,
    decisionConsistency: 88,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    performanceScore: 87,
    trend: 'improving'
  },
  {
    negotiationId: 'neg-002',
    proposalTitles: 'Mobile UI Framework',
    timeToConsensus: 5400,
    numberOfRounds: 4,
    utilityGain: 0.78,
    stakeholderSatisfaction: 3.8,
    resolutionSuccessRate: 85,
    resolutionStability: 80,
    decisionConsistency: 82,
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
    performanceScore: 81,
    trend: 'stable'
  },
  {
    negotiationId: 'neg-003',
    proposalTitles: 'Database Optimization',
    timeToConsensus: 7200,
    numberOfRounds: 5,
    utilityGain: 0.92,
    stakeholderSatisfaction: 4.5,
    resolutionSuccessRate: 95,
    resolutionStability: 90,
    decisionConsistency: 93,
    createdAt: '2024-01-17T08:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
    performanceScore: 94,
    trend: 'improving'
  }
];

const EvaluationReportPage: React.FC = () => {
  // Core data state
  const [proposals, setProposals] = useState<UIProposal[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<EvalRow[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvalRow[]>([]);
  const [selectedNegotiationId, setSelectedNegotiationId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Loading states
  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  const [loadingAllEvals, setLoadingAllEvals] = useState<boolean>(true);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [ttcMax, setTtcMax] = useState<number>(600);
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState<boolean>(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvalRow | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const { message } = App.useApp();

  const fetchProposals = useCallback(async () => {
    try {
      setLoadingProposals(true);
      setError(null);
      const fetched = (await getAllProposals()) as unknown as UIProposal[];
      const processedProposals = (fetched || []).map(proposal => ({
        ...proposal,
        performanceScore: proposal.negotiationId ? 
          allEvaluations.find(evaluation => evaluation.negotiationId === proposal.negotiationId)?.performanceScore : undefined
      }));
      setProposals(processedProposals);
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch proposals.";
      setError(msg);
      showNotification('error', 'Failed to Load Proposals', msg);
    } finally {
      setLoadingProposals(false);
    }
  }, [message, allEvaluations]);

  const fetchAllEvaluations = useCallback(async () => {
    try {
      setLoadingAllEvals(true);
      setError(null);
      // Prefer the aggregate endpoint which returns a list
      const { data } = await api.get<{ evaluations: EvalRow[] }>("/evaluation", {
        headers: { "Cache-Control": "no-cache" },
      });
      
      let evaluations = data?.evaluations || [];
      
      // Enhance evaluations with calculated fields
      evaluations = evaluations.map(evaluation => ({
        ...evaluation,
        performanceScore: calculatePerformanceScore(evaluation),
        trend: evaluation.createdAt && evaluation.updatedAt ? 
          (new Date(evaluation.updatedAt) > new Date(evaluation.createdAt) ? 'improving' : 'stable') : 'stable'
      }));
      
      setAllEvaluations(evaluations);
      
      // Calculate dashboard metrics
      const totalNegotiations = evaluations.length;
      const avgPerformanceScore = safeAvg(evaluations.map(evaluation => evaluation.performanceScore)) || 0;
      const topPerforming = evaluations.reduce((max, curr) => 
        (curr.performanceScore || 0) > (max.performanceScore || 0) ? curr : max, evaluations[0] || {});
      
      setDashboardMetrics({
        totalNegotiations,
        avgPerformanceScore,
        topPerformingNegotiation: topPerforming.proposalTitles || topPerforming.negotiationId,
        recentTrend: 'stable',
        stakeholderSatisfactionTrend: safeAvg(evaluations.map(evaluation => evaluation.stakeholderSatisfaction)) || 0
      });
      
    } catch (err: any) {
      console.warn("Failed to fetch evaluations:", err);
      // Use dashboard data to create realistic evaluations
      const dashboardData = await getComprehensiveDashboardData();
      const realEvaluations: EvalRow[] = [
        {
          negotiationId: "real-1",
          proposalTitles: "Student Portal Requirements",
          timeToConsensus: dashboardData.negotiationMetrics.consensusLevel,
          numberOfRounds: Math.round(dashboardData.negotiationMetrics.averageProposalsPerNegotiation),
          utilityGain: dashboardData.negotiationMetrics.nashProduct,
          stakeholderSatisfaction: dashboardData.negotiationMetrics.fairnessIndex * 5,
          resolutionSuccessRate: dashboardData.negotiationMetrics.successRate,
          resolutionStability: dashboardData.negotiationMetrics.fairnessIndex * 100,
          decisionConsistency: dashboardData.negotiationMetrics.consensusLevel * 100,
          createdAt: dayjs().subtract(7, 'days').toISOString(),
          updatedAt: dayjs().subtract(2, 'days').toISOString(),
          performanceScore: 89,
          trend: 'improving' as const
        },
        {
          negotiationId: "real-2", 
          proposalTitles: "E-commerce Platform Requirements",
          timeToConsensus: dashboardData.negotiationMetrics.consensusLevel * 0.8,
          numberOfRounds: Math.round(dashboardData.negotiationMetrics.averageProposalsPerNegotiation * 0.7),
          utilityGain: dashboardData.negotiationMetrics.nashProduct * 1.1,
          stakeholderSatisfaction: dashboardData.negotiationMetrics.fairnessIndex * 5.2,
          resolutionSuccessRate: Math.min(dashboardData.negotiationMetrics.successRate * 1.05, 100),
          resolutionStability: dashboardData.negotiationMetrics.fairnessIndex * 105,
          decisionConsistency: dashboardData.negotiationMetrics.consensusLevel * 105,
          createdAt: dayjs().subtract(5, 'days').toISOString(),
          updatedAt: dayjs().subtract(1, 'day').toISOString(),
          performanceScore: 93,
          trend: 'stable' as const
        },
        {
          negotiationId: "real-3",
          proposalTitles: "Mobile App Security Requirements",
          timeToConsensus: dashboardData.negotiationMetrics.consensusLevel * 1.2,
          numberOfRounds: Math.round(dashboardData.negotiationMetrics.averageProposalsPerNegotiation * 1.3),
          utilityGain: dashboardData.negotiationMetrics.nashProduct * 0.9,
          stakeholderSatisfaction: dashboardData.negotiationMetrics.fairnessIndex * 4.5,
          resolutionSuccessRate: dashboardData.negotiationMetrics.successRate * 0.9,
          resolutionStability: dashboardData.negotiationMetrics.fairnessIndex * 90,
          decisionConsistency: dashboardData.negotiationMetrics.consensusLevel * 90,
          createdAt: dayjs().subtract(3, 'days').toISOString(),
          updatedAt: dayjs().subtract(1, 'hour').toISOString(),
          performanceScore: 82,
          trend: 'declining' as const
        }
      ];
      
      setAllEvaluations(mockEvaluations);
      
      setDashboardMetrics({
        totalNegotiations: mockEvaluations.length,
        avgPerformanceScore: 88,
        topPerformingNegotiation: "E-commerce Platform Requirements",
        recentTrend: 'up',
        stakeholderSatisfactionTrend: 4.17
      });
      
      showNotification('warning', 'Using Mock Data', 'Unable to fetch real evaluations, showing demo data');
    } finally {
      setLoadingAllEvals(false);
    }
  }, []);

  // Filter evaluations based on current filter state
  useEffect(() => {
    let filtered = [...allEvaluations];
    
    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(evaluation => 
        evaluation.negotiationId.toLowerCase().includes(searchLower) ||
        evaluation.proposalTitles?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(evaluation => {
        if (!evaluation.createdAt) return true;
        const evalDate = dayjs(evaluation.createdAt);
        return evalDate.isAfter(start) && evalDate.isBefore(end);
      });
    }
    
    // Apply performance range filter
    if (filters.performanceRange) {
      const [min, max] = filters.performanceRange;
      filtered = filtered.filter(evaluation => {
        const score = evaluation.performanceScore || 0;
        return score >= min && score <= max;
      });
    }
    
    setFilteredEvaluations(filtered);
  }, [allEvaluations, filters]);

  useEffect(() => {
    (async () => {
      await fetchProposals();
      await fetchAllEvaluations();
      await loadDashboardData();
    })();
  }, [fetchProposals, fetchAllEvaluations]);

  const loadDashboardData = useCallback(async () => {
    try {
      const data = await getComprehensiveDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, []);

  const finalizedOptions = useMemo<SelectOption[]>(() => {
    const eligible = (proposals || []).filter((p) => isFinalized(p.status) && !!p?.negotiationId);
    return eligible.map((p) => ({
      value: String(p.negotiationId),
      label: p.title || `Negotiation ${String(p.negotiationId).slice(-6)}`,
      metadata: {
        priority: p.priority,
        stakeholders: p.stakeholders,
        performanceScore: p.performanceScore
      }
    }));
  }, [proposals]);

  const fallbackOptions = useMemo<SelectOption[]>(() => {
    if (!allEvaluations?.length) return [];
    return allEvaluations.map((e) => ({
      value: e.negotiationId,
      label: e.proposalTitles || `Negotiation ${e.negotiationId.slice(-6)}`,
      metadata: {
        performanceScore: e.performanceScore,
        trend: e.trend
      }
    }));
  }, [allEvaluations]);

  const selectOptions: SelectOption[] =
    finalizedOptions.length > 0 ? finalizedOptions : fallbackOptions;
  const hasOptions = selectOptions.length > 0;

  const handleSelect = async (negotiationId?: string) => {
    if (!negotiationId) {
      setSelectedNegotiationId(null);
      setMetrics(null);
      setError(null);
      return;
    }
    setSelectedNegotiationId(negotiationId);
    setMetrics(null);
    setError(null);

    try {
      setLoadingMetrics(true);
      const fetched = await getEvaluationMetrics(negotiationId);
      setMetrics(fetched);
      showNotification('success', 'Metrics Loaded', 'Evaluation metrics loaded successfully');
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch evaluation metrics.";
      setError(msg);
      showNotification('error', 'Failed to Load Metrics', msg);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProposals(), fetchAllEvaluations()]);
      showNotification('success', 'Data Refreshed', 'All data has been updated');
    } catch (err: any) {
      showNotification('error', 'Refresh Failed', 'Unable to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDetails = (evaluation: EvalRow) => {
    setSelectedEvaluation(evaluation);
    setShowDetailsDrawer(true);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
    showNotification('info', 'Filters Cleared', 'All filters have been reset');
  };

  const handleDownloadFull = async () => {
    try {
      setDownloading(true);
      message.loading({ content: "Preparing full report…", key: "dl", duration: 0 });
      await downloadEvaluationReport(); // server CSV
      message.success({ content: "Full report download started!", key: "dl", duration: 2 });
      showNotification('success', 'Download Started', 'Full evaluation report download initiated');
    } catch (err: any) {
      message.error({ content: err?.message || "Failed to download report.", key: "dl" });
      showNotification('error', 'Download Failed', err?.message || 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadVisible = () => {
    const dataToExport = filteredEvaluations.length > 0 ? filteredEvaluations : allEvaluations;
    if (!dataToExport?.length) {
      showNotification('warning', 'No Data', 'No evaluations to export');
      return;
    }
    const csv = toCsv(dataToExport);
    const filename = `evaluations_${filteredEvaluations.length > 0 ? 'filtered' : 'all'}_${tsStamp()}.csv`;
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
    showNotification('success', 'Export Complete', `Exported ${dataToExport.length} evaluations to CSV`);
  };

  /* ──────────────── Aggregates across all evaluations (KPI cards) ──────────────── */

  const kpis = useMemo(() => {
    const data = filteredEvaluations.length > 0 ? filteredEvaluations : allEvaluations;
    
    if (!data?.length) {
      return {
        avgTtc: null,
        avgRounds: null,
        avgUtility: null,
        avgSss: null,
        avgSuccess: null,
        avgStability: null,
        avgConsistency: null,
        avgPerformance: null,
        count: 0,
        improving: 0,
        stable: 0,
        declining: 0,
      };
    }
    
    const improving = data.filter(e => e.trend === 'improving').length;
    const stable = data.filter(e => e.trend === 'stable').length;
    const declining = data.filter(e => e.trend === 'declining').length;
    
    return {
      avgTtc: safeAvg(data.map((e) => e.timeToConsensus)),
      avgRounds: safeAvg(data.map((e) => e.numberOfRounds)),
      avgUtility: safeAvg(data.map((e) => e.utilityGain)),
      avgSss: safeAvg(data.map((e) => e.stakeholderSatisfaction)),
      avgSuccess: safeAvg(data.map((e) => e.resolutionSuccessRate)),
      avgStability: safeAvg(data.map((e) => e.resolutionStability)),
      avgConsistency: safeAvg(data.map((e) => e.decisionConsistency)),
      avgPerformance: safeAvg(data.map((e) => e.performanceScore)),
      count: data.length,
      improving,
      stable,
      declining,
    };
  }, [allEvaluations, filteredEvaluations]);

  /* ────────────────────── Table of all evaluations ───────────────────── */

  const columns = [
    { 
      title: "Negotiation", 
      dataIndex: "negotiationId", 
      key: "negotiationId", 
      width: 180,
      render: (text: string, record: EvalRow) => (
        <Space direction="vertical" size="small">
          <Text strong>{text.slice(-8)}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.createdAt ? dayjs(record.createdAt).format('MMM DD, YYYY') : 'N/A'}
          </Text>
        </Space>
      ),
      sorter: (a: EvalRow, b: EvalRow) => a.negotiationId.localeCompare(b.negotiationId),
    },
    { 
      title: "Proposal(s)", 
      dataIndex: "proposalTitles", 
      key: "proposalTitles", 
      ellipsis: true,
      render: (text: string, record: EvalRow) => (
        <Space direction="vertical" size="small">
          <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
            {text || 'Untitled Proposal'}
          </Text>
          {record.performanceScore && (
            <Tag color={record.performanceScore >= 90 ? 'green' : record.performanceScore >= 70 ? 'blue' : 'orange'}>
              Score: {record.performanceScore}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Performance",
      key: "performance",
      width: 120,
      render: (_: any, record: EvalRow) => (
        <Space direction="vertical" size="small">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Text strong>{record.performanceScore || 0}</Text>
            {getTrendIcon(record.trend)}
          </div>
          <Progress 
            percent={pct(record.performanceScore)} 
            size="small" 
            showInfo={false}
            strokeColor={(record.performanceScore || 0) >= 90 ? '#52c41a' : (record.performanceScore || 0) >= 70 ? '#1890ff' : '#faad14'}
          />
        </Space>
      ),
      sorter: (a: EvalRow, b: EvalRow) => (a.performanceScore || 0) - (b.performanceScore || 0),
    },
    {
      title: "TTC",
      dataIndex: "timeToConsensus",
      key: "timeToConsensus",
      width: 120,
      render: (v: number | null) =>
        typeof v === "number" ? (
          <Space direction="vertical" size="small">
            <Text>{formatDuration(v)}</Text>
            <Progress
              percent={pct((v / (ttcMax || 1)) * 100)}
              size="small"
              showInfo={false}
              strokeColor={v <= 60 ? '#52c41a' : v <= 120 ? '#faad14' : '#ff4d4f'}
            />
          </Space>
        ) : (
          "N/A"
        ),
      sorter: (a: EvalRow, b: EvalRow) => (a.timeToConsensus || 0) - (b.timeToConsensus || 0),
    },
    {
      title: "Rounds",
      dataIndex: "numberOfRounds",
      key: "numberOfRounds",
      width: 100,
      render: (v: number) => (
        <Badge 
          count={v} 
          style={{ backgroundColor: v <= 3 ? '#52c41a' : v <= 5 ? '#faad14' : '#ff4d4f' }}
        />
      ),
      sorter: (a: EvalRow, b: EvalRow) => a.numberOfRounds - b.numberOfRounds,
    },
    {
      title: "Satisfaction",
      dataIndex: "stakeholderSatisfaction",
      key: "stakeholderSatisfaction",
      width: 130,
      render: (v: number | null) =>
        typeof v === "number" ? (
          <Space direction="vertical" size="small">
            <Rate disabled value={v} style={{ fontSize: '14px' }} />
            <Text type="secondary">{v.toFixed(1)}/5</Text>
          </Space>
        ) : (
          "N/A"
        ),
      sorter: (a: EvalRow, b: EvalRow) => (a.stakeholderSatisfaction || 0) - (b.stakeholderSatisfaction || 0),
    },
    {
      title: "Success Rate",
      dataIndex: "resolutionSuccessRate",
      key: "resolutionSuccessRate",
      width: 120,
      render: (v: number) => (
        <Progress 
          percent={pct(v)} 
          size="small" 
          strokeColor={v >= 90 ? '#52c41a' : v >= 70 ? '#faad14' : '#ff4d4f'}
        />
      ),
      sorter: (a: EvalRow, b: EvalRow) => a.resolutionSuccessRate - b.resolutionSuccessRate,
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: any, record: EvalRow) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewDetails(record)}
          size="small"
        >
          View
        </Button>
      ),
    },
  ];

  /* ────────────────────────────── UI Blocks ───────────────────────────── */

  const renderDashboardMetrics = () => {
    if (!dashboardMetrics) return null;

    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Total Negotiations"
              value={dashboardMetrics.totalNegotiations}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Avg Performance"
              value={dashboardMetrics.avgPerformanceScore}
              precision={1}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="/100"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Satisfaction Trend"
              value={dashboardMetrics.stakeholderSatisfactionTrend}
              precision={2}
              prefix={<SmileOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="/5"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Top Performer"
              value={dashboardMetrics.topPerformingNegotiation}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderFilters = () => (
    <Card className="mb-6">
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={6}>
          <Space>
            <SearchOutlined />
            <Text strong>Search:</Text>
          </Space>
          <Input
            placeholder="Search negotiations..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col xs={24} md={6}>
          <Space>
            <CalendarOutlined />
            <Text strong>Date Range:</Text>
          </Space>
          <DatePicker.RangePicker
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange({ dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] })}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={6}>
          <Space>
            <FilterOutlined />
            <Text strong>Performance:</Text>
          </Space>
          <Slider
            range
            min={0}
            max={100}
            value={filters.performanceRange || [0, 100]}
            onChange={(value) => handleFilterChange({ performanceRange: value as [number, number] })}
            marks={{ 0: '0', 50: '50', 100: '100' }}
          />
        </Col>
        <Col xs={24} md={6}>
          <Space>
            <Button onClick={clearFilters} icon={<ReloadOutlined />}>
              Clear Filters
            </Button>
            <Text type="secondary">
              Showing {filteredEvaluations.length} of {allEvaluations.length}
            </Text>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const renderSelectedMetrics = () => {
    if (loadingMetrics) {
      return (
        <div className="text-center py-20">
          <Spin size="large" />
          <Paragraph className="mt-4 text-gray-500">Loading Evaluation Metrics...</Paragraph>
        </div>
      );
    }

    if (!selectedNegotiationId) {
      return (
        <div className="text-center py-16">
          <Empty
            description={
              <span className="text-gray-500">
                {hasOptions
                  ? "Please select a proposal to view its evaluation metrics."
                  : "No finalized proposals are available for evaluation yet."}
              </span>
            }
          />
        </div>
      );
    }

    if (!metrics) return null;

    const m = metrics;
    const ttcPct = m.timeToConsensus ? Math.min(100, (m.timeToConsensus / (ttcMax || 1)) * 100) : 0;

    return (
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm h-full">
              <Statistic
              title="Time to Consensus"
              value={formatDuration(m.timeToConsensus)}
                prefix={<ClockCircleOutlined />}
              />
            <Progress 
              className="mt-2" 
              percent={pct(ttcPct)} 
              showInfo={false}
              strokeColor={(m.timeToConsensus || 0) <= 60 ? '#52c41a' : (m.timeToConsensus || 0) <= 120 ? '#faad14' : '#ff4d4f'}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Normalized by TTC max: {ttcMax}s
            </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm h-full">
            <Statistic 
              title="Negotiation Rounds" 
              value={m.numberOfRounds} 
              prefix={<SyncOutlined />} 
            />
            <Progress 
              className="mt-2" 
              percent={pct((m.numberOfRounds / 10) * 100)} 
              showInfo={false}
              strokeColor={m.numberOfRounds <= 3 ? '#52c41a' : m.numberOfRounds <= 5 ? '#faad14' : '#ff4d4f'}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Scale heuristic: 10 rounds
            </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm h-full">
            <Statistic 
              title="Utility Gain" 
              value={m.utilityGain} 
              precision={3} 
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: m.utilityGain >= 0.8 ? '#52c41a' : m.utilityGain >= 0.6 ? '#faad14' : '#ff4d4f' }}
            />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm h-full">
              <Statistic
                title="Stakeholder Satisfaction"
                value={m.stakeholderSatisfaction ?? "N/A"}
                precision={2}
                prefix={<SmileOutlined />}
                suffix="/ 5"
              valueStyle={{ color: (m.stakeholderSatisfaction || 0) >= 4 ? '#52c41a' : (m.stakeholderSatisfaction || 0) >= 3 ? '#faad14' : '#ff4d4f' }}
              />
              <Progress
                className="mt-2"
                percent={pct(((m.stakeholderSatisfaction || 0) / 5) * 100)}
                showInfo={false}
              strokeColor={(m.stakeholderSatisfaction || 0) >= 4 ? '#52c41a' : (m.stakeholderSatisfaction || 0) >= 3 ? '#faad14' : '#ff4d4f'}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm h-full">
              <Statistic
                title="Resolution Success Rate"
                value={m.resolutionSuccessRate}
                suffix="%"
                prefix={<CheckSquareOutlined />}
              valueStyle={{ color: m.resolutionSuccessRate >= 90 ? '#52c41a' : m.resolutionSuccessRate >= 70 ? '#faad14' : '#ff4d4f' }}
            />
            <Progress 
              className="mt-2" 
              percent={pct(m.resolutionSuccessRate)} 
              showInfo
              strokeColor={m.resolutionSuccessRate >= 90 ? '#52c41a' : m.resolutionSuccessRate >= 70 ? '#faad14' : '#ff4d4f'}
            />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm h-full">
              <Statistic
                title="Decision Consistency"
                value={m.decisionConsistency}
                suffix="%"
                prefix={<LikeOutlined />}
              valueStyle={{ color: m.decisionConsistency >= 90 ? '#52c41a' : m.decisionConsistency >= 70 ? '#faad14' : '#ff4d4f' }}
            />
            <Progress 
              className="mt-2" 
              percent={pct(m.decisionConsistency)} 
              showInfo
              strokeColor={m.decisionConsistency >= 90 ? '#52c41a' : m.decisionConsistency >= 70 ? '#faad14' : '#ff4d4f'}
            />
            </Card>
          </Col>
        </Row>
    );
  };

  const renderDetailsDrawer = () => (
    <Drawer
      title="Evaluation Details"
      width={600}
      open={showDetailsDrawer}
      onClose={() => setShowDetailsDrawer(false)}
      extra={
        <Button type="primary" icon={<DownloadOutlined />} size="small">
          Export
        </Button>
      }
    >
      {selectedEvaluation && (
        <div>
          <Title level={4}>{selectedEvaluation.proposalTitles}</Title>
          <Paragraph type="secondary">Negotiation ID: {selectedEvaluation.negotiationId}</Paragraph>
          
          <Divider />
          
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Performance Score"
                  value={selectedEvaluation.performanceScore}
                  suffix="/100"
                  valueStyle={{ color: (selectedEvaluation.performanceScore || 0) >= 90 ? '#52c41a' : '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Trend"
                  value={selectedEvaluation.trend}
                  prefix={getTrendIcon(selectedEvaluation.trend)}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card size="small" title="Time to Consensus">
                <Statistic
                  value={formatDuration(selectedEvaluation.timeToConsensus)}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="Negotiation Rounds">
                <Statistic
                  value={selectedEvaluation.numberOfRounds}
                  prefix={<SyncOutlined />}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="Utility Gain">
                <Statistic
                  value={selectedEvaluation.utilityGain}
                  precision={3}
                  prefix={<ArrowUpOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card size="small" title="Stakeholder Satisfaction">
                <Rate disabled value={selectedEvaluation.stakeholderSatisfaction || 0} />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {(selectedEvaluation.stakeholderSatisfaction || 0).toFixed(2)}/5
                </Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Success Rate">
                <Progress 
                  percent={selectedEvaluation.resolutionSuccessRate} 
                  strokeColor="#52c41a"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Stability">
                <Progress 
                  percent={selectedEvaluation.resolutionStability} 
                  strokeColor="#1890ff"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Consistency">
                <Progress 
                  percent={selectedEvaluation.decisionConsistency} 
                  strokeColor="#722ed1"
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </Drawer>
  );

  const formulas = (
    <div style={{ padding: '16px 0' }}>
      <Title level={5}>Evaluation Methodology</Title>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '16px', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: '1.6'
      }}>
        <Text strong>Performance Score Calculation:</Text><br/>
        Score = (Utility Gain × 25%) + (Satisfaction × 20%) + (Success Rate × 20%) + (Stability × 15%) + (Consistency × 20%)<br/><br/>
        
        <Text strong>Time to Consensus (TTC):</Text><br/>
        TTC = t_final - t_start (seconds)<br/><br/>
        
        <Text strong>Negotiation Rounds:</Text><br/>
        NRC = total rounds executed<br/><br/>
        
        <Text strong>Utility Gain:</Text><br/>
        UG = (U_final - U_initial) / max(|U_initial|, 1)<br/><br/>
        
        <Text strong>Stakeholder Satisfaction:</Text><br/>
        SSS = mean_i(rating_i), typically on 1-5 scale<br/><br/>
        
        <Text strong>Resolution Success Rate:</Text><br/>
        RSR (%) = 100 × (#finalized) / (#total)<br/><br/>
        
        <Text strong>Resolution Stability:</Text><br/>
        RST (%) = 100 × (#agreements not reopened) / (#agreements in window)<br/><br/>
        
        <Text strong>Decision Consistency:</Text><br/>
        DC (%) = 100 × (#decisions aligned with preferences) / (#decisions)
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div>
          {/* Dashboard Metrics */}
          {renderDashboardMetrics()}
          
          {/* Controls */}
          <Card className="mb-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Select<string>
                  showSearch
                  allowClear
                  value={selectedNegotiationId ?? undefined}
                  placeholder={
                    loadingProposals
                      ? "Loading proposals..."
                      : hasOptions
                      ? "Select a finalized proposal"
                      : "No eligible finalized proposals found"
                  }
                  className="w-full"
                  onChange={(v) => handleSelect(v)}
                  options={selectOptions}
                  optionFilterProp="label"
                  loading={loadingProposals}
                  disabled={loadingProposals || !hasOptions}
                  notFoundContent={loadingProposals ? <Spin size="small" /> : "No eligible finalized proposals"}
                />
              </Col>
              <Col xs={24} md={16}>
                <Space wrap>
                  <Button 
                    icon={<FilterOutlined />} 
                    onClick={() => setShowFilters(!showFilters)}
                    type={showFilters ? 'primary' : 'default'}
                  >
                    Filters
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleRefresh}
                    loading={refreshing}
                  >
                    Refresh
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={handleDownloadVisible}
                  >
                    Export Visible
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />} 
                    onClick={handleDownloadFull} 
                    loading={downloading}
                  >
                    Full Report
                  </Button>
                  <Tooltip title="Normalization cap for TTC progress bars (seconds)">
                    <Space>
                      <InfoCircleOutlined />
                      <span>TTC max:</span>
                      <InputNumber
                        min={60}
                        max={7200}
                        step={30}
                        value={ttcMax}
                        onChange={(v) => setTtcMax(Number(v || 0))}
                        style={{ width: 110 }}
                      />
                    </Space>
                  </Tooltip>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Filters */}
          {showFilters && renderFilters()}

          {/* KPI Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-sm">
                <Statistic
                  title="Total Evaluations"
                  value={kpis.count}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-sm">
                <Statistic
                  title="Avg Performance"
                  value={kpis.avgPerformance ?? "N/A"}
                  precision={1}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="/100"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-sm">
                <Statistic
                  title="Avg TTC"
                  value={kpis.avgTtc ?? "N/A"}
                  precision={kpis.avgTtc ? 1 : 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                  suffix="sec"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-sm">
                <Statistic
                  title="Improving"
                  value={kpis.improving}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {kpis.stable} stable, {kpis.declining} declining
                </Text>
              </Card>
            </Col>
          </Row>

          {/* Selected negotiation metrics */}
          {error && !metrics ? (
            <Alert message="Error" description={error} type="error" showIcon className="mb-6" />
          ) : (
            renderSelectedMetrics()
          )}
        </div>
      ),
    },
    {
      key: 'analytics',
      label: 'Analytics',
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Performance Distribution" className="shadow-sm">
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Performance distribution chart would go here</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Trend Analysis" className="shadow-sm">
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Trend analysis chart would go here</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'details',
      label: 'All Evaluations',
      children: (
        <Card className="shadow-sm">
          <Row justify="space-between" align="middle" className="mb-4">
            <Col>
              <Title level={4}>
                All Evaluations 
                <Badge count={filteredEvaluations.length} style={{ marginLeft: 8 }} />
              </Title>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">
                  Showing {filteredEvaluations.length} of {allEvaluations.length}
                </Text>
                {filteredEvaluations.length !== allEvaluations.length && (
                  <Button size="small" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
          
          {loadingAllEvals ? (
            <div className="text-center py-12">
              <Spin size="large" />
              <Paragraph className="mt-4">Loading evaluations...</Paragraph>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <Empty 
              description="No evaluation records found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              rowKey={(r) => r.negotiationId}
              dataSource={filteredEvaluations}
              columns={columns as any}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} evaluations`
              }}
              scroll={{ x: "max-content" }}
              size="small"
            />
          )}
        </Card>
      ),
    },
    {
      key: 'methodology',
      label: 'Methodology',
      children: formulas,
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <BarChartOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          Evaluation Reports
        </Title>
        <Paragraph type="secondary" style={{ marginTop: '8px', fontSize: '16px' }}>
          Comprehensive analysis of negotiation performance and effectiveness metrics
        </Paragraph>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        tabBarStyle={{ 
          background: 'white', 
          padding: '0 16px', 
          marginBottom: '24px',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />

      {/* Details Drawer */}
      {renderDetailsDrawer()}
    </div>
  );
};

export default EvaluationReportPage;
