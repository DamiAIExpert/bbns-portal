// src/services/proposalService.ts
import api from './api';

// --- TYPE DEFINITIONS (Expanded to match the API response) ---

// Represents the user who submitted the proposal
interface Submitter {
    _id: string;
    name: string;
    email: string;
}

// Represents a single stakeholder associated with a proposal
interface Stakeholder {
    role: string;
    _id: string;
    weight: number;
}

// Represents a single event in the negotiation timeline
interface NegotiationHistoryEvent {
    action: string;
    performedBy: string; // This would be a User ID
    details: string;
    _id: string;
    timestamp: string;
}

// This defines the full shape of a single proposal object from the API
export interface Proposal {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_negotiation' | 'finalized' | 'rejected';
  createdAt: string;
  updatedAt: string;
  submittedBy: Submitter;
  stakeholders: Stakeholder[];
  negotiationHistory: NegotiationHistoryEvent[];
  negotiationId?: string; // Retained for evaluation logic
  blockchainStored: boolean;
  blockchainTxHash?: string;
  blockchainBlockNumber?: number;
}

// API response for fetching a single proposal
interface GetProposalResponse {
  proposal: Proposal;
}

// API response for fetching multiple proposals
interface GetProposalsResponse {
  success: boolean;
  proposals: Proposal[];
}


// --- API FUNCTIONS ---

export const getMyProposals = async (): Promise<Proposal[]> => {
    try {
        const response = await api.get<GetProposalsResponse>('/proposals/my-proposals');
        return response.data.proposals || [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch your requirements.');
    }
};

export const getProposalById = async (proposalId: string): Promise<Proposal> => {
    try {
        const response = await api.get<GetProposalResponse>(`/proposals/${proposalId}`);
        return response.data.proposal;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch the requirement details.');
    }
};
