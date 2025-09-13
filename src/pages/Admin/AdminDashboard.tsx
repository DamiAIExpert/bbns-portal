import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Statistic, Spin, Alert, Table, Tag, Button, Space, Progress, Tooltip, Badge } from 'antd';
import {
    FileDoneOutlined,
    TeamOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    TrophyOutlined,
    BarChartOutlined,
    DownloadOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
    CheckCircleTwoTone,
    CloseCircleTwoTone,
} from '@ant-design/icons';
import { Bar, Pie, Line, Column } from '@ant-design/plots';
import { 
    getComprehensiveDashboardStats, 
    getAllProposals, 
    getAllNegotiations,
    getConflictsAggregate,
    getFeedbackAnalytics,
    getBenchmarkMetricsSummary,
    getFeasibilitySummary,
    downloadAllProposals,
    exportBenchmarkCSV,
    exportFeasibilityCSV,
    downloadEvaluationReport
} from '../../services/adminService';
import type { 
    AdminDashboardStats, 
    Negotiation, 
    Conflict,
    FeedbackAnalytics,
    BenchmarkResult
} from '../../services/adminService';
import type { Proposal } from '../../services/proposalService';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [conflicts, setConflicts] = useState<any>(null);
    const [feedback, setFeedback] = useState<FeedbackAnalytics | null>(null);
    const [benchmarkMetrics, setBenchmarkMetrics] = useState<any>(null);
    const [feasibilitySummary, setFeasibilitySummary] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch basic data first
                const [statsData, proposalsData] = await Promise.all([
                    getComprehensiveDashboardStats(),
                    getAllProposals()
                ]);

                setStats(statsData);
                setProposals(proposalsData);

                // Try to fetch additional data, but don't fail if they don't exist
                try {
                    const negotiationsData = await getAllNegotiations();
                    setNegotiations(negotiationsData);
                } catch (err) {
                    console.warn("Could not fetch negotiations:", err);
                    setNegotiations([]);
                }

                try {
                    const conflictsData = await getConflictsAggregate();
                    setConflicts(conflictsData);
                } catch (err) {
                    console.warn("Could not fetch conflicts:", err);
                    setConflicts(null);
                }

                try {
                    const feedbackData = await getFeedbackAnalytics();
                    setFeedback(feedbackData);
                } catch (err) {
                    console.warn("Could not fetch feedback:", err);
                    setFeedback(null);
                }

                try {
                    const benchmarkData = await getBenchmarkMetricsSummary();
                    setBenchmarkMetrics(benchmarkData);
                } catch (err) {
                    console.warn("Could not fetch benchmark metrics:", err);
                    setBenchmarkMetrics(null);
                }

                try {
                    const feasibilityData = await getFeasibilitySummary();
                    setFeasibilitySummary(feasibilityData);
                } catch (err) {
                    console.warn("Could not fetch feasibility summary:", err);
                    setFeasibilitySummary(null);
                }

            } catch (err: any) {
                console.error("Failed to load admin dashboard data:", err);
                setError(err.message || 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
    }

    if (error) {
        return <Alert message="Error Loading Data" description={error} type="error" showIcon />;
    }

    if (!stats) {
        return <Alert message="No Data" description="Could not retrieve dashboard statistics." type="warning" showIcon />;
    }

    // --- Data processing for the charts ---
    const proposalStatusData = proposals.reduce((acc, p) => {
        const status = p.status.replace('_', ' ');
        const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        const existing = acc.find(item => item.status === capitalizedStatus);
        if (existing) {
            existing.count += 1;
        } else {
            acc.push({ status: capitalizedStatus, count: 1 });
        }
        return acc;
    }, [] as { status: string; count: number }[]);

    const negotiationStatusData = negotiations.reduce((acc, n) => {
        const status = n.status.replace('_', ' ');
        const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        const existing = acc.find(item => item.status === capitalizedStatus);
        if (existing) {
            existing.count += 1;
        } else {
            acc.push({ status: capitalizedStatus, count: 1 });
        }
        return acc;
    }, [] as { status: string; count: number }[]);

    const performanceData = negotiations.map(n => ({
        negotiationId: n._id.slice(-6),
        ttc: n.metrics.ttcSeconds || 0,
        rounds: n.metrics.rounds || 0,
        satisfaction: n.metrics.ssMean || 0,
        success: n.metrics.resolutionSuccess ? 1 : 0
    }));

    const recentProposalsColumns = [
        { title: 'Title', dataIndex: 'title', key: 'title', render: (text: string, record: Proposal) => <Link to={`/admin/proposals/${record._id}`}>{text}</Link> },
        { title: 'Submitted By', dataIndex: ['submittedBy', 'name'], key: 'submitter' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color="blue" style={{textTransform: 'capitalize'}}>{status.replace('_', ' ')}</Tag> },
        { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
    ];

    const recentNegotiationsColumns = [
        { title: 'ID', dataIndex: '_id', key: 'id', render: (id: string) => id.slice(-6) },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
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
            return <Tag color={colors[status as keyof typeof colors] || 'default'}>{status.replace('_', ' ')}</Tag>;
        }},
        { title: 'TTC (s)', dataIndex: ['metrics', 'ttcSeconds'], key: 'ttc', render: (ttc: number) => ttc ? Math.round(ttc) : 'N/A' },
        { title: 'Rounds', dataIndex: ['metrics', 'rounds'], key: 'rounds', render: (rounds: number) => rounds || 0 },
        { title: 'Success', dataIndex: ['metrics', 'resolutionSuccess'], key: 'success', render: (success: boolean) => 
            success ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#ff4d4f" />
        },
        { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
    ];

    const handleExportData = async (type: string) => {
        try {
            switch (type) {
                case 'proposals':
                    await downloadAllProposals();
                    break;
                case 'benchmarks':
                    await exportBenchmarkCSV();
                    break;
                case 'feasibility':
                    await exportFeasibilityCSV();
                    break;
                case 'evaluation':
                    await downloadEvaluationReport();
                    break;
            }
        } catch (error) {
            console.error(`Error exporting ${type}:`, error);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2}>Administrator Dashboard</Title>
                    <Paragraph type="secondary">Comprehensive business intelligence overview of the blockchain negotiation system.</Paragraph>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
                        Refresh
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => handleExportData('proposals')}>
                        Export Data
                    </Button>
                </Space>
            </div>

            {/* Key Metrics Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Total Proposals" 
                            value={stats?.totalProposals || 0} 
                            prefix={<FileDoneOutlined />}
                            suffix={<Badge count={proposals.filter(p => p.status === 'pending').length} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Active Users" 
                            value={stats?.activeUsers || 0} 
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Negotiations in Progress" 
                            value={stats?.negotiationsInProgress || 0} 
                            prefix={<SyncOutlined spin={stats?.negotiationsInProgress > 0} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Conflicts Detected" 
                            value={stats?.conflicts || 0} 
                            prefix={<WarningOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Performance Metrics Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Average TTC (seconds)" 
                            value={stats?.averageTTC || 0} 
                            prefix={<ClockCircleOutlined />}
                            precision={2}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Average Satisfaction" 
                            value={stats?.averageSatisfaction || 0} 
                            prefix={<TrophyOutlined />}
                            precision={1}
                            suffix="/10"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Finalized Negotiations" 
                            value={stats?.finalizedNegotiations || 0} 
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Recent Activity (7d)" 
                            value={stats?.recentActivity || 0} 
                            prefix={<BarChartOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Proposals by Status" extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => handleExportData('proposals')}>Export</Button>}>
                        <Bar 
                            data={proposalStatusData} 
                            xField="count" 
                            yField="status" 
                            seriesField="status" 
                            legend={{ position: 'top-left' }} 
                            height={250}
                            color={['#1890ff', '#52c41a', '#faad14', '#f5222d']}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Negotiation Status Distribution" extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => handleExportData('benchmarks')}>Export</Button>}>
                        <Pie 
                            data={negotiationStatusData} 
                            angleField="count" 
                            colorField="status" 
                            radius={0.8} 
                            legend={{ position: 'right' }} 
                            height={250}
                            color={['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Performance Analysis Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Time to Consensus Performance" extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => handleExportData('evaluation')}>Export</Button>}>
                        <Line 
                            data={performanceData} 
                            xField="negotiationId" 
                            yField="ttc" 
                            height={250}
                            point={{ size: 4, shape: 'circle' }}
                            color="#1890ff"
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Satisfaction vs Rounds" extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => handleExportData('feasibility')}>Export</Button>}>
                        <Column 
                            data={performanceData} 
                            xField="rounds" 
                            yField="satisfaction" 
                            height={250}
                            color="#52c41a"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Recent Activity Tables */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Card title="Recent Proposals" extra={<Link to="/admin/proposals">View All</Link>}>
                        <Table
                            dataSource={proposals.slice(0, 5).map(p => ({...p, key: p._id}))}
                            columns={recentProposalsColumns}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Recent Negotiations" extra={<Link to="/admin/negotiations">View All</Link>}>
                        <Table
                            dataSource={negotiations.slice(0, 5).map(n => ({...n, key: n._id}))}
                            columns={recentNegotiationsColumns}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>

            {/* System Health Row */}
            {conflicts && (
                <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
                    <Col span={24}>
                        <Card title="System Health & Conflicts" extra={<Button size="small" icon={<ExclamationCircleOutlined />}>View Details</Button>}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                            {conflicts.resolutionRate || 0}%
                                        </div>
                                        <div>Conflict Resolution Rate</div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                                            {conflicts.totalConflicts || 0}
                                        </div>
                                        <div>Total Conflicts</div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                                            {conflicts.meanTimeToResolutionMinutes || 0}m
                                        </div>
                                        <div>Avg Resolution Time</div>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default AdminDashboard;
