// src/pages/Admin/AdminProposalDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Alert, Breadcrumb, Descriptions, Tag, Row, Col, Empty, Space, Timeline, Avatar, Button, Popconfirm, App, Modal } from 'antd';
import { HomeOutlined, FileTextOutlined, CalendarOutlined, InfoCircleOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, LinkOutlined, PlayCircleOutlined, DeleteOutlined, BarChartOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { getProposalByIdForAdmin, initiateNegotiation, deleteProposal, getProposalNLPAnalysis } from '../../services/adminService';
import { getProposalSubmitterPreferences, getAdminProposalPreferences } from '../../services/preferenceService';
import { getNegotiationDetails, getNegotiationHistory, getNegotiationStatus } from '../../services/negotiationService';
import PreferenceElicitation from '../../components/PreferenceElicitation';
import NLPAnalysis from '../../components/NLPAnalysis';
import type { Proposal } from '../../services/proposalService';
import type { User } from '../../services/authService';
import type { Preference } from '../../services/preferenceService';

const { Title, Paragraph, Text } = Typography;

interface AdminProposalDetailsPageProps {}

const AdminProposalDetailsPage: React.FC<AdminProposalDetailsPageProps> = () => {
    const { id: proposalId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [negotiationDetails, setNegotiationDetails] = useState<any>(null);
    const [negotiationHistory, setNegotiationHistory] = useState<any[]>([]);
    const [negotiationStatus, setNegotiationStatus] = useState<string>('');
    const [negotiationLoading, setNegotiationLoading] = useState(false);
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [preferencesLoading, setPreferencesLoading] = useState(false);
    const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
    const [allPreferences, setAllPreferences] = useState<Preference[]>([]);
    const [allPreferencesLoading, setAllPreferencesLoading] = useState(false);
    const [allPreferencesModalVisible, setAllPreferencesModalVisible] = useState(false);
    const [nlpAnalysis, setNlpAnalysis] = useState<any>(null);
    const [nlpLoading, setNlpLoading] = useState(false);
    const [nlpError, setNlpError] = useState<string | null>(null);

    useEffect(() => {
        if (proposalId) {
            loadProposalDetails();
        }
    }, [proposalId]);

    const loadProposalDetails = async () => {
        if (!proposalId) return;
        
        try {
            setLoading(true);
            const proposalData = await getProposalByIdForAdmin(proposalId);
            setProposal(proposalData);
        } catch (err: any) {
            setError(err.message || 'Failed to load proposal details');
        } finally {
            setLoading(false);
        }
    };

    const handleInitiateNegotiation = async () => {
        if (!proposalId) return;
        
        try {
            setNegotiationLoading(true);
            await initiateNegotiation(proposalId);
            message.success('Negotiation initiated successfully');
            loadProposalDetails(); // Refresh to show updated status
        } catch (err: any) {
            message.error(err.message || 'Failed to initiate negotiation');
        } finally {
            setNegotiationLoading(false);
        }
    };

    const handleDeleteProposal = async () => {
        if (!proposalId) return;
        
        try {
            await deleteProposal(proposalId);
            message.success('Proposal deleted successfully');
            navigate('/admin/proposals');
        } catch (err: any) {
            message.error(err.message || 'Failed to delete proposal');
        }
    };

    const handleViewSubmitterPreferences = async () => {
        if (!proposalId) return;
        
        try {
            setPreferencesLoading(true);
            const submitterPrefs = await getProposalSubmitterPreferences(proposalId);
            setPreferences(submitterPrefs.preferences || []);
            setPreferencesModalVisible(true);
        } catch (err: any) {
            message.error(err.message || 'Failed to fetch submitter preferences');
        } finally {
            setPreferencesLoading(false);
        }
    };

    const handleViewAllPreferences = async () => {
        if (!proposalId) return;
        
        try {
            setAllPreferencesLoading(true);
            const allPrefs = await getAdminProposalPreferences(proposalId);
            setAllPreferences(allPrefs);
            setAllPreferencesModalVisible(true);
        } catch (err: any) {
            message.error(err.message || 'Failed to fetch all preferences');
        } finally {
            setAllPreferencesLoading(false);
        }
    };

    const loadNLPAnalysis = async () => {
        if (!proposalId) return;
        
        try {
            setNlpLoading(true);
            setNlpError(null);
            const analysis = await getProposalNLPAnalysis(proposalId);
            setNlpAnalysis(analysis.analysis);
        } catch (err: any) {
            setNlpError(err.message || 'Failed to fetch NLP analysis');
            message.error(err.message || 'Failed to fetch NLP analysis');
        } finally {
            setNlpLoading(false);
        }
    };

    const handleExportPreferences = () => {
        if (preferences.length === 0) return;
        
        const csvContent = generateCSVContent(preferences, 'submitter-preferences');
        downloadCSV(csvContent, `proposal-${proposalId}-submitter-preferences.csv`);
    };

    const handleExportAllPreferences = () => {
        if (allPreferences.length === 0) return;
        
        const csvContent = generateCSVContent(allPreferences, 'all-preferences');
        downloadCSV(csvContent, `proposal-${proposalId}-all-preferences.csv`);
    };

    const generateCSVContent = (prefs: Preference[], type: string) => {
        const headers = ['Stakeholder Name', 'Email', 'Role', 'Method', 'Confidence', 'Cost', 'Quality', 'Time', 'Risk', 'Feasibility', 'Rationale', 'Submitted At'];
        const csvRows = [headers.join(',')];
        
        prefs.forEach(pref => {
            const stakeholder = typeof pref.stakeholder === 'string' ? { name: 'Unknown', email: 'Unknown', role: 'Unknown' } : pref.stakeholder;
            const priorities = pref.priorities || {};
            
            const row = [
                `"${stakeholder?.name || 'Unknown'}"`,
                `"${stakeholder?.email || 'Unknown'}"`,
                `"${stakeholder?.role || 'Unknown'}"`,
                `"${pref.method || 'manual'}"`,
                `"${((pref.confidence || 1) * 100).toFixed(1)}%"`,
                `"${((priorities.cost || 0) * 100).toFixed(1)}%"`,
                `"${((priorities.quality || 0) * 100).toFixed(1)}%"`,
                `"${((priorities.time || 0) * 100).toFixed(1)}%"`,
                `"${((priorities.risk || 0) * 100).toFixed(1)}%"`,
                `"${((priorities.feasibility || 0) * 100).toFixed(1)}%"`,
                `"${pref.rationale || ''}"`,
                `"${new Date(pref.createdAt || '').toLocaleString()}"`
            ];
            
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    };

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderStatusTag = (status: Proposal['status']) => {
        const colors: { [key: string]: string } = {
            pending: 'gold', in_negotiation: 'processing',
            finalized: 'success', rejected: 'error',
        };
        const formattedStatus = status ? status.replace(/_/g, ' ') : 'N/A';
        return <Tag color={colors[status] || 'default'}>{formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}</Tag>;
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!proposal) return <Empty description="Could not find the specified requirement." />;

    return (
        <div>
            <Breadcrumb
                items={[
                    { href: '/admin/dashboard', title: <HomeOutlined /> },
                    { href: '/admin/proposals', title: 'Proposals' },
                    { title: 'Proposal Details' },
                ]}
                style={{ marginBottom: '24px' }}
            />
            
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card variant="borderless">
                            <Title level={3}>{proposal.title}</Title>
                            <Paragraph type="secondary">ID: {proposal._id}</Paragraph>
                            <Card type="inner" title="AI Summary">
                                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                    {showFullDescription ? proposal.description : (proposal.summary || proposal.description || 'No summary available.')}
                                </Paragraph>
                                <Button 
                                    type="link" 
                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                    style={{ padding: 0, height: 'auto' }}
                                >
                                    {showFullDescription ? 'Show Summary' : 'Show Full Description'}
                                </Button>
                            </Card>
                        </Card>

                        <Card title="Negotiation Details" extra={<LinkOutlined />}>
                            {negotiationLoading ? (
                                <Spin />
                            ) : negotiationDetails ? (
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Status">
                                        <Tag color="processing">{negotiationStatus}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Participants">
                                        {negotiationDetails.participants?.length || 0} stakeholders
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Started">
                                        {negotiationDetails.createdAt ? new Date(negotiationDetails.createdAt).toLocaleString() : 'N/A'}
                                    </Descriptions.Item>
                                </Descriptions>
                            ) : (
                                <Empty description="No negotiation details available" />
                            )}
                        </Card>

                        <Card title="Negotiation History" extra={<ClockCircleOutlined />}>
                            {negotiationHistory.length > 0 ? (
                                <Timeline
                                    items={negotiationHistory.map((item, index) => ({
                                        children: (
                                            <div>
                                                <Text strong>{item.action}</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </Text>
                                            </div>
                                        ),
                                        color: index === 0 ? 'green' : 'blue'
                                    }))}
                                />
                            ) : (
                                <Empty description="No negotiation history available" />
                            )}
                        </Card>

                        <Card 
                            title="NLP Analysis" 
                            extra={
                                <Button 
                                    type="primary" 
                                    icon={<BarChartOutlined />}
                                    onClick={loadNLPAnalysis}
                                    loading={nlpLoading}
                                >
                                    {nlpAnalysis ? 'Refresh Analysis' : 'Analyze Content'}
                                </Button>
                            }
                        >
                            <NLPAnalysis 
                                analysis={nlpAnalysis} 
                                loading={nlpLoading} 
                                error={nlpError || undefined} 
                            />
                        </Card>
                    </Space>
                </Col>

                <Col xs={24} lg={8}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card title="Details">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Status">
                                    {renderStatusTag(proposal.status)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Submitted">
                                    {proposal.createdAt ? new Date(proposal.createdAt).toLocaleString() : 'N/A'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Submitter">
                                    {proposal.submittedBy?.name || 'Unknown'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Stakeholders">
                                    {proposal.stakeholders?.join(', ') || 'None'}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="Actions">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button 
                                    type="primary" 
                                    icon={<PlayCircleOutlined />}
                                    onClick={handleInitiateNegotiation}
                                    loading={negotiationLoading}
                                    disabled={proposal.status === 'in_negotiation' || proposal.status === 'finalized'}
                                    block
                                >
                                    {proposal.status === 'in_negotiation' ? 'Negotiation in Progress' : 'Initiate Negotiation'}
                                </Button>

                                <Button 
                                    icon={<BarChartOutlined />}
                                    onClick={handleViewSubmitterPreferences}
                                    block
                                >
                                    View Submitter Preferences
                                </Button>

                                <Button 
                                    icon={<EyeOutlined />}
                                    onClick={handleViewAllPreferences}
                                    block
                                >
                                    View All Preferences
                                </Button>

                                <Popconfirm
                                    title="Delete Proposal"
                                    description="Are you sure you want to delete this proposal? This action cannot be undone."
                                    onConfirm={handleDeleteProposal}
                                    okText="Yes, Delete"
                                    cancelText="Cancel"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button 
                                        danger 
                                        icon={<DeleteOutlined />}
                                        block
                                    >
                                        Delete Proposal
                                    </Button>
                                </Popconfirm>
                            </Space>
                        </Card>
                    </Space>
                </Col>
            </Row>

            {/* Submitter Preferences Modal */}
            <Modal
                title={`Proposal Submitter Preferences for "${proposal?.title}"`}
                open={preferencesModalVisible}
                onCancel={() => setPreferencesModalVisible(false)}
                footer={[
                    <Button key="export" icon={<DownloadOutlined />} onClick={handleExportPreferences} disabled={!preferences.length}>
                        Export CSV
                    </Button>,
                    <Button key="close" onClick={() => setPreferencesModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={1000}
                destroyOnClose
            >
                {preferencesLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                    </div>
                ) : preferences.length === 0 ? (
                    <Empty description="No preferences submitted by the proposal submitter yet. This shows preferences from the actual stakeholder who submitted the proposal." />
                ) : (
                    <div>
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>Total Preferences: {preferences.length}</Text>
                            <Space>
                                <Text type="secondary">Methods: </Text>
                                {Object.entries(
                                    preferences.reduce((acc, pref) => {
                                        const method = pref.method || 'manual';
                                        acc[method] = (acc[method] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>)
                                ).map(([method, count]) => (
                                    <Tag key={method} color="blue">{method}: {count}</Tag>
                                ))}
                            </Space>
                        </div>
                        
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {preferences.map((pref, index) => (
                                <Card key={pref._id || index} size="small" style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div>
                                            <Text strong>{(typeof pref.stakeholder === 'string' ? 'Unknown User' : pref.stakeholder?.name) || 'Unknown User'}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {(typeof pref.stakeholder === 'string' ? 'Unknown' : pref.stakeholder?.email) || 'Unknown'} • {(typeof pref.stakeholder === 'string' ? 'Unknown' : pref.stakeholder?.role?.replace('_', ' ')) || 'Unknown'}
                                            </Text>
                                        </div>
                                        <Space>
                                            <Tag color="green">{pref.method || 'manual'}</Tag>
                                            <Tag color="blue">{((pref.confidence || 1) * 100).toFixed(1)}% confidence</Tag>
                                        </Space>
                                    </div>
                                    
                                    <Row gutter={16}>
                                        {Object.entries(pref.priorities).map(([criterion, value]) => (
                                            <Col span={4} key={criterion}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <Text type="secondary" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                                                        {criterion}
                                                    </Text>
                                                    <br />
                                                    <Text strong style={{ fontSize: '14px' }}>
                                                        {(value * 100).toFixed(1)}%
                                                    </Text>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                    
                                    {pref.rationale && (
                                        <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6f6f6', borderRadius: 4 }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                <strong>Rationale:</strong> {pref.rationale}
                                            </Text>
                                        </div>
                                    )}

                                    {/* Elicitation Context Section */}
                                    {(pref.originalProposalText || pref.aiSummary || pref.elicitationContext) && (
                                        <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 6, border: '1px solid #d6e4ff' }}>
                                            <Text strong style={{ fontSize: '13px', color: '#1890ff', marginBottom: 8, display: 'block' }}>
                                                🔍 Elicitation Context & Traceability
                                            </Text>
                                            
                                            {pref.originalProposalText && (
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>Original Proposal Text:</Text>
                                                    <div style={{ marginTop: 4, padding: 8, backgroundColor: 'white', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                                                        <Text style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                                            {pref.originalProposalText}
                                                        </Text>
                                                    </div>
                                                </div>
                                            )}

                                            {pref.aiSummary && (
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>AI Analysis Summary:</Text>
                                                    <div style={{ marginTop: 4, padding: 8, backgroundColor: 'white', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                                                        <Text style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                                            {pref.aiSummary}
                                                        </Text>
                                                    </div>
                                                </div>
                                            )}

                                            {pref.elicitationContext && (
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>Analysis Details:</Text>
                                                    <div style={{ marginTop: 4, padding: 8, backgroundColor: 'white', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                                                        <Row gutter={[8, 4]}>
                                                            {pref.elicitationContext.analysisMethod && (
                                                                <Col span={12}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Method:</strong> {pref.elicitationContext.analysisMethod}
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                            {pref.elicitationContext.stakeholderRole && (
                                                                <Col span={12}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Role:</strong> {pref.elicitationContext.stakeholderRole}
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                            {pref.elicitationContext.sentimentScore !== undefined && (
                                                                <Col span={12}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Sentiment:</strong> {(pref.elicitationContext.sentimentScore * 100).toFixed(1)}%
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                            {pref.elicitationContext.complexityScore !== undefined && (
                                                                <Col span={12}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Complexity:</strong> {(pref.elicitationContext.complexityScore * 100).toFixed(1)}%
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                            {pref.elicitationContext.extractedKeywords && pref.elicitationContext.extractedKeywords.length > 0 && (
                                                                <Col span={24}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Keywords:</strong> {pref.elicitationContext.extractedKeywords.join(', ')}
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                        </Row>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div style={{ marginTop: 8, textAlign: 'right' }}>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            Submitted: {new Date(pref.createdAt || '').toLocaleString()}
                                        </Text>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>

            {/* All Preferences Modal */}
            <Modal
                title={`All Preferences for "${proposal?.title}"`}
                open={allPreferencesModalVisible}
                onCancel={() => setAllPreferencesModalVisible(false)}
                footer={[
                    <Button key="export" icon={<DownloadOutlined />} onClick={handleExportAllPreferences} disabled={!allPreferences.length}>
                        Export CSV
                    </Button>,
                    <Button key="close" onClick={() => setAllPreferencesModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={1000}
                destroyOnClose
            >
                {allPreferencesLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                    </div>
                ) : allPreferences.length === 0 ? (
                    <Empty description="No preferences submitted for this proposal yet." />
                ) : (
                    <div>
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>Total Preferences: {allPreferences.length}</Text>
                            <Space>
                                <Text type="secondary">Methods: </Text>
                                {Object.entries(
                                    allPreferences.reduce((acc, pref) => {
                                        const method = pref.method || 'manual';
                                        acc[method] = (acc[method] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>)
                                ).map(([method, count]) => (
                                    <Tag key={method} color="blue">{method}: {count}</Tag>
                                ))}
                            </Space>
                        </div>
                        
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {allPreferences.map((pref, index) => (
                                <Card key={pref._id || index} size="small" style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div>
                                            <Text strong>{(typeof pref.stakeholder === 'string' ? 'Unknown User' : pref.stakeholder?.name) || 'Unknown User'}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {(typeof pref.stakeholder === 'string' ? 'Unknown' : pref.stakeholder?.email) || 'Unknown'} • {(typeof pref.stakeholder === 'string' ? 'Unknown' : pref.stakeholder?.role?.replace('_', ' ')) || 'Unknown'}
                                            </Text>
                                        </div>
                                        <Space>
                                            <Tag color="green">{pref.method || 'manual'}</Tag>
                                            <Tag color="blue">{((pref.confidence || 1) * 100).toFixed(1)}% confidence</Tag>
                                        </Space>
                                    </div>
                                    
                                    <Row gutter={16}>
                                        {Object.entries(pref.priorities).map(([criterion, value]) => (
                                            <Col span={4} key={criterion}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <Text type="secondary" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                                                        {criterion}
                                                    </Text>
                                                    <br />
                                                    <Text strong style={{ fontSize: '14px' }}>
                                                        {(value * 100).toFixed(1)}%
                                                    </Text>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                    
                                    {pref.rationale && (
                                        <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6f6f6', borderRadius: 4 }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                <strong>Rationale:</strong> {pref.rationale}
                                            </Text>
                                        </div>
                                    )}

                                    {/* Elicitation Context Section */}
                                    {(pref.originalProposalText || pref.aiSummary || pref.elicitationContext) && (
                                        <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 6, border: '1px solid #d6e4ff' }}>
                                            <Text strong style={{ fontSize: '13px', color: '#1890ff', marginBottom: 8, display: 'block' }}>
                                                🔍 Elicitation Context & Traceability
                                            </Text>
                                            
                                            {pref.originalProposalText && (
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>Original Proposal Text:</Text>
                                                    <div style={{ marginTop: 4, padding: 8, backgroundColor: 'white', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                                                        <Text style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                                            {pref.originalProposalText}
                                                        </Text>
                                                    </div>
                                                </div>
                                            )}

                                            {pref.aiSummary && (
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>AI Analysis Summary:</Text>
                                                    <div style={{ marginTop: 4, padding: 8, backgroundColor: 'white', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                                                        <Text style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                                            {pref.aiSummary}
                                                        </Text>
                                                    </div>
                                                </div>
                                            )}

                                            {pref.elicitationContext && (
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>Analysis Details:</Text>
                                                    <div style={{ marginTop: 4, padding: 8, backgroundColor: 'white', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                                                        <Row gutter={[8, 4]}>
                                                            {pref.elicitationContext.analysisMethod && (
                                                                <Col span={12}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Method:</strong> {pref.elicitationContext.analysisMethod}
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                            {pref.elicitationContext.stakeholderRole && (
                                                                <Col span={12}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Role:</strong> {pref.elicitationContext.stakeholderRole}
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                            {pref.elicitationContext.sentimentScore !== undefined && (
                                                                <Col span={12}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Sentiment:</strong> {(pref.elicitationContext.sentimentScore * 100).toFixed(1)}%
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                            {pref.elicitationContext.complexityScore !== undefined && (
                                                                <Col span={12}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Complexity:</strong> {(pref.elicitationContext.complexityScore * 100).toFixed(1)}%
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                            {pref.elicitationContext.extractedKeywords && pref.elicitationContext.extractedKeywords.length > 0 && (
                                                                <Col span={24}>
                                                                    <Text style={{ fontSize: '11px' }}>
                                                                        <strong>Keywords:</strong> {pref.elicitationContext.extractedKeywords.join(', ')}
                                                                    </Text>
                                                                </Col>
                                                            )}
                                                        </Row>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div style={{ marginTop: 8, textAlign: 'right' }}>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            Submitted: {new Date(pref.createdAt || '').toLocaleString()}
                                        </Text>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminProposalDetailsPage;