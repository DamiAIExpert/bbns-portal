import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Space, 
    Tag, 
    Modal, 
    Form, 
    Input, 
    Select, 
    message, 
    Row,
    Col,
    Statistic,
    Typography,
    Alert,
    Progress,
    Tooltip,
    List
} from 'antd';
import {
    SearchOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    DownloadOutlined,
    ReloadOutlined,
    EyeOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import { 
    getAllProposals,
    analyzeFeasibility,
    getFeasibilityResults,
    getAllFeasibilityAnalyses,
    getFeasibilitySummary,
    getCriticalFeasibilityIssues,
    exportFeasibilityCSV
} from '../../services/adminService';
import { getComprehensiveDashboardData } from '../../services/dashboardService';
import type { FeasibilityAnalysis, Proposal } from '../../services/adminService';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const FeasibilityPage: React.FC = () => {
    const [feasibilityAnalyses, setFeasibilityAnalyses] = useState<FeasibilityAnalysis[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState<FeasibilityAnalysis | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [analyzeModalVisible, setAnalyzeModalVisible] = useState<boolean>(false);
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [summary, setSummary] = useState<any>(null);
    const [criticalIssues, setCriticalIssues] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);

    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch basic data first
            const [proposalsData, analysesData, dashboardData] = await Promise.all([
                getAllProposals(),
                getAllFeasibilityAnalyses(),
                getComprehensiveDashboardData()
            ]);
            
            setDashboardData(dashboardData);
            
            setProposals(proposalsData);
            // Ensure analysesData is always an array
            setFeasibilityAnalyses(Array.isArray(analysesData) ? analysesData : []);

            // Try to fetch additional data, but don't fail if they don't exist
            try {
                const summaryData = await getFeasibilitySummary();
                setSummary(summaryData);
            } catch (err) {
                console.warn("Could not fetch feasibility summary:", err);
                setSummary(null);
            }

            try {
                const criticalData = await getCriticalFeasibilityIssues();
                setCriticalIssues(criticalData);
            } catch (err) {
                console.warn("Could not fetch critical feasibility issues:", err);
                setCriticalIssues(null);
            }
        } catch (err: any) {
            console.error("Failed to fetch data:", err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeFeasibility = async (values: any) => {
        try {
            setAnalyzing(true);
            await analyzeFeasibility(
                values.proposalId, 
                values.analysisType, 
                values.includeStakeholders,
                values.options || {}
            );
            message.success('Feasibility analysis completed successfully');
            setAnalyzeModalVisible(false);
            form.resetFields();
            // Refresh data after analysis
            await fetchData();
        } catch (err: any) {
            console.error("Failed to analyze feasibility:", err);
            message.error(err.message || 'Failed to analyze feasibility');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleViewDetails = async (analysisId: string) => {
        try {
            // Find the analysis in our existing data instead of making another API call
            const analysis = feasibilityAnalyses.find(a => a._id === analysisId);
            if (analysis) {
            setSelectedAnalysis(analysis);
            setModalVisible(true);
            } else {
                message.error('Analysis not found');
            }
        } catch (err: any) {
            console.error("Failed to fetch analysis details:", err);
            message.error(err.message || 'Failed to fetch analysis details');
        }
    };

    const handleExport = async () => {
        try {
            await exportFeasibilityCSV();
            message.success('Feasibility data exported successfully');
        } catch (err: any) {
            console.error("Failed to export feasibility data:", err);
            message.error(err.message || 'Failed to export feasibility data');
        }
    };

    const getRiskLevelColor = (level: string) => {
        const colors = {
            low: 'green',
            medium: 'orange',
            high: 'red',
            critical: 'purple'
        };
        return colors[level as keyof typeof colors] || 'default';
    };

    const getRiskLevelIcon = (level: string) => {
        const icons = {
            low: <CheckCircleOutlined />,
            medium: <InfoCircleOutlined />,
            high: <WarningOutlined />,
            critical: <ExclamationCircleOutlined />
        };
        return icons[level as keyof typeof icons] || <InfoCircleOutlined />;
    };

    const columns = [
        {
            title: 'Proposal',
            dataIndex: 'proposalId',
            key: 'proposal',
            render: (proposalId: any) => {
                // Handle both object and string formats
                if (typeof proposalId === 'object' && proposalId !== null) {
                    return proposalId.title || proposalId._id?.slice(-8) || 'Unknown Proposal';
                }
                if (typeof proposalId === 'string') {
                const proposal = proposals.find(p => p._id === proposalId);
                return proposal ? proposal.title : proposalId.slice(-8);
                }
                return 'Unknown Proposal';
            },
            width: 200
        },
        {
            title: 'Analysis Type',
            dataIndex: 'analysisType',
            key: 'analysisType',
            render: (type: string) => (
                <Tag color="blue">{type.toUpperCase()}</Tag>
            ),
            width: 120
        },
        {
            title: 'Overall Feasibility',
            dataIndex: 'overallFeasibility',
            key: 'feasibility',
            render: (feasibility: number) => (
                <Progress 
                    percent={Math.round(feasibility * 100)} 
                    size="small" 
                    status={feasibility > 0.7 ? 'success' : feasibility > 0.4 ? 'normal' : 'exception'}
                />
            ),
            width: 150
        },
        {
            title: 'Risk Level',
            dataIndex: 'riskLevel',
            key: 'riskLevel',
            render: (level: string) => (
                <Tag color={getRiskLevelColor(level)} icon={getRiskLevelIcon(level)}>
                    {level.toUpperCase()}
                </Tag>
            ),
            width: 120
        },
        {
            title: 'Conflicts',
            dataIndex: 'conflicts',
            key: 'conflicts',
            render: (conflicts: any[]) => conflicts.length,
            width: 80
        },
        {
            title: 'Stakeholders',
            dataIndex: ['stakeholderAnalysis', 'totalStakeholders'],
            key: 'stakeholders',
            width: 100
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'completed' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
                    {status.toUpperCase()}
                </Tag>
            ),
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
            render: (_: any, record: FeasibilityAnalysis) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button 
                            icon={<EyeOutlined />} 
                            size="small"
                            onClick={() => handleViewDetails(record._id)}
                        />
                    </Tooltip>
                </Space>
            ),
            width: 100
        }
    ];

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div>Loading feasibility data...</div>
        </div>;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2}>Advanced Feasibility Analysis Management</Title>
                    <Paragraph type="secondary">Comprehensive PhD-level feasibility analysis across technical, business, organizational, and research dimensions. Evaluate software requirements feasibility using advanced algorithms and stakeholder consensus metrics.</Paragraph>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>
                        Refresh
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        Export Data
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<PlayCircleOutlined />} 
                        onClick={() => setAnalyzeModalVisible(true)}
                    >
                        Analyze Feasibility
                    </Button>
                </Space>
            </div>

            {/* Summary Statistics */}
            {(summary || dashboardData) && (
                <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Total Analyses" 
                                value={summary?.totalAnalyses || dashboardData?.dashboardStats?.totalProposals || 0} 
                                prefix={<SearchOutlined />} 
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Avg Feasibility" 
                                value={`${Math.round((summary?.averageFeasibility || dashboardData?.negotiationMetrics?.fairnessIndex || 0) * 100)}%`} 
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Critical Issues" 
                                value={summary?.criticalIssues || dashboardData?.negotiationMetrics?.conflictsResolved || 0} 
                                prefix={<ExclamationCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="High Risk Proposals" 
                                value={summary.highRiskProposals || 0} 
                                prefix={<WarningOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Fallback Statistics when summary is not available */}
            {!summary && feasibilityAnalyses.length > 0 && (
                <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Total Analyses" 
                                value={feasibilityAnalyses.length} 
                                prefix={<SearchOutlined />} 
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Avg Feasibility" 
                                value={`${Math.round((feasibilityAnalyses.reduce((sum, a) => sum + a.overallFeasibility, 0) / feasibilityAnalyses.length) * 100)}%`} 
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Critical Issues" 
                                value={feasibilityAnalyses.filter(a => a.riskLevel === 'critical').length} 
                                prefix={<ExclamationCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="High Risk Proposals" 
                                value={feasibilityAnalyses.filter(a => ['high', 'critical'].includes(a.riskLevel)).length} 
                                prefix={<WarningOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Risk Distribution Chart */}
            {(summary || feasibilityAnalyses.length > 0) && (
                <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                    <Col span={24}>
                        <Card title="Risk Level Distribution" extra={<Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>}>
                            <Pie
                                data={summary ? [
                                    { level: 'Low', count: summary.riskDistribution?.low || 0 },
                                    { level: 'Medium', count: summary.riskDistribution?.medium || 0 },
                                    { level: 'High', count: summary.riskDistribution?.high || 0 },
                                    { level: 'Critical', count: summary.riskDistribution?.critical || 0 }
                                ] : [
                                    { level: 'Low', count: feasibilityAnalyses.filter(a => a.riskLevel === 'low').length },
                                    { level: 'Medium', count: feasibilityAnalyses.filter(a => a.riskLevel === 'medium').length },
                                    { level: 'High', count: feasibilityAnalyses.filter(a => a.riskLevel === 'high').length },
                                    { level: 'Critical', count: feasibilityAnalyses.filter(a => a.riskLevel === 'critical').length }
                                ]}
                                angleField="count"
                                colorField="level"
                                radius={0.8}
                                height={300}
                                color={['#52c41a', '#faad14', '#f5222d', '#722ed1']}
                                label={{
                                    type: 'outer',
                                    content: '{name}: {percentage}'
                                }}
                                legend={{
                                    position: 'bottom'
                                }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Critical Issues Alert */}
            {(criticalIssues && criticalIssues.length > 0) || (feasibilityAnalyses.filter(a => a.riskLevel === 'critical').length > 0) && (
                <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                    <Col span={24}>
                        <Card title="Critical Issues Requiring Attention" type="inner">
                            <List
                                dataSource={criticalIssues && criticalIssues.length > 0 ? criticalIssues : 
                                    feasibilityAnalyses.filter(a => a.riskLevel === 'critical').map(analysis => ({
                                        proposalTitle: typeof analysis.proposalId === 'object' ? analysis.proposalId.title : 'Unknown Proposal',
                                        description: `Critical risk analysis with ${Math.round(analysis.overallFeasibility * 100)}% feasibility score`,
                                        severity: 'critical'
                                    }))
                                }
                                renderItem={(issue: any) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
                                            title={issue.proposalTitle}
                                            description={issue.description}
                                        />
                                        <Tag color="red">{issue.severity.toUpperCase()}</Tag>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Feasibility Analyses Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={Array.isArray(feasibilityAnalyses) ? feasibilityAnalyses.map(a => ({ ...a, key: a._id })) : []}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} analyses`
                    }}
                    scroll={{ x: 1200 }}
                />
            </Card>

            {/* Analyze Feasibility Modal */}
            <Modal
                title="Analyze Proposal Feasibility"
                open={analyzeModalVisible}
                onCancel={() => setAnalyzeModalVisible(false)}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAnalyzeFeasibility}
                >
                    <Form.Item
                        name="proposalId"
                        label="Select Proposal"
                        rules={[{ required: true, message: 'Please select a proposal' }]}
                    >
                        <Select placeholder="Choose a proposal">
                            {proposals.map(proposal => (
                                <Option key={proposal._id} value={proposal._id}>
                                    {proposal.title}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="analysisType"
                        label="Analysis Type"
                        initialValue="initial"
                        rules={[{ required: true, message: 'Please select analysis type' }]}
                    >
                        <Select>
                            <Option value="initial">Initial Analysis</Option>
                            <Option value="revision">Revision Analysis</Option>
                            <Option value="final">Final Analysis</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="includeStakeholders"
                        label="Include Stakeholder Analysis"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <input type="checkbox" />
                    </Form.Item>

                    <Form.Item
                        name="includeStakeholders"
                        label="Include Stakeholder Analysis"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <input type="checkbox" />
                    </Form.Item>

                    <Form.Item
                        name="includeTechnicalAnalysis"
                        label="Include Technical Analysis"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <input type="checkbox" />
                    </Form.Item>

                    <Form.Item
                        name="includeBusinessAnalysis"
                        label="Include Business Analysis"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <input type="checkbox" />
                    </Form.Item>

                    <Form.Item
                        name="includeResearchMetrics"
                        label="Include Research Metrics"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <input type="checkbox" />
                    </Form.Item>

                    <Form.Item
                        name="analysisDepth"
                        label="Analysis Depth"
                        initialValue="comprehensive"
                    >
                        <Select>
                            <Option value="basic">Basic Analysis</Option>
                            <Option value="standard">Standard Analysis</Option>
                            <Option value="comprehensive">Comprehensive Analysis</Option>
                            <Option value="research">Research-Grade Analysis</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="options"
                        label="Advanced Options (JSON)"
                    >
                        <Input.TextArea 
                            placeholder={`{
  "timeThreshold": 0.5,
  "costThreshold": 0.5,
  "complexityThreshold": 0.5,
  "technicalThreshold": 0.6,
  "businessThreshold": 0.6,
  "stakeholderThreshold": 0.7,
  "riskWeight": 0.3,
  "feasibilityWeight": 0.7
}`}
                            rows={8}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={analyzing} icon={<PlayCircleOutlined />}>
                                Analyze Feasibility
                            </Button>
                            <Button onClick={() => setAnalyzeModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Analysis Details Modal */}
            <Modal
                title={`Feasibility Analysis Details - ${selectedAnalysis?._id.slice(-8)}`}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={1200}
            >
                {selectedAnalysis && (
                    <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                            <Col span={12}>
                                <Card size="small">
                                    <Statistic 
                                        title="Overall Feasibility" 
                                        value={`${Math.round(selectedAnalysis.overallFeasibility * 100)}%`} 
                                        prefix={<CheckCircleOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small">
                                    <Statistic 
                                        title="Risk Level" 
                                        value={selectedAnalysis.riskLevel.toUpperCase()} 
                                        prefix={getRiskLevelIcon(selectedAnalysis.riskLevel)}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Time Feasibility" 
                                        value={`${Math.round((selectedAnalysis.dimensions.time.score || 0) * 100)}%`} 
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Cost Feasibility" 
                                        value={`${Math.round((selectedAnalysis.dimensions.cost.score || 0) * 100)}%`} 
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Complexity Score" 
                                        value={`${Math.round((selectedAnalysis.dimensions.complexity.score || 0) * 100)}%`} 
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Resource Waste" 
                                        value={`${Math.round((selectedAnalysis.dimensions.resourceWaste.score || 0) * 100)}%`} 
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* Detailed Dimension Analysis */}
                        <Card title="Detailed Dimension Analysis" size="small" style={{ marginBottom: '16px' }}>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Card size="small" title="Time Analysis">
                                        <div><strong>Estimated Duration:</strong> {selectedAnalysis.dimensions.time.estimatedDuration} days</div>
                                        <div><strong>Urgency Level:</strong> {selectedAnalysis.dimensions.time.urgencyLevel}</div>
                                        <div><strong>Issues:</strong> {selectedAnalysis.dimensions.time.issues.length}</div>
                                        <div><strong>Time Conflicts:</strong> {selectedAnalysis.dimensions.time.timeConflicts.length}</div>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card size="small" title="Cost Analysis">
                                        <div><strong>Estimated Cost:</strong> ₦{selectedAnalysis.dimensions.cost.estimatedCost.toLocaleString()}</div>
                                        <div><strong>Cost-Benefit Ratio:</strong> {selectedAnalysis.dimensions.cost.costBenefitRatio.toFixed(2)}</div>
                                        <div><strong>Issues:</strong> {selectedAnalysis.dimensions.cost.issues.length}</div>
                                        <div><strong>Budget Conflicts:</strong> {selectedAnalysis.dimensions.cost.budgetConflicts.length}</div>
                                    </Card>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                                <Col span={12}>
                                    <Card size="small" title="Complexity Analysis">
                                        <div><strong>Complexity Level:</strong> {selectedAnalysis.dimensions.complexity.complexityLevel}</div>
                                        <div><strong>Technical Complexity:</strong> {Math.round(selectedAnalysis.dimensions.complexity.technicalComplexity * 100)}%</div>
                                        <div><strong>Stakeholder Complexity:</strong> {Math.round(selectedAnalysis.dimensions.complexity.stakeholderComplexity * 100)}%</div>
                                        <div><strong>Integration Complexity:</strong> {Math.round(selectedAnalysis.dimensions.complexity.integrationComplexity * 100)}%</div>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card size="small" title="Resource Waste Analysis">
                                        <div><strong>Efficiency Score:</strong> {Math.round(selectedAnalysis.dimensions.resourceWaste.efficiencyScore * 100)}%</div>
                                        <div><strong>Redundancy Level:</strong> {selectedAnalysis.dimensions.resourceWaste.redundancyLevel}</div>
                                        <div><strong>Waste Indicators:</strong> {selectedAnalysis.dimensions.resourceWaste.wasteIndicators.length}</div>
                                        <div><strong>Issues:</strong> {selectedAnalysis.dimensions.resourceWaste.issues.length}</div>
                                    </Card>
                                </Col>
                            </Row>
                        </Card>

                        {/* Analysis Summary */}
                        <Card title="Analysis Summary" size="small" style={{ marginBottom: '16px' }}>
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Statistic 
                                        title="Overall Feasibility" 
                                        value={Math.round((selectedAnalysis.overallFeasibility || 0) * 100)} 
                                        suffix="%" 
                                        valueStyle={{ color: '#52c41a' }}
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic 
                                        title="Risk Level" 
                                        value={selectedAnalysis.riskLevel || 'Unknown'} 
                                        valueStyle={{ 
                                            color: selectedAnalysis.riskLevel === 'low' ? '#52c41a' : 
                                                   selectedAnalysis.riskLevel === 'medium' ? '#faad14' : 
                                                   selectedAnalysis.riskLevel === 'high' ? '#ff7a00' : '#f5222d'
                                        }}
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic 
                                        title="Analysis Type" 
                                        value={selectedAnalysis.analysisType || 'Unknown'} 
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Col>
                            </Row>
                        </Card>

                        {/* Enhanced Stakeholder Analysis */}
                        {selectedAnalysis.stakeholderAnalysis && (
                            <Card title="Stakeholder Analysis" size="small" style={{ marginBottom: '16px' }}>
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Statistic 
                                            title="Total Stakeholders" 
                                            value={selectedAnalysis.stakeholderAnalysis.totalStakeholders || 0} 
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic 
                                            title="Stakeholder Roles" 
                                            value={selectedAnalysis.stakeholderAnalysis.stakeholderRoles.length || 0} 
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic 
                                            title="Participation Level" 
                                            value={Math.round((selectedAnalysis.stakeholderAnalysis.participationLevel || 0) * 100)} 
                                            suffix="%"
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic 
                                            title="Stakeholder Conflicts" 
                                            value={selectedAnalysis.stakeholderAnalysis.stakeholderConflicts.length || 0} 
                                        />
                                    </Col>
                                </Row>
                                
                                {/* Display Stakeholder Roles */}
                                {selectedAnalysis.stakeholderAnalysis.stakeholderRoles.length > 0 && (
                                    <div style={{ marginTop: '16px' }}>
                                        <strong>Detected Roles:</strong>
                                        <div style={{ marginTop: '8px' }}>
                                            {selectedAnalysis.stakeholderAnalysis.stakeholderRoles.map((role, index) => (
                                                <Tag key={index} color="blue" style={{ margin: '2px' }}>
                                                    {role}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Budget Conflicts Analysis */}
                        {selectedAnalysis.dimensions.cost.budgetConflicts && selectedAnalysis.dimensions.cost.budgetConflicts.length > 0 && (
                            <Card title="Budget Conflicts Analysis" size="small" style={{ marginBottom: '16px' }}>
                                <List
                                    dataSource={selectedAnalysis.dimensions.cost.budgetConflicts}
                                    renderItem={(conflict, index) => (
                                        <List.Item key={index}>
                                            <List.Item.Meta
                                                title={conflict.message}
                                                description={
                                                    <div>
                                                        <div><strong>Type:</strong> {conflict.type}</div>
                                                        <div><strong>Severity:</strong> {conflict.severity}</div>
                                                        <div><strong>Impact:</strong> {conflict.impact}</div>
                                                        <div><strong>Resolution:</strong> {conflict.resolution}</div>
                                                        <div><strong>Indicators:</strong> {conflict.indicators.join(', ')}</div>
                                                    </div>
                                                }
                                            />
                                            <Tag color={conflict.severity === 'high' ? 'red' : conflict.severity === 'medium' ? 'orange' : 'green'}>
                                                {conflict.severity.toUpperCase()}
                                            </Tag>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}

                        {/* Waste Events Analysis */}
                        {selectedAnalysis.wasteEvents && selectedAnalysis.wasteEvents.length > 0 && (
                            <Card title="Waste Events Analysis" size="small" style={{ marginBottom: '16px' }}>
                                <List
                                    dataSource={selectedAnalysis.wasteEvents}
                                    renderItem={(event, index) => (
                                        <List.Item key={index}>
                                            <List.Item.Meta
                                                title={`Waste Event #${index + 1}`}
                                                description={`Type: ${event.type}`}
                                            />
                                            <Tag color="orange">WASTE</Tag>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}

                        {selectedAnalysis.conflicts && selectedAnalysis.conflicts.length > 0 && (
                            <Card title="Conflicts Analysis" size="small" style={{ marginBottom: '16px' }}>
                                <List
                                    dataSource={selectedAnalysis.conflicts}
                                    renderItem={(conflict, index) => (
                                        <List.Item key={index}>
                                            <List.Item.Meta
                                                title={conflict.type}
                                                description={conflict.message}
                                            />
                                            <div>
                                            <Tag color={conflict.severity === 'high' ? 'red' : conflict.severity === 'medium' ? 'orange' : 'green'}>
                                                    {conflict.severity.toUpperCase()}
                                            </Tag>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}

                        {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 && (
                            <Card title="Recommendations" size="small">
                                <List
                                    dataSource={selectedAnalysis.recommendations}
                                    renderItem={(recommendation, index) => (
                                        <List.Item key={index}>
                                            <List.Item.Meta
                                                avatar={<InfoCircleOutlined />}
                                                title={recommendation.message}
                                                description={
                                                    <div>
                                                        <div><strong>Category:</strong> {recommendation.category}</div>
                                                        <div><strong>Priority:</strong> {recommendation.priority}</div>
                                                        <div><strong>Actions:</strong> {recommendation.actions.join(', ')}</div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FeasibilityPage;
