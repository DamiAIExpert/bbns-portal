// src/services/metricsService.ts
import api from './api';

export interface SystemMetrics {
  totalUsers: number;
  totalStakeholders: number;
  totalSystemAdmins: number;
  totalProposals: number;
  totalNegotiations: number;
  totalFinalProposals: number;
  processingEfficiency: number;
  negotiationSuccessRate: number;
  systemEfficiency: {
    userEngagement: string;
    proposalProcessing: string;
    negotiationSuccess: string;
    finalProposalGeneration: string;
  };
}

export interface StakeholderMetrics {
  roleDistribution: {
    [role: string]: {
      count: number;
      percentage: number;
    };
  };
  totalStakeholders: number;
  participationRate: number;
  agreementLevel: number;
  conflictResolution: number;
}

export interface ProposalMetrics {
  statusDistribution: {
    [status: string]: {
      count: number;
      percentage: number;
    };
  };
  processingEfficiency: number;
  successRate: number;
  totalProposals: number;
  finalizedProposals: number;
}

export interface NegotiationMetrics {
  statusDistribution: {
    [status: string]: {
      count: number;
      percentage: number;
    };
  };
  successRate: number;
  totalParticipants: number;
  totalProposalsInNegotiations: number;
  averageParticipantsPerNegotiation: number;
  averageProposalsPerNegotiation: number;
  totalRounds: number;
  conflictsResolved: number;
  consensusLevel: number;
  fairnessIndex: number;
  nashProduct: number;
}

export interface FinalProposalMetrics {
  finalProposalId: string;
  topicKey: string;
  createdAt: string;
  participants: number;
  sourceProposals: number;
  stakeholderConsensus: StakeholderMetrics;
  negotiationMetrics: NegotiationMetrics;
  requirements: {
    total: number;
    requirementsPerStakeholder: number;
  };
  implementationTimeline: {
    phase1: string;
    phase2: string;
    phase3: string;
  };
  qualityStandards: {
    codeCoverage: string;
    performance: string;
    security: string;
    accessibility: string;
  };
  acceptanceCriteria: string[];
  riskMitigation: string[];
  blockchainVerification: {
    recorded: boolean;
    hash: string;
    timestamp: string;
    status: string;
  };
}

export interface ResearchMetrics {
  evaluationDataPoints: number;
  benchmarkVariantsTested: number;
  statisticalSignificance: number;
  researchGrade: string;
  evaluationFramework: string;
}

export interface BlockchainMetrics {
  integration: string;
  immutableRecords: string;
  transparencyLevel: string;
  auditTrail: string;
  verificationStatus: string;
}

export interface ComprehensiveMetrics {
  systemMetrics: SystemMetrics;
  stakeholderMetrics: StakeholderMetrics;
  proposalMetrics: ProposalMetrics;
  negotiationMetrics: NegotiationMetrics;
  finalProposalMetrics?: FinalProposalMetrics;
  researchMetrics: ResearchMetrics;
  blockchainMetrics: BlockchainMetrics;
}

// API functions to fetch metrics from backend
export const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    // Try public endpoint first (for development), fallback to admin endpoint
    const response = await api.get('/public/metrics/system');
    return response.data;
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    throw error;
  }
};

export const fetchStakeholderMetrics = async (): Promise<StakeholderMetrics> => {
  try {
    const response = await api.get('/public/metrics/stakeholders');
    return response.data;
  } catch (error) {
    console.error('Error fetching stakeholder metrics:', error);
    throw error;
  }
};

export const fetchProposalMetrics = async (): Promise<ProposalMetrics> => {
  try {
    const response = await api.get('/public/metrics/proposals');
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal metrics:', error);
    throw error;
  }
};

export const fetchNegotiationMetrics = async (): Promise<NegotiationMetrics> => {
  try {
    const response = await api.get('/public/metrics/negotiations');
    return response.data;
  } catch (error) {
    console.error('Error fetching negotiation metrics:', error);
    throw error;
  }
};

export const fetchFinalProposalMetrics = async (): Promise<FinalProposalMetrics | null> => {
  try {
    const response = await api.get('/public/metrics/final-proposals');
    return response.data;
  } catch (error) {
    console.error('Error fetching final proposal metrics:', error);
    return null;
  }
};

export const fetchResearchMetrics = async (): Promise<ResearchMetrics> => {
  try {
    const response = await api.get('/public/metrics/research');
    return response.data;
  } catch (error) {
    console.error('Error fetching research metrics:', error);
    throw error;
  }
};

export const fetchBlockchainMetrics = async (): Promise<BlockchainMetrics> => {
  try {
    const response = await api.get('/public/metrics/blockchain');
    return response.data;
  } catch (error) {
    console.error('Error fetching blockchain metrics:', error);
    throw error;
  }
};

export const fetchComprehensiveMetrics = async (): Promise<ComprehensiveMetrics> => {
  try {
    const [
      systemMetrics,
      stakeholderMetrics,
      proposalMetrics,
      negotiationMetrics,
      finalProposalMetrics,
      researchMetrics,
      blockchainMetrics
    ] = await Promise.all([
      fetchSystemMetrics(),
      fetchStakeholderMetrics(),
      fetchProposalMetrics(),
      fetchNegotiationMetrics(),
      fetchFinalProposalMetrics(),
      fetchResearchMetrics(),
      fetchBlockchainMetrics()
    ]);

    return {
      systemMetrics,
      stakeholderMetrics,
      proposalMetrics,
      negotiationMetrics,
      finalProposalMetrics: finalProposalMetrics || undefined,
      researchMetrics,
      blockchainMetrics
    };
  } catch (error) {
    console.error('Error fetching comprehensive metrics:', error);
    throw error;
  }
};

// Utility functions for data analysis
export const calculateTrend = (current: number, previous: number): 'improving' | 'stable' | 'declining' => {
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return 'improving';
  if (change < -5) return 'declining';
  return 'stable';
};

export const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const getPerformanceColor = (value: number, thresholds: { good: number; excellent: number }): string => {
  if (value >= thresholds.excellent) return '#52c41a'; // green
  if (value >= thresholds.good) return '#faad14'; // orange
  return '#ff4d4f'; // red
};
