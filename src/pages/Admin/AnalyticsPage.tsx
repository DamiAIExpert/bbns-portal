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

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const AnalyticsPage: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<any>(null);
    const [selectedMetric, setSelectedMetric] = useState<string>('all');

    // Mock data for demonstration - in real app, this would come from APIs
    const mockData = {
        performance: [
            { month: 'Jan', ttc: 45, satisfaction: 8.2, success: 85 },
            { month: 'Feb', ttc: 38, satisfaction: 8.5, success: 90 },
            { month: 'Mar', ttc: 42, satisfaction: 8.1, success: 88 },
            { month: 'Apr', ttc: 35, satisfaction: 8.7, success: 92 },
            { month: 'May', ttc: 40, satisfaction: 8.3, success: 87 },
            { month: 'Jun', ttc: 33, satisfaction: 8.9, success: 94 }
        ],
        negotiations: [
            { status: 'Completed', count: 45, percentage: 75 },
            { status: 'In Progress', count: 12, percentage: 20 },
            { status: 'Failed', count: 3, percentage: 5 }
        ],
        methods: [
            { method: 'Swing+RoundRobin+NBS', ttc: 35, satisfaction: 8.9, success: 94 },
            { method: 'AHP+Shapley', ttc: 28, satisfaction: 8.2, success: 87 },
            { method: 'AHP+Borda', ttc: 32, satisfaction: 7.8, success: 82 },
            { method: 'AHP+TOPSIS', ttc: 38, satisfaction: 8.1, success: 85 },
            { method: 'Conjoint+Shapley', ttc: 25, satisfaction: 8.5, success: 89 },
            { method: 'Conjoint+Borda', ttc: 30, satisfaction: 7.9, success: 84 },
            { method: 'BWS+Shapley', ttc: 27, satisfaction: 8.3, success: 86 },
            { method: 'BWS+TOPSIS', ttc: 33, satisfaction: 8.0, success: 83 }
        ],
        stakeholders: [
            { role: 'Students', count: 25, satisfaction: 8.2, participation: 85 },
            { role: 'Faculty', count: 15, satisfaction: 8.7, participation: 92 },
            { role: 'IT Staff', count: 8, satisfaction: 8.1, participation: 78 },
            { role: 'Admin', count: 5, satisfaction: 8.5, participation: 90 }
        ],
        conflicts: [
            { type: 'Requirement Conflict', count: 12, resolved: 10, severity: 'high' },
            { type: 'Priority Conflict', count: 8, resolved: 7, severity: 'medium' },
            { type: 'Resource Conflict', count: 5, resolved: 4, severity: 'low' },
            { type: 'Timeline Conflict', count: 3, resolved: 2, severity: 'high' }
        ],
        trends: [
            { week: 'W1', proposals: 5, negotiations: 3, conflicts: 2 },
            { week: 'W2', proposals: 8, negotiations: 6, conflicts: 3 },
            { week: 'W3', proposals: 12, negotiations: 9, conflicts: 4 },
            { week: 'W4', proposals: 15, negotiations: 12, conflicts: 5 },
            { week: 'W5', proposals: 18, negotiations: 15, conflicts: 6 },
            { week: 'W6', proposals: 22, negotiations: 18, conflicts: 7 }
        ]
    };

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, []);

    const getKPIStats = () => ({
        totalProposals: 156,
        activeNegotiations: 23,
        completedNegotiations: 133,
        avgTTC: 38.5,
        avgSatisfaction: 8.4,
        successRate: 89.2,
        conflictResolutionRate: 85.7,
        stakeholderEngagement: 87.3
    });

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

            <Tabs defaultActiveKey="overview" type="card">
                <TabPane tab="Overview" key="overview">
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
                </TabPane>

                <TabPane tab="Performance" key="performance">
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
                </TabPane>

                <TabPane tab="Stakeholders" key="stakeholders">
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
                                        role: s.role,
                                        metric: 'Satisfaction',
                                        value: s.satisfaction
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
                </TabPane>

                <TabPane tab="Conflicts" key="conflicts">
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
                                        size: 5,
                                        shape: 'circle'
                                    }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </TabPane>

                <TabPane tab="Trends" key="trends">
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
                </TabPane>
            </Tabs>
        </div>
    );
};

export default AnalyticsPage;

