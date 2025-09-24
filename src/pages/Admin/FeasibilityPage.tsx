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

    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch basic data first
            const [proposalsData, analysesData] = await Promise.all([
                getAllProposals(),
                getAllFeasibilityAnalyses()
            ]);
            
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
            const analysis = await getFeasibilityResults(analysisId);
            setSelectedAnalysis(analysis);
            setModalVisible(true);
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
            render: (proposalId: string) => {
                const proposal = proposals.find(p => p._id === proposalId);
                return proposal ? proposal.title : proposalId.slice(-8);
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
                    <Title level={2}>Feasibility Analysis Management</Title>
                    <Paragraph type="secondary">Analyze proposal feasibility across time, cost, complexity, and resource waste dimensions.</Paragraph>
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
            {summary && (
                <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Total Analyses" 
                                value={summary.totalAnalyses || 0} 
                                prefix={<SearchOutlined />} 
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Avg Feasibility" 
                                value={`${Math.round((summary.averageFeasibility || 0) * 100)}%`} 
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic 
                                title="Critical Issues" 
                                value={summary.criticalIssues || 0} 
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

            {/* Risk Distribution Chart */}
            {summary && (
                <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                    <Col span={24}>
                        <Card title="Risk Level Distribution" extra={<Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>}>
                            <Pie
                                data={[
                                    { level: 'Low', count: summary.riskDistribution?.low || 0 },
                                    { level: 'Medium', count: summary.riskDistribution?.medium || 0 },
                                    { level: 'High', count: summary.riskDistribution?.high || 0 },
                                    { level: 'Critical', count: summary.riskDistribution?.critical || 0 }
                                ]}
                                angleField="count"
                                colorField="level"
                                radius={0.8}
                                height={300}
                                color={['#52c41a', '#faad14', '#f5222d', '#722ed1']}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Critical Issues Alert */}
            {criticalIssues && criticalIssues.length > 0 && (
                <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                    <Col span={24}>
                        <Card title="Critical Issues Requiring Attention" type="inner">
                            <List
                                dataSource={criticalIssues}
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
                width={600}
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
                        name="options"
                        label="Analysis Options"
                    >
                        <Input.TextArea 
                            placeholder="JSON options for analysis thresholds (optional)"
                            rows={3}
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
                width={800}
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
                                        value={`${Math.round(selectedAnalysis.dimensions.timeFeasibility * 100)}%`} 
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Cost Feasibility" 
                                        value={`${Math.round(selectedAnalysis.dimensions.costFeasibility * 100)}%`} 
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Complexity" 
                                        value={`${Math.round(selectedAnalysis.dimensions.complexityFeasibility * 100)}%`} 
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic 
                                        title="Resource Waste" 
                                        value={`${Math.round(selectedAnalysis.dimensions.resourceWaste * 100)}%`} 
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {selectedAnalysis.conflicts.length > 0 && (
                            <Card title="Conflicts" size="small" style={{ marginBottom: '16px' }}>
                                <List
                                    dataSource={selectedAnalysis.conflicts}
                                    renderItem={(conflict, index) => (
                                        <List.Item key={index}>
                                            <List.Item.Meta
                                                title={conflict.type}
                                                description={conflict.description}
                                            />
                                            <Tag color={conflict.severity === 'high' ? 'red' : conflict.severity === 'medium' ? 'orange' : 'green'}>
                                                {conflict.severity}
                                            </Tag>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}

                        {selectedAnalysis.recommendations.length > 0 && (
                            <Card title="Recommendations" size="small">
                                <List
                                    dataSource={selectedAnalysis.recommendations}
                                    renderItem={(recommendation, index) => (
                                        <List.Item key={index}>
                                            <List.Item.Meta
                                                avatar={<InfoCircleOutlined />}
                                                description={recommendation}
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
