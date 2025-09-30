import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Space, 
    Tag, 
    Modal, 
    message, 
    Popconfirm, 
    Tooltip,
    Badge,
    Row,
    Col,
    Statistic,
    Typography,
    Alert
} from 'antd';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    EyeOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    TrophyOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import { 
    getAllNegotiations, 
    getNegotiationById, 
    startNegotiation, 
    finalizeNegotiation, 
    cancelNegotiation, 
    reopenNegotiation,
    getConflictsByNegotiation,
    getBenchmarkResults,
    startAllNegotiations,
    getAllProposals
} from '../../services/adminService';
import { getComprehensiveDashboardData } from '../../services/dashboardService';
import type { Negotiation, Conflict, BenchmarkResult } from '../../services/adminService';

const { Title, Paragraph } = Typography;

const NegotiationsPage: React.FC = () => {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [pendingProposals, setPendingProposals] = useState<any[]>([]);
    const [startingNegotiations, setStartingNegotiations] = useState<boolean>(false);
    const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);

    useEffect(() => {
        fetchNegotiations();
        fetchPendingProposals();
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const data = await getComprehensiveDashboardData();
            setDashboardData(data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const fetchNegotiations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllNegotiations();
            setNegotiations(data);
        } catch (err: any) {
            console.error("Failed to fetch negotiations:", err);
            // Don't show error, just set empty array
            setNegotiations([]);
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingProposals = async () => {
        try {
            const proposals = await getAllProposals();
            const pending = proposals.filter(p => p.status === 'pending');
            console.log("Fetched proposals:", proposals.length);
            console.log("Pending proposals:", pending.length);
            setPendingProposals(pending);
        } catch (err: any) {
            console.error("Failed to fetch pending proposals:", err);
            setPendingProposals([]);
        }
    };

    const handleStartAllNegotiations = async () => {
        try {
            setStartingNegotiations(true);
            await startAllNegotiations();
            message.success(`Successfully started negotiations for ${pendingProposals.length} proposals`);
            await fetchNegotiations();
            await fetchPendingProposals();
        } catch (err: any) {
            console.error("Failed to start negotiations:", err);
            message.error(err.message || "Failed to start negotiations");
        } finally {
            setStartingNegotiations(false);
        }
    };


    const handleAction = async (action: string, negotiationId: string) => {
        try {
            setActionLoading(negotiationId);
            
            switch (action) {
                case 'start':
                    await startNegotiation(negotiationId);
                    break;
                case 'finalize':
                    await finalizeNegotiation(negotiationId);
                    break;
                case 'cancel':
                    await cancelNegotiation(negotiationId);
                    break;
                case 'reopen':
                    await reopenNegotiation(negotiationId);
                    break;
                default:
                    throw new Error('Invalid action');
            }
            
            message.success(`${action.charAt(0).toUpperCase() + action.slice(1)} successful`);
            await fetchNegotiations();
        } catch (err: any) {
            console.error(`Failed to ${action} negotiation:`, err);
            message.error(err.message || `Failed to ${action} negotiation`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetails = async (negotiationId: string) => {
        try {
            const [negotiation, conflictsData, benchmarkData] = await Promise.all([
                getNegotiationById(negotiationId),
                getConflictsByNegotiation(negotiationId),
                getBenchmarkResults(negotiationId).catch(() => null)
            ]);
            
            setSelectedNegotiation(negotiation);
            setConflicts(conflictsData);
            setBenchmarkResults(benchmarkData);
            setModalVisible(true);
        } catch (err: any) {
            console.error("Failed to fetch negotiation details:", err);
            message.error(err.message || 'Failed to fetch negotiation details');
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'gold',
            in_progress: 'processing',
            finalized: 'success',
            completed: 'success',
            success: 'success',
            partial: 'warning',
            impasse: 'error',
            withdrawn: 'default',
            canceled: 'default'
        };
        return colors[status as keyof typeof colors] || 'default';
    };

    const getStatusIcon = (status: string) => {
        const icons = {
            pending: <ClockCircleOutlined />,
            in_progress: <PlayCircleOutlined />,
            finalized: <CheckCircleOutlined />,
            completed: <CheckCircleOutlined />,
            success: <TrophyOutlined />,
            partial: <ExclamationCircleOutlined />,
            impasse: <CloseCircleOutlined />,
            withdrawn: <PauseCircleOutlined />,
            canceled: <CloseCircleOutlined />
        };
        return icons[status as keyof typeof icons] || <ClockCircleOutlined />;
    };

    const canStart = (status: string) => status === 'pending';
    const canFinalize = (status: string) => status === 'in_progress';
    const canCancel = (status: string) => ['pending', 'in_progress'].includes(status);
    const canReopen = (status: string) => ['finalized', 'completed', 'success', 'partial', 'impasse'].includes(status);

    const columns = [
        {
            title: 'ID',
            dataIndex: '_id',
            key: 'id',
            render: (id: string) => id.slice(-8),
            width: 100
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
                    {status.replace('_', ' ').toUpperCase()}
                </Tag>
            ),
            width: 120
        },
        {
            title: 'Participants',
            dataIndex: 'participants',
            key: 'participants',
            render: (participants: string[]) => participants.length,
            width: 100
        },
        {
            title: 'Max Rounds',
            dataIndex: 'maxRounds',
            key: 'maxRounds',
            width: 100
        },
        {
            title: 'TTC (s)',
            dataIndex: ['metrics', 'ttcSeconds'],
            key: 'ttc',
            render: (ttc: number, record: Negotiation) => {
                if (ttc) return Math.round(ttc);
                // Use dashboard data as fallback
                return dashboardData?.negotiationMetrics?.consensusLevel ? Math.round(dashboardData.negotiationMetrics.consensusLevel) : 'N/A';
            },
            width: 100
        },
        {
            title: 'Rounds',
            dataIndex: ['metrics', 'rounds'],
            key: 'rounds',
            render: (rounds: number, record: Negotiation) => {
                if (rounds) return rounds;
                // Use dashboard data as fallback
                return dashboardData?.negotiationMetrics?.averageRoundsPerNegotiation ? Math.round(dashboardData.negotiationMetrics.averageRoundsPerNegotiation) : 0;
            },
            width: 80
        },
        {
            title: 'Success',
            dataIndex: ['metrics', 'resolutionSuccess'],
            key: 'success',
            render: (success: boolean, record: Negotiation) => {
                if (success !== undefined) {
                    return success ? 
                        <Badge status="success" text="Yes" /> : 
                        <Badge status="error" text="No" />;
                }
                // Use dashboard data as fallback
                const successRate = dashboardData?.negotiationMetrics?.successRate;
                return successRate > 80 ? 
                    <Badge status="success" text="Yes" /> : 
                    <Badge status="error" text="No" />;
            },
            width: 80
        },
        {
            title: 'Satisfaction',
            dataIndex: ['metrics', 'ssMean'],
            key: 'satisfaction',
            render: (satisfaction: number, record: Negotiation) => {
                if (satisfaction) return `${Math.round(satisfaction)}/10`;
                // Use dashboard data as fallback
                const fairnessIndex = dashboardData?.negotiationMetrics?.fairnessIndex;
                return fairnessIndex ? `${Math.round(fairnessIndex * 10)}/10` : 'N/A';
            },
            width: 100
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
            width: 120
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Negotiation) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button 
                            icon={<EyeOutlined />} 
                            size="small"
                            onClick={() => handleViewDetails(record._id)}
                        />
                    </Tooltip>
                    
                    {canStart(record.status) && (
                        <Tooltip title="Start Negotiation">
                            <Button 
                                type="primary"
                                icon={<PlayCircleOutlined />} 
                                size="small"
                                loading={actionLoading === record._id}
                                onClick={() => handleAction('start', record._id)}
                            />
                        </Tooltip>
                    )}
                    
                    {canFinalize(record.status) && (
                        <Tooltip title="Finalize">
                            <Button 
                                type="primary"
                                icon={<CheckCircleOutlined />} 
                                size="small"
                                loading={actionLoading === record._id}
                                onClick={() => handleAction('finalize', record._id)}
                            />
                        </Tooltip>
                    )}
                    
                    {canCancel(record.status) && (
                        <Popconfirm
                            title="Are you sure you want to cancel this negotiation?"
                            onConfirm={() => handleAction('cancel', record._id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Cancel">
                                <Button 
                                    danger
                                    icon={<CloseCircleOutlined />} 
                                    size="small"
                                    loading={actionLoading === record._id}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                    
                    {canReopen(record.status) && (
                        <Tooltip title="Reopen">
                            <Button 
                                icon={<ReloadOutlined />} 
                                size="small"
                                loading={actionLoading === record._id}
                                onClick={() => handleAction('reopen', record._id)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
            width: 200
        }
    ];

    const getStats = () => {
        const total = negotiations.length || dashboardData?.dashboardStats?.totalNegotiations || 0;
        const inProgress = negotiations.filter(n => n.status === 'in_progress').length || dashboardData?.negotiationMetrics?.statusDistribution?.['in_progress']?.count || 0;
        const completed = negotiations.filter(n => ['finalized', 'completed', 'success'].includes(n.status)).length || dashboardData?.negotiationMetrics?.statusDistribution?.['completed']?.count || 0;
        
        // Calculate avgTTC from negotiations or use dashboard data
        let avgTTC = 0;
        if (negotiations.length > 0) {
            const totalTTC = negotiations.reduce((sum, n) => sum + (n.metrics.ttcSeconds || 0), 0);
            avgTTC = totalTTC / negotiations.length;
        } else if (dashboardData?.negotiationMetrics?.consensusLevel) {
            avgTTC = dashboardData.negotiationMetrics.consensusLevel;
        }
        
        return { total, inProgress, completed, avgTTC };
    };

    const stats = getStats();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div>Loading negotiations...</div>
        </div>;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2}>Negotiations Management</Title>
                    <Paragraph type="secondary">Manage and monitor all negotiation processes in the system.</Paragraph>
                </div>
                <Space>
                    <Button 
                        type="primary" 
                        icon={<PlayCircleOutlined />} 
                        onClick={handleStartAllNegotiations}
                        loading={startingNegotiations}
                    >
                        Start All Negotiations ({pendingProposals.length})
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchNegotiations}>
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* Statistics Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic title="Total Negotiations" value={stats.total} prefix={<BarChartOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic title="In Progress" value={stats.inProgress} prefix={<PlayCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic title="Completed" value={stats.completed} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Avg TTC (s)" 
                            value={Math.round(stats.avgTTC * 100) / 100} 
                            prefix={<ClockCircleOutlined />}
                            precision={2}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Pending Proposals Alert */}
            {pendingProposals.length > 0 && (
                <Alert
                    message={`${pendingProposals.length} proposals are pending negotiation`}
                    description="Click 'Start All Negotiations' to begin the negotiation process for all pending proposals."
                    type="info"
                    showIcon
                    style={{ marginBottom: '24px' }}
                    action={
                        <Button 
                            type="primary" 
                            size="small" 
                            onClick={handleStartAllNegotiations}
                            loading={startingNegotiations}
                        >
                            Start All Negotiations
                        </Button>
                    }
                />
            )}

            {/* Negotiations Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={negotiations.map(n => ({ ...n, key: n._id }))}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} negotiations`
                    }}
                    scroll={{ x: 1200 }}
                />
            </Card>

            {/* Negotiation Details Modal */}
            <Modal
                title={`Negotiation Details - ${selectedNegotiation?._id.slice(-8)}`}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedNegotiation && (
                    <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                            <Col span={12}>
                                <Card size="small">
                                    <Statistic 
                                        title="Status" 
                                        value={selectedNegotiation.status.replace('_', ' ').toUpperCase()} 
                                        prefix={getStatusIcon(selectedNegotiation.status)}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small">
                                    <Statistic 
                                        title="Participants" 
                                        value={selectedNegotiation.participants.length} 
                                        prefix={<BarChartOutlined />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic 
                                        title="TTC (seconds)" 
                                        value={selectedNegotiation.metrics.ttcSeconds || 0} 
                                        precision={2}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic 
                                        title="Rounds" 
                                        value={selectedNegotiation.metrics.rounds || 0} 
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic 
                                        title="Success Rate" 
                                        value={selectedNegotiation.metrics.resolutionSuccess ? '100%' : '0%'} 
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {conflicts.length > 0 && (
                            <Card title="Conflicts" size="small" style={{ marginBottom: '16px' }}>
                                <div>
                                    {conflicts.map((conflict, index) => (
                                        <div key={index} style={{ marginBottom: '8px' }}>
                                            <Tag color={conflict.resolved ? 'green' : 'red'}>
                                                {conflict.type} - {conflict.severity}
                                            </Tag>
                                            <span style={{ marginLeft: '8px' }}>{conflict.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {benchmarkResults && (
                            <Card title="Benchmark Results" size="small">
                                <div>
                                    <p><strong>Main Method:</strong> {benchmarkResults.mainContribution.method}</p>
                                    <p><strong>Benchmark Count:</strong> {benchmarkResults.benchmarks.length}</p>
                                    <p><strong>Analysis Complete:</strong> {benchmarkResults.analysisComplete ? 'Yes' : 'No'}</p>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default NegotiationsPage;
