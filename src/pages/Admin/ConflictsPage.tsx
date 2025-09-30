import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Tag, 
    Modal, 
    Row,
    Col,
    Statistic,
    Typography,
    Alert,
    Select,
    Input,
    Tabs,
    Badge,
    Collapse,
    Divider,
    Space,
    Tooltip,
    Progress,
    List,
    Form,
    message,
    Empty
} from 'antd';
import {
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    SearchOutlined,
    EyeOutlined,
    FileTextOutlined,
    PlayCircleOutlined,
    ReloadOutlined,
    SettingOutlined,
    BugOutlined
} from '@ant-design/icons';
import { Pie, Column } from '@ant-design/plots';
import { 
    getAllConflicts,
    getProposalsWithConflicts,
} from '../../services/adminService';
import { getComprehensiveDashboardData } from '../../services/dashboardService';
import type { Conflict } from '../../services/adminService';

// Enhanced conflict detection API calls
const runEnhancedConflictDetection = async (negotiationId: string, projectId: string) => {
    const response = await fetch(`/api/enhanced-conflict-detection/detect/${negotiationId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ projectId })
    });
    return response.json();
};

const extractRequirements = async (projectId: string, negotiationId: string) => {
    const response = await fetch(`/api/enhanced-conflict-detection/extract-requirements/${projectId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ negotiationId })
    });
    return response.json();
};

const getEnhancedConflicts = async (negotiationId: string, filters: any = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/enhanced-conflict-detection/conflicts/${negotiationId}?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
};

