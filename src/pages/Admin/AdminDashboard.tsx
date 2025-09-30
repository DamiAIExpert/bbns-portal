import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Row, 
    Col, 
    Card, 
    Typography, 
    Statistic, 
    Spin, 
    Alert, 
    Table, 
    Tag, 
    Button, 
    Space, 
    Badge, 
    Tabs, 
    Progress, 
    Tooltip, 
    Dropdown, 
    Menu, 
    DatePicker, 
    Input, 
    Switch, 
    notification, 
    Drawer, 
    List, 
    Avatar, 
    Empty,
    Divider
} from 'antd';
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
    ReloadOutlined,
    ExclamationCircleOutlined,
    CheckCircleTwoTone,
    CloseCircleTwoTone,
    SettingOutlined,
    SearchOutlined,
    BellOutlined,
    EyeOutlined,
    LineChartOutlined,
    PieChartOutlined,
    RiseOutlined,
    FallOutlined,
    InfoCircleOutlined,
    CalendarOutlined,
    DashboardOutlined,
    SecurityScanOutlined
} from '@ant-design/icons';
import { Bar, Pie, Line, Column } from '@ant-design/plots';
import { 
    getComprehensiveDashboardStats, 
    getAllProposals, 
    getAllNegotiations,
    getConflictsAggregate,
    downloadAllProposals,
    exportBenchmarkCSV,
    exportFeasibilityCSV,
    downloadEvaluationReport
} from '../../services/adminService';
import { 
    getComprehensiveDashboardData,
    type DashboardStats,
    type StakeholderMetrics,
    type ProposalMetrics,
    type NegotiationMetrics,
    type FinalProposalMetrics,
    type ResearchMetrics,
    type BlockchainMetrics
} from '../../services/dashboardService';
import type { 
    AdminDashboardStats, 
    Negotiation
} from '../../services/adminService';
import type { Proposal } from '../../services/proposalService';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

/* ───────────────────────────────── Types ───────────────────────────────── */

interface DashboardFilters {
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
    status?: string[];
    role?: string[];
    searchTerm?: string;
}

