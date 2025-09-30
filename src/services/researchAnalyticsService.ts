// src/services/researchAnalyticsService.ts
import api from './api';

export interface StakeholderCompositionAnalysis {
  researchQuestion: string;
  analysis: {
    totalStakeholders: number;
    roleDistribution: {
      [role: string]: number;
    };
    optimalComposition: {
      students: number;
      faculty: number;
      itStaff: number;
    };
    compositionRatios: {
      studentToFaculty: string;
      studentToIT: string;
      facultyToIT: string;
    };
    effectivenessMetrics: {
      participationRate: number;
      consensusTime: number;
      satisfactionScore: number;
      conflictResolutionRate: number;
    };
  };
  insights: string[];
  recommendations: string[];
}

export interface MethodComparisonAnalysis {
  researchQuestion: string;
  analysis: {
    ourMethod: {
      name: string;
      ttc: number;
      satisfaction: number;
      successRate: number;
      fairnessIndex: number;
      utilityGain: number;
      consensusLevel: number;
    };
    benchmarks: Array<{
      name: string;
      ttc: number;
      satisfaction: number;
      successRate: number;
      fairnessIndex: number;
      utilityGain: number;
      consensusLevel: number;
    }>;
    statisticalSignificance: {
      ttcSignificance: number;
      satisfactionSignificance: number;
      fairnessSignificance: number;
      overallSignificance: string;
    };
  };
  insights: string[];
  statisticalAnalysis: {
    ttest: string;
    effectSize: string;
    confidenceInterval: string;
  };
}

export interface SuccessFactorsAnalysis {
  researchQuestion: string;
  analysis: {
    systemFactors: {
      conflictDetection: {
        enabled: boolean;
        impact: string;
        contribution: string;
      };
      blockchainTransparency: {
        enabled: boolean;
        impact: string;
        contribution: string;
      };
      realTimeTracking: {
        enabled: boolean;
        impact: string;
        contribution: string;
      };
    };
    processFactors: {
      roundRobinFairness: {
        impact: string;
        contribution: string;
      };
      swingWeighting: {
        impact: string;
        contribution: string;
      };
      nashBargaining: {
        impact: string;
        contribution: string;
      };
    };
    stakeholderFactors: {
      participationRate: number;
      engagementLevel: string;
      satisfactionScore: number;
      expectationAlignment: number;
    };
  };
  insights: string[];
  recommendations: string[];
}

export interface StakeholderBehaviorAnalysis {
  researchQuestion: string;
  analysis: {
    [role: string]: {
      count: number;
      participationPattern: string;
      negotiationStyle: string;
      satisfactionScore: number;
      keyContributions: string[];
    };
  };
  insights: string[];
  behavioralPatterns: {
    powerDynamics: string;
    decisionMaking: string;
    conflictResolution: string;
    satisfaction: string;
  };
}

export interface BlockchainImpactAnalysis {
  researchQuestion: string;
  analysis: {
    trustMetrics: {
      stakeholderConfidence: number;
      transparencyRating: number;
      auditTrailCompleteness: number;
      verificationSuccess: number;
    };
    performanceImpact: {
      negotiationEfficiency: string;
      consensusTime: string;
      stakeholderEngagement: string;
      conflictResolution: string;
    };
    scalabilityAnalysis: {
      currentCapacity: string;
      blockchainOverhead: string;
      storageRequirements: string;
      costAnalysis: string;
    };
    securityBenefits: {
      tamperProof: string;
      auditability: string;
      transparency: string;
      integrity: string;
    };
  };
  insights: string[];
  recommendations: string[];
}

export interface PredictiveMetricsAnalysis {
  researchQuestion: string;
  analysis: {
    earlyIndicators: {
      [metric: string]: {
        threshold: number;
        predictiveValue: string;
        correlation: number;
      };
    };
    midNegotiationIndicators: {
      [metric: string]: {
        threshold: number;
        predictiveValue: string;
        correlation: number;
      };
    };
    finalIndicators: {
      [metric: string]: {
        threshold: number;
        predictiveValue: string;
        correlation: number;
      };
    };
    modelAccuracy: {
      overallAccuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    };
  };
  insights: string[];
  recommendations: string[];
}

export interface ConflictResolutionAnalysis {
  researchQuestion: string;
  analysis: {
    conflictTypes: {
      [type: string]: {
        count: number;
        percentage: number;
        resolutionTime: number;
        resolutionRate: number;
        severity: string;
      };
    };
    resolutionMethods: {
      [method: string]: {
        count: number;
        successRate: number;
        timeToResolution: number;
        stakeholderSatisfaction: number;
      };
    };
    resolutionEffectiveness: {
      overallSuccessRate: number;
      averageResolutionTime: number;
      stakeholderSatisfaction: number;
      consensusMaintenance: number;
    };
    patterns: {
      earlyDetection: string;
      resolutionSpeed: string;
      stakeholderImpact: string;
      consensusPreservation: string;
    };
  };
  insights: string[];
  recommendations: string[];
}

export interface LongitudinalAnalysis {
  researchQuestion: string;
  analysis: {
    temporalPatterns: {
      negotiationEvolution: {
        [phase: string]: string;
      };
      stakeholderBehavior: {
        [phase: string]: string;
      };
    };
    relationshipDevelopment: {
      stakeholderCooperation: string;
      trustBuilding: string;
      communicationPatterns: string;
      consensusEvolution: string;
    };
    longTermImpacts: {
      stakeholderSatisfaction: string;
      relationshipQuality: string;
      systemAdoption: string;
      outcomeQuality: string;
    };
  };
  insights: string[];
  recommendations: string[];
}

export interface ComprehensiveResearchDashboard {
  researchOverview: {
    totalResearchQuestions: number;
    dataPoints: number;
    benchmarkVariants: number;
    statisticalSignificance: number;
    researchGrade: string;
  };
  keyFindings: string[];
  researchImpact: {
    theoreticalContributions: string[];
    practicalApplications: string[];
    methodologicalInnovations: string[];
  };
}

// API functions to fetch research analytics
export const fetchStakeholderCompositionAnalysis = async (): Promise<StakeholderCompositionAnalysis> => {
  try {
    // Mock data since backend endpoints don't exist
    const mockData: StakeholderCompositionAnalysis = {
      researchQuestion: "What is the optimal stakeholder composition for effective blockchain-based negotiations?",
      analysis: {
        totalStakeholders: 45,
        roleDistribution: {
          'students': 25,
          'faculty': 15,
          'itStaff': 5
        },
        optimalComposition: {
          students: 20,
          faculty: 18,
          itStaff: 7
        },
        compositionRatios: {
          studentToFaculty: "1.1:1",
          studentToIT: "3.6:1",
          facultyToIT: "2.6:1"
        },
        effectivenessMetrics: {
          participationRate: 0.89,
          consensusTime: 2.3,
          satisfactionScore: 0.87,
          conflictResolutionRate: 0.92
        }
      },
      insights: [
        "Student participation is crucial for diverse perspectives",
        "Faculty members provide domain expertise and guidance",
        "IT staff ensure technical feasibility and implementation",
        "Balanced composition leads to better consensus outcomes"
      ],
      recommendations: [
        "Maintain 1:1 student-faculty ratio for optimal engagement",
        "Include at least 2-3 IT staff members for technical oversight",
        "Ensure diverse representation across different academic levels",
        "Regular rotation of stakeholder roles to prevent bias"
      ]
    };
    
    return mockData;
  } catch (error) {
    console.error('Error fetching stakeholder composition analysis:', error);
    throw error;
  }
};

export const fetchMethodComparisonAnalysis = async (): Promise<MethodComparisonAnalysis> => {
  try {
    // Mock data since backend endpoints don't exist
    const mockData: MethodComparisonAnalysis = {
      researchQuestion: "How does our blockchain-based negotiation method compare to traditional approaches?",
      analysis: {
        ourMethod: {
          name: "Blockchain-Based Negotiation System",
          ttc: 2.3,
          satisfaction: 0.87,
          successRate: 0.89,
          fairnessIndex: 0.91,
          utilityGain: 0.24,
          consensusLevel: 0.88
        },
        benchmarks: [
          {
            name: "Traditional Voting",
            ttc: 4.2,
            satisfaction: 0.72,
            successRate: 0.65,
            fairnessIndex: 0.78,
            utilityGain: 0.15,
            consensusLevel: 0.71
          },
          {
            name: "Consensus Building",
            ttc: 5.8,
            satisfaction: 0.81,
            successRate: 0.78,
            fairnessIndex: 0.85,
            utilityGain: 0.19,
            consensusLevel: 0.83
          },
          {
            name: "Multi-Criteria Decision",
            ttc: 3.9,
            satisfaction: 0.79,
            successRate: 0.82,
            fairnessIndex: 0.87,
            utilityGain: 0.21,
            consensusLevel: 0.85
          }
        ],
        statisticalSignificance: {
          ttcSignificance: 0.95,
          satisfactionSignificance: 0.88,
          fairnessSignificance: 0.92,
          overallSignificance: "High"
        }
      },
      insights: [
        "Our blockchain method achieves 45% faster consensus than traditional voting",
        "Higher satisfaction scores indicate better stakeholder engagement",
        "Improved fairness index demonstrates more equitable outcomes",
        "Blockchain transparency increases trust and participation"
      ],
      statisticalAnalysis: {
        ttest: "p < 0.001 (highly significant)",
        effectSize: "Cohen's d = 0.85 (large effect)",
        confidenceInterval: "95% CI [0.12, 0.36]"
      }
    };
    
    return mockData;
  } catch (error) {
    console.error('Error fetching method comparison analysis:', error);
    throw error;
  }
};

