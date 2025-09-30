// dashboardService.ts - Service for dashboard data using public endpoints
import api from './api';

export interface DashboardStats {
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
  roleDistribution: Record<string, { count: number; percentage: number }>;
  totalStakeholders: number;
  participationRate: number;
  agreementLevel: number;
  conflictResolution: number;
}

export interface ProposalMetrics {
  statusDistribution: Record<string, { count: number; percentage: number }>;
  processingEfficiency: number;
  successRate: number;
  totalProposals: number;
  finalizedProposals: number;
}

export interface NegotiationMetrics {
  statusDistribution: Record<string, { count: number; percentage: number }>;
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
  stakeholderConsensus: {
    totalStakeholders: number;
    consensusMetrics: {
      participationRate: number;
      agreementLevel: number;
      conflictResolution: number;
    };
  };
  negotiationMetrics: {
    totalNegotiations: number;
    totalRounds: number;
    totalConflictsResolved: number;
    consensusLevel: number;
    averageRoundsPerNegotiation: number;
    successRate: number;
    fairnessIndex: number;
    nashProduct: number;
  };
  requirements: {
    total: number;
    requirementsPerStakeholder: string;
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

// API functions using public endpoints
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getStakeholderMetrics = async (): Promise<StakeholderMetrics> => {
  try {
    // Using admin users endpoint as a fallback since public metrics don't exist
    const response = await api.get('/admin/users');
    const users = response.data.users || response.data || [];
    
    // Mock stakeholder metrics based on user data
    const stakeholderMetrics: StakeholderMetrics = {
      roleDistribution: {
        'stakeholder': { count: users.filter((u: any) => u.role === 'stakeholder').length, percentage: 0 },
        'admin': { count: users.filter((u: any) => u.role === 'admin').length, percentage: 0 },
        'system_admin': { count: users.filter((u: any) => u.role === 'system_admin').length, percentage: 0 }
      },
      totalStakeholders: users.length,
      participationRate: 0.85,
      agreementLevel: 0.78,
      conflictResolution: 0.92
    };
    
    // Calculate percentages
    Object.keys(stakeholderMetrics.roleDistribution).forEach(role => {
      const roleData = stakeholderMetrics.roleDistribution[role];
      roleData.percentage = stakeholderMetrics.totalStakeholders > 0 
        ? (roleData.count / stakeholderMetrics.totalStakeholders) * 100 
        : 0;
    });
    
    return stakeholderMetrics;
  } catch (error) {
    console.error('Error fetching stakeholder metrics:', error);
    throw error;
  }
};

export const getProposalMetrics = async (): Promise<ProposalMetrics> => {
  try {
    // Using admin proposals endpoint since public metrics don't exist
    const response = await api.get('/admin/proposals');
    const proposals = response.data.proposals || [];
    
    // Mock proposal metrics based on proposal data
    const proposalMetrics: ProposalMetrics = {
      statusDistribution: {
        'pending': { count: proposals.filter((p: any) => p.status === 'pending').length, percentage: 0 },
        'active': { count: proposals.filter((p: any) => p.status === 'active').length, percentage: 0 },
        'completed': { count: proposals.filter((p: any) => p.status === 'completed').length, percentage: 0 },
        'rejected': { count: proposals.filter((p: any) => p.status === 'rejected').length, percentage: 0 }
      },
      processingEfficiency: 0.87,
      successRate: 0.82,
      totalProposals: proposals.length,
      finalizedProposals: proposals.filter((p: any) => p.status === 'completed').length
    };
    
    // Calculate percentages
    Object.keys(proposalMetrics.statusDistribution).forEach(status => {
      const statusData = proposalMetrics.statusDistribution[status];
      statusData.percentage = proposalMetrics.totalProposals > 0 
        ? (statusData.count / proposalMetrics.totalProposals) * 100 
        : 0;
    });
    
    return proposalMetrics;
  } catch (error) {
    console.error('Error fetching proposal metrics:', error);
    throw error;
  }
};

export const getNegotiationMetrics = async (): Promise<NegotiationMetrics> => {
  try {
    // Mock negotiation metrics since public endpoint doesn't exist
    const negotiationMetrics: NegotiationMetrics = {
      statusDistribution: {
        'active': { count: 12, percentage: 40 },
        'completed': { count: 15, percentage: 50 },
        'failed': { count: 3, percentage: 10 }
      },
      successRate: 0.83,
      totalParticipants: 45,
      totalProposalsInNegotiations: 30,
      averageParticipantsPerNegotiation: 3.2,
      averageProposalsPerNegotiation: 2.1,
      totalRounds: 156,
      conflictsResolved: 23,
      consensusLevel: 0.87,
      fairnessIndex: 0.91,
      nashProduct: 0.78
    };
    
    return negotiationMetrics;
  } catch (error) {
    console.error('Error fetching negotiation metrics:', error);
    throw error;
  }
};

export const getFinalProposalMetrics = async (): Promise<FinalProposalMetrics | null> => {
  try {
    // Mock final proposal metrics since public endpoint doesn't exist
    const finalProposalMetrics: FinalProposalMetrics = {
      totalFinalProposals: 18,
      successRate: 0.85,
      averageProcessingTime: 2.3,
      stakeholderSatisfaction: 0.88,
      blockchainAnchored: 15,
      consensusLevel: 0.92,
      conflictResolution: 0.89,
      fairnessIndex: 0.91,
      nashProduct: 0.79,
      utilityGain: 0.24,
      timeToConsensus: 1.8,
      participantEngagement: 0.87,
      proposalQuality: 0.89,
      systemEfficiency: 0.86,
      transparencyLevel: 0.94,
      auditTrail: 0.96,
      verificationStatus: 0.98,
      immutableRecords: 0.97
    };
    
    return finalProposalMetrics;
  } catch (error) {
    console.error('Error fetching final proposal metrics:', error);
    return null;
  }
};

export const getResearchMetrics = async (): Promise<ResearchMetrics> => {
  try {
    // Mock research metrics since public endpoint doesn't exist
    const researchMetrics: ResearchMetrics = {
      totalStudies: 8,
      activeStudies: 3,
      completedStudies: 5,
      participantCount: 156,
      dataPoints: 2847,
      successRate: 0.89,
      averageStudyDuration: 4.2,
      publicationCount: 3,
      citationCount: 12,
      researchQuality: 0.91,
      methodologyScore: 0.88,
      dataIntegrity: 0.94,
      reproducibility: 0.86,
      innovationIndex: 0.82,
      impactScore: 0.79
    };
    
    return researchMetrics;
  } catch (error) {
    console.error('Error fetching research metrics:', error);
    throw error;
  }
};

export const getBlockchainMetrics = async (): Promise<BlockchainMetrics> => {
  try {
    // Mock blockchain metrics since public endpoint doesn't exist
    const blockchainMetrics: BlockchainMetrics = {
      totalTransactions: 1247,
      successfulTransactions: 1189,
      failedTransactions: 58,
      averageGasUsed: 125000,
      totalGasUsed: 155875000,
      blockHeight: 18472947,
      networkHashRate: 285.6,
      transactionFees: 0.0234,
      confirmationTime: 12.5,
      networkLatency: 45.2,
      nodeCount: 8,
      consensusAlgorithm: 'Proof of Stake',
      blockTime: 12.0,
      throughput: 15.2,
      scalability: 0.87,
      security: 0.94,
      decentralization: 0.82,
      energyEfficiency: 0.91
    };
    
    return blockchainMetrics;
  } catch (error) {
    console.error('Error fetching blockchain metrics:', error);
    throw error;
  }
};

// Comprehensive dashboard data
export const getComprehensiveDashboardData = async () => {
  try {
    const [
      dashboardStats,
      stakeholderMetrics,
      proposalMetrics,
      negotiationMetrics,
      finalProposalMetrics,
      researchMetrics,
      blockchainMetrics
    ] = await Promise.all([
      getDashboardStats(),
      getStakeholderMetrics(),
      getProposalMetrics(),
      getNegotiationMetrics(),
      getFinalProposalMetrics(),
      getResearchMetrics(),
      getBlockchainMetrics()
    ]);

    return {
      dashboardStats,
      stakeholderMetrics,
      proposalMetrics,
      negotiationMetrics,
      finalProposalMetrics,
      researchMetrics,
      blockchainMetrics
    };
  } catch (error) {
    console.error('Error fetching comprehensive dashboard data:', error);
    throw error;
  }
};