interface NotificationItem {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

interface SystemHealth {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
}

interface PerformanceMetrics {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
    successRate: number;
    trends: {
        responseTime: 'up' | 'down' | 'stable';
        throughput: 'up' | 'down' | 'stable';
        errors: 'up' | 'down' | 'stable';
    };
}

/* ────────────────────────────── Component ───────────────────────────── */

const AdminDashboard: React.FC = () => {
    // Core data state
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [conflicts, setConflicts] = useState<any>(null);
    
    // UI state
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    
    // Enhanced state
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [filters, setFilters] = useState<DashboardFilters>({});
    const [notifications] = useState<NotificationItem[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
    const [darkMode, setDarkMode] = useState<boolean>(false);

    const fetchAllData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);
            
            // Fetch comprehensive dashboard data using public endpoints
            const dashboardData = await getComprehensiveDashboardData();
            
            // Transform the data to match the expected format
            const transformedStats: AdminDashboardStats = {
                activeUsers: dashboardData.dashboardStats.totalStakeholders,
                conflicts: 0, // Will be updated from conflicts data
                totalProposals: dashboardData.dashboardStats.totalProposals,
                totalVotes: 0, // Not available in current data
                negotiationsInProgress: dashboardData.negotiationMetrics.statusDistribution['in_progress']?.count || 0,
                finalizedNegotiations: dashboardData.negotiationMetrics.statusDistribution['completed']?.count || 0,
                averageTTC: dashboardData.negotiationMetrics.consensusLevel,
                averageSatisfaction: dashboardData.negotiationMetrics.fairnessIndex * 10, // Convert to 0-10 scale
                recentActivity: 0 // Will be calculated from recent data
            };
            
            setStats(transformedStats);
            
            // Fetch additional data in parallel
            const [proposalsResult, negotiationsResult, conflictsResult] = await Promise.allSettled([
                getAllProposals(),
                getAllNegotiations(),
                getConflictsAggregate()
            ]);

            if (proposalsResult.status === 'fulfilled') {
                setProposals(proposalsResult.value);
            } else {
                console.warn("Failed to fetch proposals:", proposalsResult.reason);
                setProposals([]);
            }

            if (negotiationsResult.status === 'fulfilled') {
                console.log("Dashboard negotiations:", negotiationsResult.value.length, "negotiations");
                setNegotiations(negotiationsResult.value);
            } else {
                console.warn("Could not fetch negotiations:", negotiationsResult.reason);
                setNegotiations([]);
            }

            if (conflictsResult.status === 'fulfilled') {
                setConflicts(conflictsResult.value);
            } else {
                console.warn("Could not fetch conflicts:", conflictsResult.reason);
                setConflicts(null);
            }

            // Set system health data based on real metrics
            setSystemHealth({
                status: dashboardData.dashboardStats.processingEfficiency > 80 ? 'healthy' : 'warning',
                uptime: dashboardData.dashboardStats.negotiationSuccessRate,
                responseTime: 150, // Default value
                errorRate: 100 - dashboardData.dashboardStats.negotiationSuccessRate,
                activeConnections: dashboardData.dashboardStats.totalStakeholders
            });

            // Set performance metrics based on real data
            setPerformanceMetrics({
                avgResponseTime: 145, // Default value
                throughput: dashboardData.dashboardStats.totalProposals,
                errorRate: 100 - dashboardData.dashboardStats.negotiationSuccessRate,
                successRate: dashboardData.dashboardStats.negotiationSuccessRate,
                trends: {
                    responseTime: 'stable',
                    throughput: 'up',
                    errors: dashboardData.dashboardStats.negotiationSuccessRate > 90 ? 'down' : 'up'
                }
            });

            // Add success notification
            if (showLoading) {
                notification.success({
                    message: 'Dashboard Updated',
                    description: 'All data has been refreshed successfully',
                    placement: 'topRight',
                    duration: 3
                });
            }

        } catch (err: any) {
            console.error("Failed to load admin dashboard data:", err);
            setError(err.message || 'An unknown error occurred.');
            
            notification.error({
                message: 'Data Loading Failed',
                description: err.message || 'Failed to load dashboard data',
                placement: 'topRight',
                duration: 5
            });
        } finally {
            if (showLoading) {
                setLoading(false);
            }
            setLastUpdated(new Date());
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchAllData(false);
        } finally {
            setIsRefreshing(false);
        }
    }, [fetchAllData]);

    const handleExportData = useCallback(async (type: string) => {
        try {
            const exportActions = {
                proposals: () => downloadAllProposals(),
                benchmarks: () => exportBenchmarkCSV(),
                feasibility: () => exportFeasibilityCSV(),
                evaluation: () => downloadEvaluationReport()
            };

            await exportActions[type as keyof typeof exportActions]();
            
            notification.success({
                message: 'Export Successful',
                description: `${type} data has been exported successfully`,
                placement: 'topRight'
            });
        } catch (error: any) {
            console.error(`Error exporting ${type}:`, error);
            notification.error({
                message: 'Export Failed',
                description: `Failed to export ${type} data`,
                placement: 'topRight'
            });
        }
    }, []);

    useEffect(() => {
        fetchAllData();
        
        // Set up auto-refresh with configurable interval
        const interval = setInterval(() => {
            if (autoRefresh) {
                console.log('Auto-refreshing dashboard data...');
                setIsRefreshing(true);
                fetchAllData(false).finally(() => {
                    setIsRefreshing(false);
                });
            }
        }, 30000); // 30 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [fetchAllData, autoRefresh]);

    // Enhanced data processing with memoization
    const processedData = useMemo(() => {
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

        const proposalRoleData = proposals.reduce((acc, p) => {
            let role = p.submittedBy?.role;
            
            if (!role && p.submittedBy && typeof p.submittedBy === 'object') {
                role = p.submittedBy.role;
            }
            
            if (!role) {
                role = 'student';
            }
            
            const roleDisplay = role === 'it_staff' ? 'IT Staff' : 
                               role === 'faculty' ? 'Faculty' : 
                               role === 'student' ? 'Student' : 
                               role.charAt(0).toUpperCase() + role.slice(1);
            
            const existing = acc.find(item => item.role === roleDisplay);
            if (existing) {
                existing.count += 1;
            } else {
                acc.push({ role: roleDisplay, count: 1 });
            }
            return acc;
        }, [] as { role: string; count: number }[]);

        const negotiationStatusData = negotiations.reduce((acc, n) => {
            let status = n.status;
            if (status === 'completed') {
                status = 'completed';
            } else {
                status = status.replace('_', ' ') as any;
                status = status.charAt(0).toUpperCase() + status.slice(1);
            }
            
            const existing = acc.find(item => item.status === status);
            if (existing) {
                existing.count += 1;
            } else {
                acc.push({ status: status, count: 1 });
            }
            return acc;
        }, [] as { status: string; count: number }[]);

        const performanceData = negotiations.map(n => {
            const ttc = n.metrics?.ttcSeconds || (n.metrics?.ttcMs ? n.metrics.ttcMs / 1000 : 0) || 0;
            const rounds = n.metrics?.rounds || 0;
            const satisfaction = n.metrics?.ssMean || 0;
            const success = n.metrics?.resolutionSuccess ? 1 : 0;
            
            return {
                negotiationId: n._id.slice(-6),
                ttc: ttc,
                rounds: rounds,
                satisfaction: satisfaction,
                success: success
            };
        });

        return {
            proposalStatusData,
            proposalRoleData,
            negotiationStatusData,
            performanceData
        };
    }, [proposals, negotiations]);

    // Enhanced loading state with better UX
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '60vh',
                gap: '16px'
            }}>
                <Spin size="large" />
                <Text type="secondary">Loading dashboard data...</Text>
                <Progress percent={75} size="small" style={{ width: '200px' }} />
            </div>
        );
    }

    if (error) {
        return (
            <Alert 
                message="Error Loading Data" 
                description={error} 
                type="error" 
                showIcon 
                action={
                    <Button size="small" onClick={() => fetchAllData()}>
                        Retry
                    </Button>
                }
            />
        );
    }

    if (!stats) {
        return (
            <Alert 
                message="No Data Available" 
                description="Could not retrieve dashboard statistics. Please try refreshing the page." 
                type="warning" 
                showIcon 
                action={
                    <Button size="small" onClick={() => fetchAllData()}>
                        Refresh
                    </Button>
                }
            />
        );
    }

    const { proposalStatusData, proposalRoleData, negotiationStatusData, performanceData } = processedData;

    // Enhanced table columns with better styling and functionality
    const recentProposalsColumns = [
        { 
            title: 'Title', 
            dataIndex: 'title', 
            key: 'title', 
            render: (text: string, record: Proposal) => (
                <Link to={`/admin/proposals/${record._id}`}>
                    <Text strong>{text}</Text>
                </Link>
            ),
            ellipsis: true
        },
        { 
            title: 'Submitted By', 
            dataIndex: ['submittedBy', 'name'], 
            key: 'submitter',
            render: (name: string, _record: Proposal) => (
                <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                        {name?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Text>{name || 'Unknown'}</Text>
                </Space>
            )
        },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status', 
            render: (status: string) => {
                const statusConfig = {
                    pending: { color: 'gold', icon: <ClockCircleOutlined /> },
                    finalized: { color: 'green', icon: <CheckCircleOutlined /> },
                    in_negotiation: { color: 'blue', icon: <SyncOutlined spin /> },
                    rejected: { color: 'red', icon: <CloseCircleTwoTone twoToneColor="#ff4d4f" /> }
                };
                const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', icon: null };
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {status.replace('_', ' ')}
                    </Tag>
                );
            }
        },
        { 
            title: 'Created', 
            dataIndex: 'createdAt', 
            key: 'createdAt', 
            render: (date: string) => (
                <Tooltip title={new Date(date).toLocaleString()}>
                    <Text type="secondary">{dayjs(date).format('MMM DD, YYYY')}</Text>
                </Tooltip>
            )
        },
    ];

    const recentNegotiationsColumns = [
        { 
            title: 'ID', 
            dataIndex: '_id', 
            key: 'id', 
            render: (id: string) => (
                <Text code>{id.slice(-6)}</Text>
            )
        },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status', 
            render: (status: string) => {
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
            }
        },
        { 
            title: 'TTC (s)', 
            dataIndex: ['metrics', 'ttcSeconds'], 
            key: 'ttc', 
            render: (ttc: number) => (
                <Text>{ttc ? Math.round(ttc) : 'N/A'}</Text>
            )
        },
        { 
            title: 'Rounds', 
            dataIndex: ['metrics', 'rounds'], 
            key: 'rounds', 
            render: (rounds: number) => (
                <Badge count={rounds || 0} showZero color="#1890ff" />
            )
        },
        { 
            title: 'Success', 
            dataIndex: ['metrics', 'resolutionSuccess'], 
            key: 'success', 
            render: (success: boolean) => 
                success ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#ff4d4f" />
        },
        { 
            title: 'Created', 
            dataIndex: 'createdAt', 
            key: 'createdAt', 
            render: (date: string) => (
                <Tooltip title={new Date(date).toLocaleString()}>
                    <Text type="secondary">{dayjs(date).format('MMM DD, YYYY')}</Text>
                </Tooltip>
            )
        },
    ];

    // Enhanced UI Components
    const renderSystemHealthCard = () => (
        <Card 
            title={
                <Space>
                    <SecurityScanOutlined />
                    System Health
                </Space>
            }
            extra={
                <Badge 
                    status={systemHealth?.status === 'healthy' ? 'success' : systemHealth?.status === 'warning' ? 'warning' : 'error'} 
                    text={systemHealth?.status?.toUpperCase()}
                />
            }
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Statistic 
                        title="Uptime" 
                        value={systemHealth?.uptime || 0} 
                        suffix="%" 
                        precision={1}
                        valueStyle={{ color: systemHealth?.status === 'healthy' ? '#52c41a' : '#faad14' }}
                    />
                </Col>
                <Col span={12}>
                    <Statistic 
                        title="Response Time" 
                        value={systemHealth?.responseTime || 0} 
                        suffix="ms" 
                        valueStyle={{ color: (systemHealth?.responseTime || 0) < 200 ? '#52c41a' : '#faad14' }}
                    />
                </Col>
                <Col span={12}>
                    <Statistic 
                        title="Error Rate" 
                        value={systemHealth?.errorRate || 0} 
                        suffix="%" 
                        precision={2}
                        valueStyle={{ color: (systemHealth?.errorRate || 0) < 1 ? '#52c41a' : '#f5222d' }}
                    />
                </Col>
                <Col span={12}>
                    <Statistic 
                        title="Active Connections" 
                        value={systemHealth?.activeConnections || 0}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Col>
            </Row>
        </Card>
    );

    const renderPerformanceMetrics = () => (
        <Card title="Performance Metrics">
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                        <Progress 
                            type="circle" 
                            percent={performanceMetrics?.successRate || 0} 
                            format={(percent) => `${percent}%`}
                            strokeColor="#52c41a"
                            size={80}
                        />
                        <div style={{ marginTop: 8 }}>Success Rate</div>
                    </div>
                </Col>
                <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                            {performanceMetrics?.avgResponseTime || 0}ms
                        </div>
                        <div>Avg Response Time</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                            {performanceMetrics?.trends.responseTime === 'up' && <RiseOutlined style={{ color: '#f5222d' }} />}
                            {performanceMetrics?.trends.responseTime === 'down' && <FallOutlined style={{ color: '#52c41a' }} />}
                            {performanceMetrics?.trends.responseTime === 'stable' && <Text type="secondary">Stable</Text>}
                        </div>
                    </div>
                </Col>
                <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                            {performanceMetrics?.throughput || 0}
                        </div>
                        <div>Throughput (req/min)</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                            {performanceMetrics?.trends.throughput === 'up' && <RiseOutlined style={{ color: '#52c41a' }} />}
                            {performanceMetrics?.trends.throughput === 'down' && <FallOutlined style={{ color: '#f5222d' }} />}
                            {performanceMetrics?.trends.throughput === 'stable' && <Text type="secondary">Stable</Text>}
                        </div>
                    </div>
                </Col>
            </Row>
        </Card>
    );

    const renderNotifications = () => (
        <Dropdown
            overlay={
                <Menu>
                    {notifications.length === 0 ? (
                        <Menu.Item disabled>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />
                        </Menu.Item>
                    ) : (
                        notifications.map(notification => (
                            <Menu.Item key={notification.id}>
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar 
                                                style={{ 
                                                    backgroundColor: notification.type === 'error' ? '#f5222d' : 
                                                                   notification.type === 'warning' ? '#faad14' : 
                                                                   notification.type === 'success' ? '#52c41a' : '#1890ff'
                                                }}
                                            >
                                                {notification.type === 'error' ? <ExclamationCircleOutlined /> :
                                                 notification.type === 'warning' ? <WarningOutlined /> :
                                                 notification.type === 'success' ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                                            </Avatar>
                                        }
                                        title={notification.title}
                                        description={
                                            <div>
                                                <div>{notification.message}</div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {dayjs(notification.timestamp).format('MMM DD, YYYY')}
                                                </Text>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            </Menu.Item>
                        ))
                    )}
                </Menu>
            }
            placement="bottomRight"
            trigger={['click']}
        >
            <Button icon={<BellOutlined />} shape="circle" />
        </Dropdown>
    );

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Enhanced Header */}
            <Card style={{ marginBottom: '24px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space direction="vertical" size="small">
                            <Title level={2} style={{ margin: 0 }}>
                                <DashboardOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                Administrator Dashboard
                            </Title>
                            <Space>
                                <Text type="secondary">
                                    Comprehensive business intelligence overview of the blockchain negotiation system
                                </Text>
                                <Badge 
                                    status={systemHealth?.status === 'healthy' ? 'success' : systemHealth?.status === 'warning' ? 'warning' : 'error'} 
                                    text="System Online"
                                />
                            </Space>
                            <Space size="large">
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <CalendarOutlined /> Last updated: {lastUpdated.toLocaleString()}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Auto-refresh: {autoRefresh ? 'ON' : 'OFF'} (30s)
                                </Text>
                                {isRefreshing && (
                                    <Text type="secondary" style={{ fontSize: '12px', color: '#1890ff' }}>
                                        <SyncOutlined spin /> Refreshing...
                                    </Text>
                                )}
                            </Space>
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            {renderNotifications()}
                            <Dropdown
                                overlay={
                                    <Menu>
                                        <Menu.Item key="proposals" onClick={() => handleExportData('proposals')}>
                                            <FileDoneOutlined /> Export Proposals
                                        </Menu.Item>
                                        <Menu.Item key="benchmarks" onClick={() => handleExportData('benchmarks')}>
                                            <BarChartOutlined /> Export Benchmarks
                                        </Menu.Item>
                                        <Menu.Item key="feasibility" onClick={() => handleExportData('feasibility')}>
                                            <PieChartOutlined /> Export Feasibility
                                        </Menu.Item>
                                        <Menu.Item key="evaluation" onClick={() => handleExportData('evaluation')}>
                                            <TrophyOutlined /> Export Evaluation
                                        </Menu.Item>
                                    </Menu>
                                }
                                placement="bottomRight"
                                trigger={['click']}
                            >
                                <Button icon={<DownloadOutlined />}>
                                    Export Data
                                </Button>
                            </Dropdown>
                            <Button 
                                icon={<ReloadOutlined spin={isRefreshing} />} 
                                onClick={handleRefresh}
                                loading={isRefreshing}
                                type="primary"
                            >
                                Refresh
                            </Button>
                            <Button 
                                icon={<SettingOutlined />} 
                                onClick={() => setShowSettings(true)}
                                shape="circle"
                            />
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Main Content with Tabs */}
            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                    {
                        key: 'overview',
                        label: (
                            <Space>
                                <DashboardOutlined />
                                Overview
                            </Space>
                        ),
                        children: (
                            <div>
                                {/* Key Metrics Row */}
                                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card hoverable>
                                            <Statistic 
                                                title="Total Proposals" 
                                                value={stats?.totalProposals || 0} 
                                                prefix={<FileDoneOutlined />}
                                                suffix={<Badge count={proposals.filter(p => p.status === 'pending').length} />}
                                                valueStyle={{ color: '#1890ff' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card hoverable>
                                            <Statistic 
                                                title="Active Users" 
                                                value={stats?.activeUsers || 0} 
                                                prefix={<TeamOutlined />}
                                                valueStyle={{ color: '#52c41a' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card hoverable>
                                            <Statistic 
                                                title="Negotiations in Progress" 
                                                value={stats?.negotiationsInProgress || 0} 
                                                prefix={<SyncOutlined spin={(stats?.negotiationsInProgress || 0) > 0} />}
                                                valueStyle={{ color: '#faad14' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card hoverable>
                                            <Statistic 
                                                title="Conflicts Detected" 
                                                value={stats?.conflicts || 0} 
                                                prefix={<WarningOutlined />}
                                                valueStyle={{ color: stats?.conflicts > 0 ? '#f5222d' : '#52c41a' }}
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
                                                valueStyle={{ color: '#722ed1' }}
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
                                                valueStyle={{ color: '#eb2f96' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card hoverable>
                                            <Statistic 
                                                title="Finalized Negotiations" 
                                                value={stats?.finalizedNegotiations || 0} 
                                                prefix={<CheckCircleOutlined />}
                                                valueStyle={{ color: '#52c41a' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card hoverable>
                                            <Statistic 
                                                title="Recent Activity (7d)" 
                                                value={stats?.recentActivity || 0} 
                                                prefix={<BarChartOutlined />}
                                                valueStyle={{ color: '#13c2c2' }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                {/* System Health and Performance */}
                                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                                    <Col xs={24} lg={12}>
                                        {renderSystemHealthCard()}
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        {renderPerformanceMetrics()}
                                    </Col>
                                </Row>
                            </div>
                        )
                    },
                    {
                        key: 'analytics',
                        label: (
                            <Space>
                                <LineChartOutlined />
                                Analytics
                            </Space>
                        ),
                        children: (
                            <div>
                                {/* Charts Row */}
                                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                                    <Col xs={24} lg={12}>
                                        <Card 
                                            title="Proposals by Status" 
                                            extra={
                                                <Button 
                                                    size="small" 
                                                    icon={<DownloadOutlined />} 
                                                    onClick={() => handleExportData('proposals')}
                                                >
                                                    Export
                                                </Button>
                                            }
                                        >
                                            <Bar 
                                                data={proposalStatusData} 
                                                xField="count" 
                                                yField="status" 
                                                seriesField="status" 
                                                legend={{ position: 'top-left' }} 
                                                height={300}
                                                color={['#1890ff', '#52c41a', '#faad14', '#f5222d']}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card 
                                            title="Active Stakeholders" 
                                            extra={
                                                <Button 
                                                    size="small" 
                                                    icon={<ReloadOutlined spin={loading} />} 
                                                    onClick={handleRefresh} 
                                                    loading={loading}
                                                >
                                                    Refresh
                                                </Button>
                                            }
                                        >
                                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}>
                                                    <TeamOutlined />
                                                </div>
                                                <Title level={3}>{stats?.activeUsers || 0} Active Stakeholders</Title>
                                                <Paragraph type="secondary">
                                                    Real-time distribution across Student, Faculty, and IT Staff roles for comprehensive requirement negotiation research.
                                                </Paragraph>
                                                <div style={{ marginTop: '20px' }}>
                                                    <Tag color="blue" style={{ margin: '4px' }}>
                                                        Students: {proposalRoleData.find(item => item.role === 'Student')?.count || 0} ({((proposalRoleData.find(item => item.role === 'Student')?.count || 0) / (stats?.activeUsers || 1) * 100).toFixed(1)}%)
                                                    </Tag>
                                                    <Tag color="green" style={{ margin: '4px' }}>
                                                        Faculty: {proposalRoleData.find(item => item.role === 'Faculty')?.count || 0} ({((proposalRoleData.find(item => item.role === 'Faculty')?.count || 0) / (stats?.activeUsers || 1) * 100).toFixed(1)}%)
                                                    </Tag>
                                                    <Tag color="orange" style={{ margin: '4px' }}>
                                                        IT Staff: {proposalRoleData.find(item => item.role === 'IT Staff')?.count || 0} ({((proposalRoleData.find(item => item.role === 'IT Staff')?.count || 0) / (stats?.activeUsers || 1) * 100).toFixed(1)}%)
                                                    </Tag>
                                                </div>
                                                <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Negotiation Status Row */}
                                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                                    <Col xs={24} lg={12}>
                                        <Card 
                                            title="Negotiation Status Distribution" 
                                            extra={
                                                <Button 
                                                    size="small" 
                                                    icon={<DownloadOutlined />} 
                                                    onClick={() => handleExportData('benchmarks')}
                                                >
                                                    Export
                                                </Button>
                                            }
                                        >
                                            <Pie 
                                                data={negotiationStatusData} 
                                                angleField="count" 
                                                colorField="status" 
                                                radius={0.8} 
                                                legend={{ position: 'right' }} 
                                                height={300}
                                                color={['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card 
                                            title="System Status" 
                                            extra={
                                                <Button 
                                                    size="small" 
                                                    icon={<BarChartOutlined />}
                                                >
                                                    View Details
                                                </Button>
                                            }
                                        >
                                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}>
                                                    <CheckCircleOutlined />
                                                </div>
                                                <Title level={3}>System Status</Title>
                                                <Paragraph type="secondary">
                                                    All systems operational with {stats?.totalProposals || 0} proposals and {stats?.negotiationsInProgress || 0} active negotiations.
                                                </Paragraph>
                                                <div style={{ marginTop: '20px' }}>
                                                    <Tag color="green" style={{ margin: '4px' }}>Proposals: {stats?.totalProposals || 0}</Tag>
                                                    <Tag color="blue" style={{ margin: '4px' }}>Negotiations: {stats?.negotiationsInProgress || 0}</Tag>
                                                    <Tag color="orange" style={{ margin: '4px' }}>Conflicts: {stats?.conflicts || 0}</Tag>
                                                </div>
                                                <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Performance Analysis Row */}
                                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                                    <Col xs={24} lg={12}>
                                        <Card 
                                            title="Time to Consensus Performance" 
                                            extra={
                                                <Button 
                                                    size="small" 
                                                    icon={<DownloadOutlined />} 
                                                    onClick={() => handleExportData('evaluation')}
                                                >
                                                    Export
                                                </Button>
                                            }
                                        >
                                            <Line 
                                                data={performanceData} 
                                                xField="negotiationId" 
                                                yField="ttc" 
                                                height={250}
                                                point={{ size: 4 }}
                                                color="#1890ff"
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card 
                                            title="Satisfaction vs Rounds" 
                                            extra={
                                                <Button 
                                                    size="small" 
                                                    icon={<DownloadOutlined />} 
                                                    onClick={() => handleExportData('feasibility')}
                                                >
                                                    Export
                                                </Button>
                                            }
                                        >
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
                            </div>
                        )
                    },
                    {
                        key: 'activity',
                        label: (
                            <Space>
                                <EyeOutlined />
                                Recent Activity
                            </Space>
                        ),
                        children: (
                            <div>
                                {/* Recent Activity Tables */}
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} lg={12}>
                                        <Card 
                                            title="Recent Proposals" 
                                            extra={<Link to="/admin/proposals">View All</Link>}
                                        >
                                            <Table
                                                dataSource={proposals.slice(0, 5).map(p => ({...p, key: p._id}))}
                                                columns={recentProposalsColumns}
                                                pagination={false}
                                                size="small"
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card 
                                            title="Recent Negotiations" 
                                            extra={<Link to="/admin/negotiations">View All</Link>}
                                        >
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
                                            <Card 
                                                title="System Health & Conflicts" 
                                                extra={
                                                    <Button 
                                                        size="small" 
                                                        icon={<ExclamationCircleOutlined />}
                                                    >
                                                        View Details
                                                    </Button>
                                                }
                                            >
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
                        )
                    }
                ]}
            />

            {/* Settings Drawer */}
            <Drawer
                title="Dashboard Settings"
                placement="right"
                onClose={() => setShowSettings(false)}
                open={showSettings}
                width={400}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <Title level={4}>Display Settings</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text>Dark Mode</Text>
                                <Switch 
                                    checked={darkMode} 
                                    onChange={setDarkMode}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text>Auto Refresh</Text>
                                <Switch 
                                    checked={autoRefresh} 
                                    onChange={setAutoRefresh}
                                />
                            </div>
                        </Space>
                    </div>
                    
                    <Divider />
                    
                    <div>
                        <Title level={4}>Data Filters</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                                <Text>Date Range</Text>
                                <DatePicker.RangePicker 
                                    style={{ width: '100%', marginTop: '8px' }}
                                    value={filters.dateRange}
                                    onChange={(dates) => setFilters({...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs]})}
                                />
                            </div>
                            <div>
                                <Text>Search</Text>
                                <Input 
                                    placeholder="Search proposals or negotiations..."
                                    prefix={<SearchOutlined />}
                                    style={{ marginTop: '8px' }}
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                                />
                            </div>
                        </Space>
                    </div>
                </Space>
            </Drawer>
        </div>
    );
};

export default AdminDashboard;