export const fetchSuccessFactorsAnalysis = async (): Promise<SuccessFactorsAnalysis> => {
  try {
    // Try public endpoint first, fallback to authenticated endpoint
    try {
      const response = await api.get('/public/research/success-factors');
      return response.data;
    } catch (publicError) {
      console.log('Public endpoint failed, trying authenticated endpoint:', publicError);
      const response = await api.get('/research/success-factors');
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching success factors analysis:', error);
    throw error;
  }
};

export const fetchStakeholderBehaviorAnalysis = async (): Promise<StakeholderBehaviorAnalysis> => {
  try {
    // Try public endpoint first, fallback to authenticated endpoint
    try {
      const response = await api.get('/public/research/stakeholder-behavior');
      return response.data;
    } catch (publicError) {
      console.log('Public endpoint failed, trying authenticated endpoint:', publicError);
      const response = await api.get('/research/stakeholder-behavior');
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching stakeholder behavior analysis:', error);
    throw error;
  }
};

export const fetchBlockchainImpactAnalysis = async (): Promise<BlockchainImpactAnalysis> => {
  try {
    // Try public endpoint first, fallback to authenticated endpoint
    try {
      const response = await api.get('/public/research/blockchain-impact');
      return response.data;
    } catch (publicError) {
      console.log('Public endpoint failed, trying authenticated endpoint:', publicError);
      const response = await api.get('/research/blockchain-impact');
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching blockchain impact analysis:', error);
    throw error;
  }
};

export const fetchPredictiveMetricsAnalysis = async (): Promise<PredictiveMetricsAnalysis> => {
  try {
    // Try public endpoint first, fallback to authenticated endpoint
    try {
      const response = await api.get('/public/research/predictive-metrics');
      return response.data;
    } catch (publicError) {
      console.log('Public endpoint failed, trying authenticated endpoint:', publicError);
      const response = await api.get('/research/predictive-metrics');
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching predictive metrics analysis:', error);
    throw error;
  }
};

export const fetchConflictResolutionAnalysis = async (): Promise<ConflictResolutionAnalysis> => {
  try {
    // Try public endpoint first, fallback to authenticated endpoint
    try {
      const response = await api.get('/public/research/conflict-resolution');
      return response.data;
    } catch (publicError) {
      console.log('Public endpoint failed, trying authenticated endpoint:', publicError);
      const response = await api.get('/research/conflict-resolution');
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching conflict resolution analysis:', error);
    throw error;
  }
};

export const fetchLongitudinalAnalysis = async (): Promise<LongitudinalAnalysis> => {
  try {
    // Try public endpoint first, fallback to authenticated endpoint
    try {
      const response = await api.get('/public/research/longitudinal');
      return response.data;
    } catch (publicError) {
      console.log('Public endpoint failed, trying authenticated endpoint:', publicError);
      const response = await api.get('/research/longitudinal');
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching longitudinal analysis:', error);
    throw error;
  }
};

export const fetchComprehensiveResearchDashboard = async (): Promise<ComprehensiveResearchDashboard> => {
  try {
    // Try public endpoint first, fallback to authenticated endpoint
    try {
      const response = await api.get('/public/research/dashboard');
      return response.data;
    } catch (publicError) {
      console.log('Public endpoint failed, trying authenticated endpoint:', publicError);
      const response = await api.get('/research/dashboard');
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching comprehensive research dashboard:', error);
    throw error;
  }
};

// Utility functions for data analysis
export const calculateCorrelationStrength = (correlation: number): string => {
  const abs = Math.abs(correlation);
  if (abs >= 0.9) return 'Very Strong';
  if (abs >= 0.7) return 'Strong';
  if (abs >= 0.5) return 'Moderate';
  if (abs >= 0.3) return 'Weak';
  return 'Very Weak';
};

export const formatStatisticalSignificance = (pValue: number): string => {
  if (pValue < 0.001) return 'p < 0.001 (Highly Significant)';
  if (pValue < 0.01) return 'p < 0.01 (Very Significant)';
  if (pValue < 0.05) return 'p < 0.05 (Significant)';
  if (pValue < 0.1) return 'p < 0.1 (Marginally Significant)';
  return 'p > 0.1 (Not Significant)';
};

export const getPerformanceColor = (value: number, thresholds: { good: number; excellent: number }): string => {
  if (value >= thresholds.excellent) return '#52c41a'; // green
  if (value >= thresholds.good) return '#faad14'; // orange
  return '#ff4d4f'; // red
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};
