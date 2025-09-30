// src/services/negotiationService.ts
import api from './api';

// --- TYPE DEFINITIONS ---

export interface NegotiationDecision {
  _id: string;
  stakeholder: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  decision: 'accept' | 'reject';
  timestamp: string;
  rationale?: string;
  round: number;
}

export interface NegotiationRound {
  round: number;
  timestamp: string;
  decisions: NegotiationDecision[];
  status: 'pending' | 'completed' | 'timeout';
  consensusReached: boolean;
  consensusLevel: number;
}

export interface NegotiationDetails {
  _id: string;
  proposalId: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  status: 'pending' | 'in_progress' | 'finalized' | 'completed' | 'success' | 'partial' | 'impasse' | 'withdrawn' | 'canceled';
  maxRounds: number;
  currentRound: number;
  startedAt: string;
  finalizedAt?: string;
  rounds: NegotiationRound[];
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

export interface NegotiationHistoryResponse {
  proposalId: string;
  history: NegotiationDecision[];
}

// --- SERVICE FUNCTIONS ---

/**
 * Get detailed negotiation information for a proposal
 */
export const getNegotiationDetails = async (proposalId: string): Promise<NegotiationDetails> => {
  try {
    const response = await api.get(`/negotiation/details/${proposalId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching negotiation details:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch negotiation details');
  }
};

/**
 * Get negotiation history for a proposal
 */
export const getNegotiationHistory = async (proposalId: string): Promise<NegotiationHistoryResponse> => {
  try {
    const response = await api.get(`/negotiation/history/${proposalId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching negotiation history:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch negotiation history');
  }
};

/**
 * Get negotiation status for a proposal
 */
export const getNegotiationStatus = async (proposalId: string): Promise<{
  status: string;
  hasNegotiation: boolean;
  negotiationId?: string;
}> => {
  try {
    const response = await api.get(`/negotiation/status/${proposalId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching negotiation status:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch negotiation status');
  }
};

/**
 * Get all negotiations for admin dashboard
 */
export const getAllNegotiations = async (): Promise<NegotiationDetails[]> => {
  try {
    const response = await api.get('/negotiation/all');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all negotiations:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch negotiations');
  }
};

/**
 * Get negotiation rounds with detailed information
 */
export const getNegotiationRounds = async (negotiationId: string): Promise<NegotiationRound[]> => {
  try {
    const response = await api.get(`/negotiation/${negotiationId}/rounds`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching negotiation rounds:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch negotiation rounds');
  }
};

/**
 * Get stakeholder participation in negotiation
 */
export const getStakeholderParticipation = async (proposalId: string): Promise<{
  totalStakeholders: number;
  participatingStakeholders: number;
  participationRate: number;
  stakeholderDecisions: Array<{
    stakeholder: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    totalDecisions: number;
    acceptDecisions: number;
    rejectDecisions: number;
    participationRate: number;
    lastDecision: string;
  }>;
}> => {
  try {
    const response = await api.get(`/negotiation/participation/${proposalId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching stakeholder participation:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch stakeholder participation');
  }
};

/**
 * Get negotiation consensus metrics
 */
export const getConsensusMetrics = async (proposalId: string): Promise<{
  consensusLevel: number;
  consensusReached: boolean;
  agreementThreshold: number;
  stakeholderAgreement: Array<{
    stakeholder: {
      _id: string;
      name: string;
      role: string;
    };
    agreementLevel: number;
    lastDecision: string;
    decisionCount: number;
  }>;
  consensusHistory: Array<{
    round: number;
    consensusLevel: number;
    timestamp: string;
  }>;
}> => {
  try {
    const response = await api.get(`/negotiation/consensus/${proposalId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching consensus metrics:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch consensus metrics');
  }
};