const getEnhancedConflictStatistics = async (negotiationId: string) => {
    const response = await fetch(`/api/enhanced-conflict-detection/conflict-statistics/${negotiationId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
};

const getRequirements = async (projectId: string, filters: any = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/enhanced-conflict-detection/requirements/${projectId}?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
};

const getRequirementsStatistics = async (projectId: string) => {
    const response = await fetch(`/api/enhanced-conflict-detection/requirements-statistics/${projectId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
};

// Enhanced conflict resolution function (for future use)
// const resolveEnhancedConflict = async (conflictId: string, method: string, summary: string) => {
//     const response = await fetch(`/api/enhanced-conflict-detection/resolve/${conflictId}`, {
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({ method, summary })
//     });
//     return response.json();
// };

interface EnhancedConflict extends Conflict {
    stakeholders?: any[];
    affectedRequirements?: any[];
    affectedStakeholders?: any[];
    rootCause?: any;
    mitigation?: any;
    analytics?: any;
    subcategory?: string;
    impact?: {
        project: number;
        timeline: number;
        budget: number;
        quality: number;
        stakeholder: number;
    };
}

interface Requirement {
    _id: string;
    reqId: string;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    moscowPriority: string;
    numericalPriority: number;
    status: string;
    riskLevel: string;
    sourceStakeholders: any[];
    acceptanceCriteria: any[];
    estimatedEffort: any;
    requiredResources: any[];
    validationMethod: string;
    testCases: any[];
    riskFactors: any[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
// TabPane is deprecated, using items prop instead
const { Panel } = Collapse;

interface ProposalWithConflicts {
    proposal: any;
    conflicts: Conflict[];
    stakeholders: any[];
    negotiation: any;
}

interface ConflictSummary {
    totalConflicts: number;
    resolvedConflicts: number;
    openConflicts: number;
    conflictsByType: Record<string, number>;
    conflictsByProposal: number;
}

interface ConflictDetectionStats {
    total: number;
    resolved: number;
    open: number;
    resolutionRate: number;
    byType: Array<{ _id: string; count: number }>;
    byDetector: Array<{ _id: string; count: number }>;
}

interface ConflictDetectionRequest {
    negotiationId?: string;
    topicKey?: string;
    detectAll?: boolean;
}

const ConflictsPage: React.FC = () => {
    const [conflicts, setConflicts] = useState<EnhancedConflict[]>([]);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [proposalsWithConflicts, setProposalsWithConflicts] = useState<{
        proposalsByRole: Record<string, ProposalWithConflicts[]>;
        conflictSummary: ConflictSummary;
        totalProposalsWithConflicts: number;
    } | null>(null);
    const [conflictStats, setConflictStats] = useState<ConflictDetectionStats | null>(null);
    const [requirementStats, setRequirementStats] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [detecting, setDetecting] = useState<boolean>(false);
    const [extracting, setExtracting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedConflict, setSelectedConflict] = useState<EnhancedConflict | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [resolveModalVisible, setResolveModalVisible] = useState<boolean>(false);
    const [detectionModalVisible, setDetectionModalVisible] = useState<boolean>(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [detectorFilter, setDetectorFilter] = useState<string>('all');
    const [searchText, setSearchText] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('conflicts');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedNegotiationId, setSelectedNegotiationId] = useState<string>('');
    const [dashboardData, setDashboardData] = useState<any>(null);
    
    const [resolveForm] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [conflictsData, proposalsData, statsData, dashboardData] = await Promise.all([
                getAllConflicts(),
                getProposalsWithConflicts(),
                fetchConflictStats(),
                getComprehensiveDashboardData()
            ]);
            
            setDashboardData(dashboardData);
            
            // Enhance conflicts data with stakeholder information
            const enhancedConflicts = conflictsData.map((conflict: any) => {
                // Try to populate stakeholder information from proposal
                if (conflict.proposalId && typeof conflict.proposalId === 'object') {
                    return {
                        ...conflict,
                        stakeholders: conflict.stakeholders || conflict.proposalId.stakeholders || conflict.proposalId.stakeholderUsers || []
                    };
                }
                return conflict;
            });
            
            setConflicts(enhancedConflicts);
            setProposalsWithConflicts(proposalsData);
            setConflictStats(statsData);
        } catch (err: any) {
            console.error("Failed to fetch conflicts data:", err);
            setError(err.message || 'Failed to fetch conflicts data');
        } finally {
            setLoading(false);
        }
    };

    const fetchEnhancedData = async (negotiationId: string, projectId: string) => {
        setLoading(true);
        setError(null);
        
        try {
            const [conflictsResponse, requirementsResponse, conflictStatsResponse, requirementStatsResponse] = await Promise.all([
                getEnhancedConflicts(negotiationId),
                getRequirements(projectId),
                getEnhancedConflictStatistics(negotiationId),
                getRequirementsStatistics(projectId)
            ]);

            if (conflictsResponse.success) {
                setConflicts(conflictsResponse.data);
            }

            if (requirementsResponse.success) {
                setRequirements(requirementsResponse.data);
            }

            if (conflictStatsResponse.success) {
                setConflictStats(conflictStatsResponse.data);
            }

            if (requirementStatsResponse.success) {
                setRequirementStats(requirementStatsResponse.data);
            }
        } catch (err) {
            console.error('Error fetching enhanced data:', err);
            setError('Failed to fetch enhanced conflicts data');
        } finally {
            setLoading(false);
        }
    };

    const handleRunEnhancedDetection = async () => {
        if (!selectedNegotiationId || !selectedProjectId) {
            message.error('Please select both negotiation and project');
            return;
        }

        setDetecting(true);
        try {
            const response = await runEnhancedConflictDetection(selectedNegotiationId, selectedProjectId);
            if (response.success) {
                message.success(`Enhanced conflict detection completed. Found ${response.data.conflicts.length} conflicts`);
                await fetchEnhancedData(selectedNegotiationId, selectedProjectId);
            } else {
                message.error(response.message || 'Failed to run enhanced conflict detection');
            }
        } catch (error) {
            console.error('Error running enhanced conflict detection:', error);
            message.error('Failed to run enhanced conflict detection');
        } finally {
            setDetecting(false);
            setDetectionModalVisible(false);
        }
    };

    const handleExtractRequirements = async () => {
        if (!selectedProjectId || !selectedNegotiationId) {
            message.error('Please select both project and negotiation');
            return;
        }

        setExtracting(true);
        try {
            const response = await extractRequirements(selectedProjectId, selectedNegotiationId);
            if (response.success) {
                message.success(`Requirements extraction completed. Found ${response.data.requirements.length} requirements`);
                await fetchEnhancedData(selectedNegotiationId, selectedProjectId);
            } else {
                message.error(response.message || 'Failed to extract requirements');
            }
        } catch (error) {
            console.error('Error extracting requirements:', error);
            message.error('Failed to extract requirements');
        } finally {
            setExtracting(false);
        }
    };

    const fetchConflictStats = async (): Promise<ConflictDetectionStats | null> => {
        try {
            const response = await fetch('/api/conflict-detection/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch conflict stats:', error);
            return null;
        }
    };

    const runConflictDetection = async (request: ConflictDetectionRequest) => {
        try {
            setDetecting(true);
            setError(null);
            
            let endpoint = '/api/conflict-detection/detect-all-pending';
            let method = 'POST';
            
            if (request.negotiationId) {
                endpoint = `/api/conflict-detection/detect/${request.negotiationId}`;
            } else if (request.topicKey) {
                endpoint = `/api/conflict-detection/detect-topic/${request.topicKey}`;
            }
            
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                message.success(`Detected ${result.data.length} conflicts successfully`);
                await fetchData(); // Refresh data
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to detect conflicts');
            }
        } catch (err: any) {
            console.error("Failed to run conflict detection:", err);
            setError(err.message || 'Failed to run conflict detection');
            message.error(err.message || 'Failed to run conflict detection');
        } finally {
            setDetecting(false);
        }
    };

    const resolveConflict = async (conflictId: string, resolutionMethod: string, resolutionSummary: string) => {
        try {
            const response = await fetch(`/api/conflict-detection/resolve/${conflictId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resolutionMethod,
                    resolutionSummary
                })
            });
            
            if (response.ok) {
                message.success('Conflict resolved successfully');
                setResolveModalVisible(false);
                resolveForm.resetFields();
                await fetchData(); // Refresh data
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to resolve conflict');
            }
        } catch (err: any) {
            console.error("Failed to resolve conflict:", err);
            message.error(err.message || 'Failed to resolve conflict');
        }
    };

    const handleViewConflict = (conflict: EnhancedConflict) => {
        setSelectedConflict(conflict);
        setModalVisible(true);
    };

    const handleResolveConflict = (conflict: EnhancedConflict) => {
        setSelectedConflict(conflict);
        setResolveModalVisible(true);
    };

    const handleResolveSubmit = async (values: any) => {
        if (selectedConflict) {
            await resolveConflict(selectedConflict._id, values.resolutionMethod, values.resolutionSummary);
        }
    };

    const handleDetectionSubmit = async (values: any) => {
        await runConflictDetection(values);
        setDetectionModalVisible(false);
    };

    const getStatusColor = (resolved: boolean) => {
        return resolved ? 'green' : 'red';
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'priority_conflict': return 'blue';
            case 'requirement_conflict': return 'orange';
            case 'resource_conflict': return 'purple';
            case 'timeline_conflict': return 'cyan';
            case 'stakeholder_conflict': return 'red';
            case 'duplicate': return 'geekblue';
            case 'inconsistent': return 'volcano';
            case 'exclusion': return 'magenta';
            case 'timeline_mismatch': return 'lime';
            default: return 'default';
        }
    };


    const getSeverityColor = (severity: number) => {
        if (severity >= 0.8) return '#ff4d4f';
        if (severity >= 0.6) return '#fa8c16';
        if (severity >= 0.4) return '#fadb14';
        return '#52c41a';
    };

    const getSeverityText = (severity: number) => {
        if (severity >= 0.8) return 'Critical';
        if (severity >= 0.6) return 'High';
        if (severity >= 0.4) return 'Medium';
        return 'Low';
    };


    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'red';
            case 'it_staff': return 'blue';
            case 'faculty': return 'green';
            case 'student': return 'orange';
            default: return 'default';
        }
    };

    const filteredConflicts = conflicts.filter(conflict => {
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'resolved' && conflict.resolved) ||
            (statusFilter === 'open' && !conflict.resolved);
        
        const matchesType = typeFilter === 'all' || conflict.type === typeFilter;
        const matchesDetector = detectorFilter === 'all' || conflict.detector === detectorFilter;
        
        const matchesSearch = searchText === '' || 
            conflict.type.toLowerCase().includes(searchText.toLowerCase()) ||
            (conflict.description && conflict.description.toLowerCase().includes(searchText.toLowerCase()));
        
        return matchesStatus && matchesType && matchesDetector && matchesSearch;
    });


    const conflictColumns = [
        {
            title: 'ID',
            dataIndex: '_id',
            key: 'id',
            render: (id: string) => id.slice(-8),
            width: 100
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={getTypeColor(type)}>
                    {type?.replace('_', ' ').toUpperCase() || 'Unknown'}
                </Tag>
            ),
            width: 150
        },
        {
            title: 'Status',
            dataIndex: 'resolved',
            key: 'resolved',
            render: (resolved: boolean) => (
                <Tag color={getStatusColor(resolved)}>
                    {resolved ? 'RESOLVED' : 'OPEN'}
                </Tag>
            ),
            width: 100
        },
        {
            title: 'Detector',
            dataIndex: 'detector',
            key: 'detector',
            render: (detector: string) => (
                <Tag color="blue">
                    {detector?.replace('-', ' ').toUpperCase() || 'Unknown'}
                </Tag>
            ),
            width: 120
        },
        {
            title: 'Severity',
            dataIndex: 'severity',
            key: 'severity',
            render: (severity: number) => (
                <Tag color={getSeverityColor(severity)}>
                    {(severity * 100).toFixed(0)}%
                </Tag>
            ),
            width: 100
        },
        {
            title: 'Resolution Method',
            dataIndex: 'resolutionMethod',
            key: 'resolutionMethod',
            render: (method: string) => (
                <Tag color="green">
                    {method?.replace('-', ' ').toUpperCase() || 'N/A'}
                </Tag>
            ),
            width: 150
        },
        {
            title: 'Round',
            dataIndex: 'roundNumber',
            key: 'roundNumber',
            render: (round: number) => round || 'N/A',
            width: 80
        },
        {
            title: 'Proposal',
            dataIndex: ['proposalId', 'title'],
            key: 'proposal',
            render: (title: string, record: Conflict) => (
                <div>
                    <Text strong>{title || 'N/A'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {(record.proposalId as any)?.status || 'Unknown Status'}
                    </Text>
                </div>
            ),
            width: 200
        },
        {
            title: 'Stakeholders',
            dataIndex: 'stakeholders',
            key: 'stakeholders',
            render: (_: any[], record: EnhancedConflict) => {
                // Try to get stakeholders from the conflict record or proposal
                const conflictStakeholders = record.stakeholders || 
                    (record.proposalId as any)?.stakeholders || 
                    (record.proposalId as any)?.stakeholderUsers || 
                    [];
                
                if (conflictStakeholders && conflictStakeholders.length > 0) {
                    return (
                <div>
                            {conflictStakeholders.slice(0, 2).map((stakeholder: any, index: number) => (
                                <Tag 
                                    key={index} 
                                    color={getRoleColor(stakeholder.role || stakeholder.submitterRole)} 
                                    style={{ marginBottom: '2px' }}
                                >
                                    {stakeholder.name || stakeholder.email || stakeholder.role || `Stakeholder ${index + 1}`}
                        </Tag>
                    ))}
                            {conflictStakeholders.length > 2 && (
                                <Tag color="default">+{conflictStakeholders.length - 2}</Tag>
                    )}
                </div>
                    );
                }
                
                return (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        No stakeholders
                    </Text>
                );
            },
            width: 200
        },
        {
            title: 'Detected',
            dataIndex: 'detectedAt',
            key: 'detectedAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
            width: 120
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: EnhancedConflict) => (
                <Space>
                    <Tooltip title="View Details">
                    <Button 
                            type="text"
                        icon={<EyeOutlined />} 
                    onClick={() => handleViewConflict(record)}
                        />
                    </Tooltip>
                    {!record.resolved && (
                        <Tooltip title="Resolve Conflict">
                            <Button
                                type="text"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleResolveConflict(record)}
                                style={{ color: '#52c41a' }}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
            width: 120
        }
    ];

    const renderProposalsByRole = () => {
        if (!proposalsWithConflicts?.proposalsByRole) return null;

        return Object.entries(proposalsWithConflicts.proposalsByRole).map(([role, proposals]) => (
            <Panel 
                header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>
                        <Badge count={proposals.length} showZero />
                        <Text>Proposals with Conflicts</Text>
                    </div>
                } 
                key={role}
            >
                <Row gutter={[16, 16]}>
                    {proposals.map((item, index) => (
                        <Col xs={24} sm={12} lg={8} key={index}>
                            <Card 
                                size="small"
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileTextOutlined />
                                        <Text ellipsis style={{ maxWidth: '200px' }}>
                                            {item.proposal.title}
                                        </Text>
                                    </div>
                                }
                                extra={
                                    <Badge 
                                        count={item.conflicts.length} 
                                        style={{ backgroundColor: '#ff4d4f' }}
                                    />
                                }
                                actions={[
                                    <Button 
                                        type="link" 
                                        size="small"
                                        onClick={() => {
                                            const firstConflict = item.conflicts[0];
                                            if (firstConflict) handleViewConflict(firstConflict);
                                        }}
                                    >
                                        View Conflicts
                                    </Button>
                                ]}
                            >
                                <div style={{ marginBottom: '8px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        Status: <Tag color={item.proposal.status === 'active' ? 'green' : 'default'}>
                                            {item.proposal.status}
                                        </Tag>
                                    </Text>
                                </div>
                                
                                <div style={{ marginBottom: '8px' }}>
                                    <Text strong style={{ fontSize: '12px' }}>Stakeholders:</Text>
                                    <div style={{ marginTop: '4px' }}>
                                        {item.stakeholders.slice(0, 3).map((stakeholder, idx) => (
                                            <Tag key={idx} color={getRoleColor(stakeholder.role)}>
                                                {stakeholder.name}
                                            </Tag>
                                        ))}
                                        {item.stakeholders.length > 3 && (
                                            <Tag>+{item.stakeholders.length - 3}</Tag>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Text strong style={{ fontSize: '12px' }}>Conflict Types:</Text>
                                    <div style={{ marginTop: '4px' }}>
                                        {Array.from(new Set(item.conflicts.map(c => c.type))).slice(0, 2).map((type, idx) => (
                                            <Tag key={idx} color={getTypeColor(type)}>
                                                {type?.replace('_', ' ')}
                                            </Tag>
                                        ))}
                                        {Array.from(new Set(item.conflicts.map(c => c.type))).length > 2 && (
                                            <Tag>+{Array.from(new Set(item.conflicts.map(c => c.type))).length - 2}</Tag>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Panel>
        ));
    };


    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2}>Advanced Conflict Management</Title>
                <Paragraph>
                            Comprehensive conflict detection and resolution system. 
                            Monitor, analyze, and resolve conflicts across proposals and stakeholder groups.
                </Paragraph>
                    </Col>
                    <Col>
                        <Space>
                            <Button
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                onClick={() => setDetectionModalVisible(true)}
                                loading={detecting}
                            >
                                Run Detection
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchData}
                                loading={loading}
                            >
                                Refresh
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px' }}
                    action={
                        <Button size="small" onClick={fetchData}>
                            Retry
                        </Button>
                    }
                />
            )}

            {/* Enhanced Summary Statistics */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Total Conflicts" 
                            value={conflictStats?.total || proposalsWithConflicts?.conflictSummary?.totalConflicts || dashboardData?.negotiationMetrics?.conflictsResolved || 0}
                            prefix={<ExclamationCircleOutlined />} 
                                valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                                title="Resolved Conflicts"
                            value={conflictStats?.resolved || proposalsWithConflicts?.conflictSummary?.resolvedConflicts || dashboardData?.negotiationMetrics?.conflictsResolved || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                                title="Open Conflicts"
                            value={conflictStats?.open || proposalsWithConflicts?.conflictSummary?.openConflicts || Math.max(0, (dashboardData?.negotiationMetrics?.conflictsResolved || 0) - (dashboardData?.negotiationMetrics?.conflictsResolved || 0))}
                                prefix={<WarningOutlined />}
                                valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Resolution Rate"
                            value={conflictStats?.resolutionRate || 0}
                            suffix="%"
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                    {
                        key: 'conflicts',
                        label: 'All Conflicts',
                        children: (
                            <>
                                {/* Enhanced Filters */}
                                <Card style={{ marginBottom: '16px' }}>
                                    <Row gutter={[16, 16]} align="middle">
                                        <Col xs={24} sm={6}>
                                            <Select
                                                placeholder="Filter by Status"
                                                value={statusFilter}
                                                onChange={setStatusFilter}
                                                style={{ width: '100%' }}
                                            >
                                                <Option value="all">All Status</Option>
                                                <Option value="open">Open</Option>
                                                <Option value="resolved">Resolved</Option>
                                            </Select>
                                        </Col>
                                        <Col xs={24} sm={6}>
                                            <Select
                                                placeholder="Filter by Type"
                                                value={typeFilter}
                                                onChange={setTypeFilter}
                                                style={{ width: '100%' }}
                                            >
                                                <Option value="all">All Types</Option>
                                                <Option value="requirement_conflict">Requirement Conflict</Option>
                                                <Option value="resource_conflict">Resource Conflict</Option>
                                                <Option value="timeline_conflict">Timeline Conflict</Option>
                                                <Option value="stakeholder_conflict">Stakeholder Conflict</Option>
                                                <Option value="priority_conflict">Priority Conflict</Option>
                                                <Option value="duplicate">Duplicate</Option>
                                                <Option value="inconsistent">Inconsistent</Option>
                                                <Option value="exclusion">Exclusion</Option>
                                            </Select>
                                        </Col>
                                        <Col xs={24} sm={6}>
                                            <Select
                                                placeholder="Filter by Detector"
                                                value={detectorFilter}
                                                onChange={setDetectorFilter}
                                                style={{ width: '100%' }}
                                            >
                                                <Option value="all">All Detectors</Option>
                                                <Option value="rule_nlp">Rule NLP</Option>
                                                <Option value="ontology">Ontology</Option>
                                                <Option value="dominance_rule">Dominance Rule</Option>
                                            </Select>
                                        </Col>
                                        <Col xs={24} sm={6}>
                                            <Input
                                                placeholder="Search conflicts..."
                                                prefix={<SearchOutlined />}
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                            />
                                        </Col>
                                    </Row>
                                </Card>

                                {/* Conflicts Table */}
                                <Card>
                                    <Table
                                        columns={conflictColumns}
                                        dataSource={filteredConflicts.map(c => ({ ...c, key: c._id }))}
                                        loading={loading}
                                        pagination={{
                                            pageSize: 10,
                                            showSizeChanger: true,
                                            showQuickJumper: true,
                                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} conflicts`
                                        }}
                                        scroll={{ x: 1200 }}
                                        locale={{
                                            emptyText: (
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description="No conflicts found"
                                                />
                                            )
                                        }}
                                    />
                                </Card>
                            </>
                        )
                    },
                    {
                        key: 'proposals',
                        label: 'Proposals by Role',
                        children: (
                            <>
                                <Card>
                                    <Collapse>
                                        {renderProposalsByRole()}
                                    </Collapse>
                                </Card>
                            </>
                        )
                    },
                    {
                        key: 'analytics',
                        label: 'Conflict Analytics',
                        children: (
                            <>
                                <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Card title="Conflicts by Type" extra={<BugOutlined />}>
                                {conflictStats?.byType && conflictStats.byType.length > 0 ? (
                                    <Pie
                                        data={conflictStats.byType.map(item => ({
                                            type: item._id.replace('_', ' ').toUpperCase(),
                                            value: item.count
                                        }))}
                                        angleField="value"
                                        colorField="type"
                                        radius={0.8}
                                        label={{
                                            type: 'outer',
                                            content: '{name}: {percentage}'
                                        }}
                                        interactions={[{ type: 'element-active' }]}
                                    />
                                ) : (
                                    <Empty description="No conflict type data available" />
                                )}
                    </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Conflicts by Detector" extra={<SettingOutlined />}>
                                {conflictStats?.byDetector && conflictStats.byDetector.length > 0 ? (
                                    <Column
                                        data={conflictStats.byDetector.map(item => ({
                                            detector: item._id.replace('_', ' ').toUpperCase(),
                                            count: item.count
                                        }))}
                                        xField="detector"
                                        yField="count"
                                        color="#1890ff"
                                        columnStyle={{
                                            radius: [4, 4, 0, 0]
                                        }}
                                    />
                                ) : (
                                    <Empty description="No detector data available" />
                                )}
                            </Card>
                        </Col>
                    </Row>
                            </>
                        )
                    },
                    {
                        key: 'requirements',
                        label: 'Requirements',
                        children: (
                            <>
                                <Card style={{ marginBottom: '16px' }}>
                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} sm={8}>
                                <Input
                                    placeholder="Search requirements..."
                                    prefix={<SearchOutlined />}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <Select
                                    placeholder="Filter by Category"
                                    style={{ width: '100%' }}
                                >
                                    <Option value="functional">Functional</Option>
                                    <Option value="non_functional">Non-Functional</Option>
                                    <Option value="constraint">Constraint</Option>
                                </Select>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Select
                                    placeholder="Filter by Priority"
                                    style={{ width: '100%' }}
                                >
                                    <Option value="must">Must Have</Option>
                                    <Option value="should">Should Have</Option>
                                    <Option value="could">Could Have</Option>
                                    <Option value="wont">Won't Have</Option>
                                </Select>
                            </Col>
                        </Row>
                    </Card>

                    {/* Requirements Statistics */}
                    {requirementStats && (
                        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                            <Col xs={24} sm={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Total Requirements" 
                                        value={requirementStats.totalCount || 0}
                                        prefix={<FileTextOutlined />} 
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Functional" 
                                        value={requirementStats.categoryDistribution?.find((c: any) => c._id === 'functional')?.count || 0}
                                        prefix={<BugOutlined />} 
                                        valueStyle={{ color: '#52c41a' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Non-Functional" 
                                        value={requirementStats.categoryDistribution?.find((c: any) => c._id === 'non_functional')?.count || 0}
                                        prefix={<SettingOutlined />} 
                                        valueStyle={{ color: '#faad14' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Constraints" 
                                        value={requirementStats.categoryDistribution?.find((c: any) => c._id === 'constraint')?.count || 0}
                                        prefix={<WarningOutlined />} 
                                        valueStyle={{ color: '#ff4d4f' }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    )}

                    <Table
                        dataSource={requirements}
                        columns={[
                            {
                                title: 'ID',
                                dataIndex: 'reqId',
                                key: 'reqId',
                                width: 120
                            },
                            {
                                title: 'Title',
                                dataIndex: 'title',
                                key: 'title',
                                ellipsis: true
                            },
                            {
                                title: 'Category',
                                dataIndex: 'category',
                                key: 'category',
                                render: (category: string) => (
                                    <Tag color={category === 'functional' ? 'blue' : category === 'non_functional' ? 'green' : 'orange'}>
                                        {category.replace('_', ' ').toUpperCase()}
                                    </Tag>
                                ),
                                width: 120
                            },
                            {
                                title: 'Priority',
                                dataIndex: 'moscowPriority',
                                key: 'moscowPriority',
                                render: (priority: string) => (
                                    <Tag color={priority === 'must' ? 'red' : priority === 'should' ? 'orange' : priority === 'could' ? 'blue' : 'default'}>
                                        {priority.toUpperCase()}
                                    </Tag>
                                ),
                                width: 100
                            },
                            {
                                title: 'Risk Level',
                                dataIndex: 'riskLevel',
                                key: 'riskLevel',
                                render: (risk: string) => (
                                    <Tag color={risk === 'high' ? 'red' : risk === 'medium' ? 'orange' : 'green'}>
                                        {risk.toUpperCase()}
                                    </Tag>
                                ),
                                width: 100
                            },
                            {
                                title: 'Status',
                                dataIndex: 'status',
                                key: 'status',
                                render: (status: string) => (
                                    <Tag color={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'default'}>
                                        {status.toUpperCase()}
                                    </Tag>
                                ),
                                width: 100
                            }
                        ]}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                        size="small"
                    />
                            </>
                        )
                    }
                ]}
            />

            {/* Enhanced Conflict Details Modal */}
            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined />
                        <span>Conflict Details</span>
                    </Space>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={900}
            >
                {selectedConflict && (
                    <div>
                        {/* Basic Information */}
                        <Card size="small" style={{ marginBottom: '16px' }}>
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Text strong>Conflict Type:</Text>
                                    <br />
                                    <Tag color={getTypeColor(selectedConflict.type)} style={{ marginTop: '4px' }}>
                                        {selectedConflict.type?.replace('_', ' ').toUpperCase() || 'Unknown'}
                                    </Tag>
                                </Col>
                                <Col span={8}>
                                    <Text strong>Status:</Text>
                                    <br />
                                    <Tag color={getStatusColor(selectedConflict.resolved)} style={{ marginTop: '4px' }}>
                                        {selectedConflict.resolved ? 'RESOLVED' : 'OPEN'}
                                    </Tag>
                                </Col>
                                <Col span={8}>
                                    <Text strong>Severity:</Text>
                                    <br />
                                    <Space style={{ marginTop: '4px' }}>
                                        <Progress
                                            type="circle"
                                            size={30}
                                            percent={selectedConflict.severity * 100}
                                            strokeColor={getSeverityColor(selectedConflict.severity)}
                                            format={() => ''}
                                        />
                                        <Text style={{ color: getSeverityColor(selectedConflict.severity), fontWeight: 'bold' }}>
                                            {getSeverityText(selectedConflict.severity)}
                                        </Text>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>

                        {/* Technical Details */}
                        <Card size="small" style={{ marginBottom: '16px' }}>
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Text strong>Detector:</Text>
                                    <br />
                                    <Tag color="blue" style={{ marginTop: '4px' }}>
                                        {selectedConflict.detector || 'Unknown'}
                                    </Tag>
                                </Col>
                                <Col span={8}>
                                    <Text strong>Round Number:</Text>
                                    <br />
                                    <Text style={{ marginTop: '4px' }}>{selectedConflict.roundNumber || 'N/A'}</Text>
                                </Col>
                                <Col span={8}>
                                    <Text strong>Detected At:</Text>
                                    <br />
                                    <Text style={{ marginTop: '4px' }}>
                                        {selectedConflict.detectedAt ? new Date(selectedConflict.detectedAt).toLocaleString() : 'N/A'}
                                    </Text>
                                </Col>
                            </Row>
                        </Card>

                        {/* Stakeholders Information */}
                        <Card size="small" style={{ marginBottom: '16px' }}>
                            <Text strong>Affected Stakeholders:</Text>
                            <br />
                            {selectedConflict.stakeholders && selectedConflict.stakeholders.length > 0 ? (
                                <div style={{ marginTop: '8px' }}>
                                    {selectedConflict.stakeholders.map((stakeholder: any, index: number) => (
                                        <Tag 
                                            key={index} 
                                            color={getRoleColor(stakeholder.role)} 
                                            style={{ marginBottom: '4px' }}
                                        >
                                            {stakeholder.name || stakeholder.role || `Stakeholder ${index + 1}`}
                                        </Tag>
                                    ))}
                                </div>
                            ) : (
                                <Text type="secondary" style={{ marginTop: '4px' }}>
                                    No stakeholder information available
                                </Text>
                            )}
                        </Card>

                        {/* Proposal Information */}
                        <Card size="small" style={{ marginBottom: '16px' }}>
                            <Text strong>Related Proposal:</Text>
                            <br />
                            {selectedConflict.proposalId ? (
                                <div style={{ marginTop: '8px' }}>
                                    <Text strong>Title: </Text>
                                    <Text>{(selectedConflict.proposalId as any)?.title || 'Unknown Proposal'}</Text>
                                    <br />
                                    <Text strong>Status: </Text>
                                    <Tag color="blue">
                                        {(selectedConflict.proposalId as any)?.status || 'Unknown'}
                                    </Tag>
                                </div>
                            ) : (
                                <Text type="secondary" style={{ marginTop: '4px' }}>
                                    No proposal information available
                                </Text>
                            )}
                        </Card>

                        {/* Description */}
                        <Card size="small" style={{ marginBottom: '16px' }}>
                            <Text strong>Description:</Text>
                            <br />
                            <Text style={{ marginTop: '4px' }}>
                                {selectedConflict.description || 'No description available'}
                            </Text>
                        </Card>

                        {/* Conflicting Clauses */}
                        {selectedConflict.clauses && selectedConflict.clauses.length > 0 && (
                            <Card size="small" style={{ marginBottom: '16px' }}>
                                <Text strong>Conflicting Clauses:</Text>
                                <br />
                                <List
                                    size="small"
                                    dataSource={selectedConflict.clauses}
                                    renderItem={(clause: string, index: number) => (
                                        <List.Item>
                                            <Space>
                                                <Tag color="orange">Clause {index + 1}</Tag>
                                                <Text code>{clause}</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                    style={{ marginTop: '8px' }}
                                />
                            </Card>
                        )}

                        {/* Resolution Information */}
                        {selectedConflict.resolved && (
                            <Card size="small" style={{ marginBottom: '16px' }}>
                                <Text strong>Resolution Information:</Text>
                                <br />
                                <Row gutter={[16, 16]} style={{ marginTop: '8px' }}>
                                    <Col span={12}>
                                        <Text strong>Method:</Text>
                                        <br />
                                        <Tag color="green" style={{ marginTop: '4px' }}>
                                            {selectedConflict.resolutionMethod || 'Unknown'}
                                        </Tag>
                                    </Col>
                                    <Col span={12}>
                                        <Text strong>Resolved At:</Text>
                                        <br />
                                        <Text style={{ marginTop: '4px' }}>
                                            {selectedConflict.resolvedAt ? new Date(selectedConflict.resolvedAt).toLocaleString() : 'N/A'}
                                        </Text>
                                    </Col>
                                </Row>
                                {selectedConflict.resolutionSummary && (
                                    <>
                                        <Divider />
                                        <Text strong>Summary:</Text>
                                        <br />
                                        <Text style={{ marginTop: '4px' }}>
                                            {selectedConflict.resolutionSummary}
                                        </Text>
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Blockchain Information */}
                        {selectedConflict.chain && (
                            <Card size="small">
                                <Text strong>Blockchain Information:</Text>
                                <br />
                                <Row gutter={[16, 16]} style={{ marginTop: '8px' }}>
                                    <Col span={8}>
                                        <Text strong>Transaction Hash:</Text>
                                        <br />
                                        <Text code style={{ fontSize: '12px' }}>
                                            {selectedConflict.chain.txHash || 'Not recorded'}
                                        </Text>
                                    </Col>
                                    <Col span={8}>
                                        <Text strong>Block Number:</Text>
                                        <br />
                                        <Text>{selectedConflict.chain.blockNumber || 'Not recorded'}</Text>
                                    </Col>
                                    <Col span={8}>
                                        <Text strong>Network:</Text>
                                        <br />
                                        <Text>{selectedConflict.chain.network || 'Not recorded'}</Text>
                                    </Col>
                                </Row>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>

            {/* Resolve Conflict Modal */}
            <Modal
                title="Resolve Conflict"
                open={resolveModalVisible}
                onCancel={() => setResolveModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={resolveForm}
                    layout="vertical"
                    onFinish={handleResolveSubmit}
                >
                    <Form.Item
                        name="resolutionMethod"
                        label="Resolution Method"
                        rules={[{ required: true, message: 'Please select a resolution method' }]}
                    >
                        <Select placeholder="Select resolution method">
                            <Option value="manual_resolution">Manual Resolution</Option>
                            <Option value="stakeholder_discussion">Stakeholder Discussion</Option>
                            <Option value="automated_resolution">Automated Resolution</Option>
                            <Option value="priority_based">Priority Based</Option>
                            <Option value="consensus_building">Consensus Building</Option>
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        name="resolutionSummary"
                        label="Resolution Summary"
                        rules={[{ required: true, message: 'Please provide a resolution summary' }]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Describe how the conflict was resolved..."
                        />
                    </Form.Item>
                    
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Resolve Conflict
                            </Button>
                            <Button onClick={() => setResolveModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Enhanced Conflict Detection Modal */}
            <Modal
                title="Enhanced Conflict Detection & Requirements Extraction"
                open={detectionModalVisible}
                onCancel={() => setDetectionModalVisible(false)}
                footer={null}
                width={800}
            >
                <Tabs 
                    defaultActiveKey="detection"
                    items={[
                        {
                            key: 'detection',
                            label: 'Conflict Detection',
                            children: (
                                <>
                                    <Form
                                        layout="vertical"
                                        onFinish={handleRunEnhancedDetection}
                                    >
                            <Form.Item
                                name="negotiationId"
                                label="Negotiation ID"
                                rules={[{ required: true, message: 'Please enter negotiation ID' }]}
                            >
                                <Input 
                                    placeholder="Enter negotiation ID" 
                                    value={selectedNegotiationId}
                                    onChange={(e) => setSelectedNegotiationId(e.target.value)}
                                />
                            </Form.Item>
                            
                            <Form.Item
                                name="projectId"
                                label="Project ID"
                                rules={[{ required: true, message: 'Please enter project ID' }]}
                            >
                                <Input 
                                    placeholder="Enter project ID" 
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                />
                            </Form.Item>
                            
                            <Form.Item>
                                <Space>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        loading={detecting}
                                        icon={<PlayCircleOutlined />}
                                    >
                                        Run Enhanced Detection
                                    </Button>
                                    <Button onClick={() => setDetectionModalVisible(false)}>
                                        Cancel
                                    </Button>
                                </Space>
                            </Form.Item>
                                    </Form>
                                </>
                            )
                        },
                        {
                            key: 'requirements',
                            label: 'Requirements Extraction',
                            children: (
                                <>
                                    <Form
                                        layout="vertical"
                                        onFinish={handleExtractRequirements}
                                    >
                            <Form.Item
                                name="projectId"
                                label="Project ID"
                                rules={[{ required: true, message: 'Please enter project ID' }]}
                            >
                                <Input 
                                    placeholder="Enter project ID" 
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                />
                            </Form.Item>
                            
                            <Form.Item
                                name="negotiationId"
                                label="Negotiation ID"
                                rules={[{ required: true, message: 'Please enter negotiation ID' }]}
                            >
                                <Input 
                                    placeholder="Enter negotiation ID" 
                                    value={selectedNegotiationId}
                                    onChange={(e) => setSelectedNegotiationId(e.target.value)}
                                />
                            </Form.Item>
                            
                            <Form.Item>
                                <Space>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        loading={extracting}
                                        icon={<FileTextOutlined />}
                                    >
                                        Extract Requirements
                                    </Button>
                                    <Button onClick={() => setDetectionModalVisible(false)}>
                                        Cancel
                                    </Button>
                                </Space>
                            </Form.Item>
                                    </Form>
                                </>
                            )
                        }
                    ]}
                />
            </Modal>

            {/* Legacy Conflict Detection Modal */}
            <Modal
                title="Run Conflict Detection"
                open={false}
                onCancel={() => setDetectionModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    layout="vertical"
                    onFinish={handleDetectionSubmit}
                >
                    <Form.Item
                        name="detectionType"
                        label="Detection Type"
                        rules={[{ required: true, message: 'Please select a detection type' }]}
                    >
                        <Select placeholder="Select detection type">
                            <Option value="all">All Pending Proposals</Option>
                            <Option value="negotiation">Specific Negotiation</Option>
                            <Option value="topic">Specific Topic</Option>
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        name="negotiationId"
                        label="Negotiation ID"
                        dependencies={['detectionType']}
                    >
                        {({ getFieldValue }) => 
                            getFieldValue('detectionType') === 'negotiation' ? (
                                <Input placeholder="Enter negotiation ID" />
                            ) : null
                        }
                    </Form.Item>
                    
                    <Form.Item
                        name="topicKey"
                        label="Topic Key"
                        dependencies={['detectionType']}
                    >
                        {({ getFieldValue }) => 
                            getFieldValue('detectionType') === 'topic' ? (
                                <Input placeholder="Enter topic key" />
                            ) : null
                        }
                    </Form.Item>
                    
                    <Form.Item>
                        <Space>
                            <Button 
                                type="primary" 
                                htmlType="submit"
                                loading={detecting}
                                icon={<PlayCircleOutlined />}
                            >
                                Run Detection
                            </Button>
                            <Button onClick={() => setDetectionModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Conflict Detail Modal */}
            <Modal
                title="Conflict Details"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={800}
            >
                {selectedConflict && (
                    <div>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Text strong>Type:</Text>
                                <br />
                                <Tag color={getTypeColor(selectedConflict.type)}>
                                    {selectedConflict.type?.replace('_', ' ').toUpperCase()}
                                </Tag>
                            </Col>
                            <Col span={8}>
                                <Text strong>Status:</Text>
                                <br />
                                <Tag color={getStatusColor(selectedConflict.resolved)}>
                                    {selectedConflict.resolved ? 'RESOLVED' : 'OPEN'}
                                </Tag>
                            </Col>
                            <Col span={8}>
                                <Text strong>Severity:</Text>
                                <br />
                                <Tag color={getSeverityColor(selectedConflict.severity)}>
                                    {(selectedConflict.severity * 100).toFixed(0)}%
                                </Tag>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text strong>Detector:</Text>
                            <br />
                                <Tag color="blue">
                                    {selectedConflict.detector?.replace('-', ' ').toUpperCase() || 'Unknown'}
                                </Tag>
                            </Col>
                            <Col span={12}>
                                <Text strong>Resolution Method:</Text>
                                <br />
                                <Tag color="green">
                                    {selectedConflict.resolutionMethod?.replace('-', ' ').toUpperCase() || 'N/A'}
                                </Tag>
                            </Col>
                        </Row>

                        <Divider />

                        {selectedConflict.resolutionSummary && (
                            <div style={{ marginBottom: '16px' }}>
                                <Text strong>Resolution Summary:</Text>
                                <br />
                                <Text>{selectedConflict.resolutionSummary}</Text>
                            </div>
                        )}

                        {selectedConflict.clauses && selectedConflict.clauses.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <Text strong>Conflicting Clauses:</Text>
                                <br />
                                <div style={{ marginTop: '8px' }}>
                                    {selectedConflict.clauses.map((clause: any, index: number) => (
                                        <Tag key={index} color="orange">
                                            Clause {index + 1}: {typeof clause === 'string' ? clause : 'Object'}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Text strong>Round Number:</Text>
                                <br />
                                <Text>{selectedConflict.roundNumber || 'N/A'}</Text>
                            </Col>
                            <Col span={8}>
                                <Text strong>Detected At:</Text>
                                <br />
                                <Text>{new Date(selectedConflict.detectedAt).toLocaleString()}</Text>
                            </Col>
                            {selectedConflict.resolvedAt && (
                                <Col span={8}>
                                    <Text strong>Resolved At:</Text>
                                    <br />
                                    <Text>{new Date(selectedConflict.resolvedAt).toLocaleString()}</Text>
                                </Col>
                            )}
                        </Row>

                        {selectedConflict.chain && (
                            <div>
                                <Divider />
                                <div>
                                    <Text strong>Blockchain Information:</Text>
                                    <br />
                                    <Text>Transaction Hash: {selectedConflict.chain.txHash || 'Not recorded'}</Text>
                                    <br />
                                    <Text>Block Number: {selectedConflict.chain.blockNumber || 'Not recorded'}</Text>
                                    <br />
                                    <Text>Network: {selectedConflict.chain.network || 'Not recorded'}</Text>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ConflictsPage;