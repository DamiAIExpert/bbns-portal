// src/services/preferenceService.ts
import api from './api';

// --- TYPE DEFINITIONS ---

export interface Preference {
  _id: string;
  proposal: string;
  stakeholder: string | { _id: string; name: string; email: string; role: string };
  priorities: Record<string, number>; // Normalized weights (0-1)
  rationale?: string;
  method?: string;
  confidence?: number;
  originalProposalText?: string;
  aiSummary?: string;
  elicitationContext?: {
    analysisMethod?: string;
    extractedKeywords?: string[];
    sentimentScore?: number;
    complexityScore?: number;
    stakeholderRole?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceSubmission {
  priorities: Record<string, number>;
  rationale?: string;
  pushOnChain?: boolean;
}

export interface PreferenceElicitationMethod {
  name: string;
  description: string;
  type: 'pairwise' | 'ranking' | 'rating' | 'choice';
  criteria: string[];
}

// --- SERVICE FUNCTIONS ---

/**
 * Submit preferences for a specific proposal
 */
export const submitPreferences = async (
  proposalId: string, 
  preferences: PreferenceSubmission
): Promise<Preference> => {
  try {
    const response = await api.post(`/proposals/${proposalId}/preferences`, preferences);
    return response.data;
  } catch (error: any) {
    console.error('Error submitting preferences:', error);
    throw new Error(error.response?.data?.message || 'Failed to submit preferences');
  }
};

/**
 * Get preferences for a specific proposal
 */
export const getProposalPreferences = async (proposalId: string): Promise<Preference[]> => {
  try {
    const response = await api.get(`/proposals/${proposalId}/preferences`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching proposal preferences:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch preferences');
  }
};

/**
 * Get user's preferences for a specific proposal
 */
export const getUserPreferences = async (proposalId: string): Promise<Preference | null> => {
  try {
    const response = await api.get(`/proposals/${proposalId}/preferences/user`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No preferences submitted yet
    }
    console.error('Error fetching user preferences:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch user preferences');
  }
};

/**
 * Update existing preferences
 */
export const updatePreferences = async (
  proposalId: string, 
  preferences: PreferenceSubmission
): Promise<Preference> => {
  try {
    const response = await api.put(`/proposals/${proposalId}/preferences`, preferences);
    return response.data;
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    throw new Error(error.response?.data?.message || 'Failed to update preferences');
  }
};

/**
 * Get all preferences for a specific proposal (admin endpoint)
 */
export const getAdminProposalPreferences = async (proposalId: string): Promise<Preference[]> => {
  try {
    const response = await api.get(`/admin/proposals/${proposalId}/preferences`);
    return response.data.preferences;
  } catch (error: any) {
    console.error('Error fetching proposal preferences:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch proposal preferences');
  }
};

/**
 * Get proposal submitter preferences (actual stakeholder who submitted the proposal)
 */
export const getProposalSubmitterPreferences = async (proposalId: string): Promise<{
  proposal: {
    _id: string;
    title: string;
    description: string;
    summary: string;
    submittedBy: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
  };
  preferences: Preference[];
}> => {
  try {
    const response = await api.get(`/admin/proposals/${proposalId}/submitter-preferences`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching submitter preferences:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch submitter preferences');
  }
};

/**
 * Get available preference elicitation methods
 */
export const getElicitationMethods = (): PreferenceElicitationMethod[] => {
  return [
    {
      name: 'Pairwise Comparison',
      description: 'Compare criteria in pairs to determine relative importance',
      type: 'pairwise',
      criteria: ['cost', 'timeline', 'quality', 'usability', 'security']
    },
    {
      name: 'Direct Rating',
      description: 'Rate each criterion on a scale from 1-10',
      type: 'rating',
      criteria: ['cost', 'timeline', 'quality', 'usability', 'security']
    },
    {
      name: 'Ranking',
      description: 'Rank criteria from most to least important',
      type: 'ranking',
      criteria: ['cost', 'timeline', 'quality', 'usability', 'security']
    },
    {
      name: 'Choice Experiment',
      description: 'Choose between different proposal scenarios',
      type: 'choice',
      criteria: ['cost', 'timeline', 'quality', 'usability', 'security']
    }
  ];
};

/**
 * Normalize preferences to sum to 1
 */
export const normalizePreferences = (preferences: Record<string, number>): Record<string, number> => {
  const sum = Object.values(preferences).reduce((acc, val) => acc + val, 0);
  if (sum === 0) return preferences;
  
  const normalized: Record<string, number> = {};
  Object.keys(preferences).forEach(key => {
    normalized[key] = preferences[key] / sum;
  });
  
  return normalized;
};

/**
 * Validate preferences
 */
export const validatePreferences = (preferences: Record<string, number>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if all values are non-negative
  Object.entries(preferences).forEach(([key, value]) => {
    if (value < 0) {
      errors.push(`${key} must be non-negative`);
    }
  });
  
  // Check if at least one value is positive
  const hasPositiveValue = Object.values(preferences).some(value => value > 0);
  if (!hasPositiveValue) {
    errors.push('At least one criterion must have a positive value');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Extract preferences from proposal content using NLP
 */
export const extractPreferencesFromProposal = async (
  proposalId: string,
  options: {
    userRole?: string;
    forceRegenerate?: boolean;
  } = {}
): Promise<{
  preferences: Preference;
  extraction: {
    confidence: number;
    method: string;
    analysis?: any;
  };
  extracted: boolean;
}> => {
  try {
    const response = await api.post(`/preferences/extract/${proposalId}`, options);
    return response.data;
  } catch (error: any) {
    console.error('Error extracting preferences:', error);
    throw new Error(error.response?.data?.message || 'Failed to extract preferences');
  }
};

/**
 * Extract preferences from multiple proposals using NLP
 */
export const extractPreferencesBatch = async (
  proposalIds: string[],
  options: {
    userRole?: string;
    forceRegenerate?: boolean;
  } = {}
): Promise<{
  results: Array<{
    proposalId: string;
    preferences: Preference;
    extraction?: {
      confidence: number;
      method: string;
    };
    extracted: boolean;
  }>;
  errors: Array<{
    proposalId: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> => {
  try {
    const response = await api.post('/preferences/extract-batch', {
      proposalIds,
      ...options
    });
    return response.data;
  } catch (error: any) {
    console.error('Error in batch preference extraction:', error);
    throw new Error(error.response?.data?.message || 'Failed to extract preferences in batch');
  }
};

/**
 * Analyze a proposal for preference extraction without saving
 */
export const analyzeProposalForPreferences = async (
  proposalId: string,
  userRole: string = 'student'
): Promise<{
  proposalId: string;
  proposalTitle: string;
  analysis: any;
  extractedPreferences: Record<string, number>;
  rationale: string;
  confidence: number;
  method: string;
}> => {
  try {
    const response = await api.get(`/preferences/analyze/${proposalId}?userRole=${userRole}`);
    return response.data;
  } catch (error: any) {
    console.error('Error analyzing proposal for preferences:', error);
    throw new Error(error.response?.data?.message || 'Failed to analyze proposal');
  }
};

/**
 * Get preference extraction statistics
 */
export const getExtractionStats = async (): Promise<{
  totalPreferences: number;
  extractionMethods: Record<string, number>;
  averageConfidence: number;
  criteriaDistribution: Record<string, number>;
  recentExtractions: Array<{
    proposalId: string;
    proposalTitle: string;
    createdAt: string;
    method: string;
  }>;
}> => {
  try {
    const response = await api.get('/preferences/extraction-stats');
    return response.data;
  } catch (error: any) {
    console.error('Error getting extraction stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to get extraction statistics');
  }
};

/**
 * Generate default preferences based on user role
 */
export const generateDefaultPreferences = (role: string): Record<string, number> => {
  const rolePreferences: Record<string, Record<string, number>> = {
    student: {
      usability: 0.4,
      quality: 0.3,
      timeline: 0.2,
      cost: 0.1
    },
    faculty: {
      quality: 0.4,
      usability: 0.3,
      timeline: 0.2,
      cost: 0.1
    },
    it_staff: {
      security: 0.4,
      quality: 0.3,
      cost: 0.2,
      timeline: 0.1
    },
    admin: {
      cost: 0.3,
      quality: 0.3,
      timeline: 0.2,
      security: 0.2
    }
  };
  
  return rolePreferences[role] || rolePreferences.student;
};
