import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Row, 
    Col, 
    Statistic, 
    Typography, 
    Select, 
    DatePicker, 
    Button, 
    Space, 
    Tabs,
    Spin,
    Alert,
    Progress
} from 'antd';
import {
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    TrophyOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    DownloadOutlined,
    ReloadOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { 
    Bar, 
    Line, 
    Pie, 
    Column, 
    Area, 
    Scatter, 
    Gauge, 
    Liquid,
    Funnel,
    Radar,
    Heatmap
} from '@ant-design/plots';
import { getComprehensiveDashboardData } from '../../services/dashboardService';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
// TabPane is deprecated, using items prop instead

// Mock data for charts
const mockData = {
  performance: [
    { month: 'Jan', ttc: 12, satisfaction: 85 },
    { month: 'Feb', ttc: 15, satisfaction: 88 },
    { month: 'Mar', ttc: 18, satisfaction: 82 },
    { month: 'Apr', ttc: 14, satisfaction: 90 },
    { month: 'May', ttc: 16, satisfaction: 87 },
    { month: 'Jun', ttc: 13, satisfaction: 89 }
  ],
  negotiations: [
    { method: 'Collaborative', count: 45, success: 38 },
    { method: 'Competitive', count: 32, success: 25 },
    { method: 'Compromising', count: 28, success: 22 },
    { method: 'Accommodating', count: 15, success: 12 }
  ],
  methods: [
    { name: 'Collaborative', value: 45, color: '#1890ff' },
    { name: 'Competitive', value: 32, color: '#52c41a' },
    { name: 'Compromising', value: 28, color: '#faad14' },
    { name: 'Accommodating', value: 15, color: '#f5222d' }
  ],
  stakeholders: [
    { name: 'Users', value: 120, color: '#1890ff' },
    { name: 'Developers', value: 85, color: '#52c41a' },
    { name: 'Managers', value: 65, color: '#faad14' },
    { name: 'Clients', value: 45, color: '#f5222d' }
  ],
  conflicts: [
    { type: 'Technical', count: 25, resolved: 20 },
    { type: 'Resource', count: 18, resolved: 15 },
    { type: 'Timeline', count: 12, resolved: 10 },
    { type: 'Scope', count: 8, resolved: 6 }
  ],
  trends: [
    { period: 'Q1', negotiations: 45, success: 38 },
    { period: 'Q2', negotiations: 52, success: 44 },
    { period: 'Q3', negotiations: 48, success: 41 },
    { period: 'Q4', negotiations: 55, success: 47 }
  ]
};

const AnalyticsPage: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<any>(null);
    const [selectedMetric, setSelectedMetric] = useState<string>('all');
    const [dashboardData, setDashboardData] = useState<any>(null);

    // Fetch real data from APIs
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getComprehensiveDashboardData();
                setDashboardData(data);
            } catch (err) {
                console.error('Error fetching analytics data:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Transform real data for charts
    const analyticsData = dashboardData ? {
        performance: [
            { month: 'Current', ttc: dashboardData.negotiationMetrics.consensusLevel, satisfaction: dashboardData.negotiationMetrics.fairnessIndex * 10, success: dashboardData.negotiationMetrics.successRate }
        ],
        negotiations: Object.entries(dashboardData.negotiationMetrics.statusDistribution).map(([status, data]: [string, any]) => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count: data.count,
            percentage: data.percentage
        })),
        methods: [
            { method: 'Enhanced-Swing+RoundRobin+NBS', ttc: dashboardData.negotiationMetrics.consensusLevel, satisfaction: dashboardData.negotiationMetrics.fairnessIndex * 10, success: dashboardData.negotiationMetrics.successRate }
        ],
        stakeholders: Object.entries(dashboardData.stakeholderMetrics.roleDistribution).map(([role, data]: [string, any]) => ({
            role: role.charAt(0).toUpperCase() + role.slice(1),
            count: data.count,
            satisfaction: dashboardData.stakeholderMetrics.agreementLevel,
            participation: dashboardData.stakeholderMetrics.participationRate
        })),
        conflicts: [
            { type: 'Priority Conflict', count: dashboardData.negotiationMetrics.conflictsResolved, resolved: dashboardData.negotiationMetrics.conflictsResolved, severity: 'medium' }
        ],
        trends: [
            { week: 'Current', proposals: dashboardData.dashboardStats.totalProposals, negotiations: dashboardData.dashboardStats.totalNegotiations, conflicts: dashboardData.negotiationMetrics.conflictsResolved }
        ]
    } : {
        performance: [],
        negotiations: [],
        methods: [],
        stakeholders: [],
        conflicts: [],
        trends: []
    };


    const getKPIStats = () => dashboardData ? {
        totalProposals: dashboardData.dashboardStats.totalProposals,
        activeNegotiations: dashboardData.negotiationMetrics.statusDistribution['in_progress']?.count || 0,
        completedNegotiations: dashboardData.negotiationMetrics.statusDistribution['completed']?.count || 0,
        avgTTC: dashboardData.negotiationMetrics.consensusLevel,
        avgSatisfaction: dashboardData.negotiationMetrics.fairnessIndex * 10,
        successRate: dashboardData.negotiationMetrics.successRate,
        conflictResolutionRate: dashboardData.negotiationMetrics.conflictsResolved,
        stakeholderEngagement: dashboardData.stakeholderMetrics.participationRate
    } : {
        totalProposals: 0,
        activeNegotiations: 0,
        completedNegotiations: 0,
        avgTTC: 0,
        avgSatisfaction: 0,
        successRate: 0,
        conflictResolutionRate: 0,
        stakeholderEngagement: 0
    };

    const kpiStats = getKPIStats();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <Spin size="large" />
        </div>;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2}>Analytics Dashboard</Title>
                    <Paragraph type="secondary">Comprehensive analytics and insights for the blockchain negotiation system.</Paragraph>
                </div>
                <Space>
                    <RangePicker 
                        value={dateRange} 
                        onChange={setDateRange}
                        placeholder={['Start Date', 'End Date']}
                    />
                    <Select 
                        value={selectedMetric} 
                        onChange={setSelectedMetric}
                        style={{ width: 200 }}
                    >
                        <Option value="all">All Metrics</Option>
                        <Option value="performance">Performance</Option>
                        <Option value="negotiations">Negotiations</Option>
                        <Option value="stakeholders">Stakeholders</Option>
                    </Select>
                    <Button icon={<ReloadOutlined />}>Refresh</Button>
                    <Button type="primary" icon={<DownloadOutlined />}>Export Report</Button>
                </Space>
            </div>

            {/* KPI Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Total Proposals" 
                            value={kpiStats.totalProposals} 
                            prefix={<BarChartOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Active Negotiations" 
                            value={kpiStats.activeNegotiations} 
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Avg TTC (sec)" 
                            value={kpiStats.avgTTC} 
                            prefix={<ClockCircleOutlined />}
                            precision={1}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card hoverable>
                        <Statistic 
                            title="Success Rate" 
                            value={kpiStats.successRate} 
                            suffix="%" 
                            prefix={<TrophyOutlined />}
                            precision={1}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Tabs 
                defaultActiveKey="overview" 
                type="card"
                items={[
                    {
                        key: 'overview',
                        label: 'Overview',
                        children: (
                            <>
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} lg={12}>
                                        <Card title="Performance Trends" extra={<LineChartOutlined />}>
                                            <div style={{ width: '100%', height: '300px' }}>
                                                <Line
                                                    data={mockData.performance}
                                                    xField="month"
                                                    yField="ttc"
                                                    height={300}
                                                    smooth
                                                    color="#1890ff"
                                                    padding="auto"
                                                    autoFit={true}
                                                />
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card title="Negotiation Status Distribution" extra={<PieChartOutlined />}>
                                            <Pie
                                                data={mockData.negotiations}
                                                angleField="count"
                                                colorField="status"
                                                radius={0.8}
                                                height={300}
                                                color={['#52c41a', '#faad14', '#f5222d']}
                                                label={{
                                                    type: 'outer',
                                                    content: '{name} {percentage}'
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                                    <Col xs={24} lg={12}>
                                        <Card title="Method Performance Comparison" extra={<BarChartOutlined />}>
                                            <div style={{ width: '100%', height: '300px' }}>
                                                <Bar
                                                    data={mockData.methods}
                                                    xField="method"
                                                    yField="ttc"
                                                    height={300}
                                                    color="#1890ff"
                                                    padding="auto"
                                                    autoFit={true}
                                                    label={{
                                                        position: 'top' as const
                                                    }}
                                                />
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card title="Stakeholder Engagement" extra={<TeamOutlined />}>
                                            <div style={{ width: '100%', height: '300px' }}>
                                                <Column
                                                    data={mockData.stakeholders}
                                                    xField="role"
                                                    yField="satisfaction"
                                                    height={300}
                                                    color="#52c41a"
                                                    padding="auto"
                                                    autoFit={true}
                                                    label={{
                                                        position: 'top' as const
                                                    }}
                                                />
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )
                    },
                    {
                        key: 'performance',
                        label: 'Performance',
                        children: (
                            <>
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} lg={8}>
                                        <Card title="Time to Consensus" extra={<ClockCircleOutlined />}>
                                            <Gauge
                                                percent={0.85}
                                                range={{
                                                    color: '#30BF78'
                                                }}
                                                indicator={{
                                                    pointer: {
                                                        style: {
                                                            stroke: '#D0D0D0'
                                                        }
                                                    },
                                                    pin: {
                                                        style: {
                                                            stroke: '#D0D0D0'
                                                        }
                                                    }
                                                }}
                                                statistic={{
                                                    content: {
                                                        style: {
                                                            whiteSpace: 'pre-wrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        },
                                                        formatter: () => '38.5s\nAvg TTC'
                                                    }
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={8}>
                                        <Card title="Success Rate" extra={<CheckCircleOutlined />}>
                                            <Liquid
                                                percent={0.892}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={8}>
                                        <Card title="Satisfaction Score" extra={<TrophyOutlined />}>
                                            <Progress
                                                type="circle"
                                                percent={84}
                                                strokeColor={{
                                                    '0%': '#108ee9',
                                                    '100%': '#87d068'
                                                }}
                                                format={percent => `${percent}/10`}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                                    <Col xs={24} lg={12}>
                                        <Card title="Performance Over Time" extra={<RiseOutlined />}>
                                            <Area
                                                data={mockData.performance}
                                                xField="month"
                                                yField="satisfaction"
                                                height={300}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card title="Method Efficiency" extra={<BarChartOutlined />}>
                                            <Scatter
                                                data={mockData.methods}
                                                xField="ttc"
                                                yField="satisfaction"
                                                sizeField="success"
                                                colorField="method"
                                                height={300}
                                                size={[4, 30]}
                                                shape="circle"
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )
                    },
                    {
                        key: 'stakeholders',
                        label: 'Stakeholders',
                        children: (
                            <>
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} lg={12}>
                                        <Card title="Stakeholder Distribution" extra={<PieChartOutlined />}>
                                            <Pie
                                                data={mockData.stakeholders}
                                                angleField="count"
                                                colorField="role"
                                                radius={0.8}
                                                height={300}
                                                color={['#1890ff', '#52c41a', '#faad14', '#f5222d']}
                                                label={{
                                                    type: 'outer',
                                                    content: '{name} {percentage}'
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card title="Engagement vs Satisfaction" extra={<TeamOutlined />}>
                                            <Scatter
                                                data={mockData.stakeholders}
                                                xField="participation"
                                                yField="satisfaction"
                                                sizeField="count"
                                                colorField="role"
                                                height={300}
                                                size={[4, 30]}
                                                shape="circle"
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                                    <Col xs={24}>
                                        <Card title="Stakeholder Performance Matrix" extra={<BarChartOutlined />}>
                                            <Heatmap
                                                data={mockData.stakeholders.map(s => ({
                                                    role: s.name,
                                                    metric: 'Satisfaction',
                                                    value: s.value
                                                }))}
                                                xField="role"
                                                yField="metric"
                                                colorField="value"
                                                height={200}
                                                color={['#f0f0f0', '#1890ff']}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )
                    },
                    {
                        key: 'conflicts',
                        label: 'Conflicts',
                        children: (
                            <>
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} lg={12}>
                                        <Card title="Conflict Types" extra={<WarningOutlined />}>
                                            <Bar
                                                data={mockData.conflicts}
                                                xField="count"
                                                yField="type"
                                                height={300}
                                                color="#f5222d"
                                                label={{
                                                    position: 'middle'
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card title="Resolution Funnel" extra={<Funnel />}>
                                            <Funnel
                                                data={mockData.conflicts}
                                                xField="type"
                                                yField="count"
                                                height={300}
                                                color="#52c41a"
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                                    <Col xs={24}>
                                        <Card title="Conflict Resolution Timeline" extra={<LineChartOutlined />}>
                                            <Line
                                                data={mockData.trends}
                                                xField="week"
                                                yField="conflicts"
                                                height={300}
                                                smooth
                                                color="#f5222d"
                                                point={{
                                                    size: 5
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )
                    },
                    {
                        key: 'trends',
                        label: 'Trends',
                        children: (
                            <>
                                <Row gutter={[24, 24]}>
                                    <Col xs={24}>
                                        <Card title="System Activity Trends" extra={<RiseOutlined />}>
                                            <Line
                                                data={mockData.trends}
                                                xField="week"
                                                yField="proposals"
                                                seriesField="metric"
                                                height={400}
                                                smooth
                                                color={['#1890ff', '#52c41a', '#f5222d']}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                                    <Col xs={24} lg={12}>
                                        <Card title="Method Radar Chart" extra={<Radar />}>
                                            <Radar
                                                data={mockData.methods.slice(0, 4)}
                                                xField="method"
                                                yField="ttc"
                                                height={300}
                                                color="#1890ff"
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card title="Performance Heatmap" extra={<Heatmap />}>
                                            <Heatmap
                                                data={mockData.performance.map(p => ({
                                                    month: p.month,
                                                    metric: 'TTC',
                                                    value: p.ttc
                                                }))}
                                                xField="month"
                                                yField="metric"
                                                colorField="value"
                                                height={300}
                                                color={['#f0f0f0', '#1890ff']}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )
                    }
                ]}
            />
        </div>
    );
};

export default AnalyticsPage;

