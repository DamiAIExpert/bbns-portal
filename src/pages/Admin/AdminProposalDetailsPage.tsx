import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Alert, Breadcrumb, Descriptions, Tag, Row, Col, Empty, Space, Timeline, Avatar, Button, Popconfirm, App, Modal } from 'antd';
import { HomeOutlined, FileTextOutlined, CalendarOutlined, InfoCircleOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, LinkOutlined, PlayCircleOutlined, DeleteOutlined, BarChartOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { getProposalByIdForAdmin, initiateNegotiation, deleteProposal } from '../../services/adminService';
import { getProposalSubmitterPreferences } from '../../services/preferenceService';
import PreferenceElicitation from '../../components/PreferenceElicitation';
import type { Proposal } from '../../services/proposalService';
import type { User } from '../../services/authService';
import type { Preference } from '../../services/preferenceService';

const { Title, Paragraph, Text } = Typography;

// Helper to get a relevant icon for each history event
const getHistoryIcon = (action: string) => {
    switch (action) {
        case 'submitted': return <FileTextOutlined />;
        case 'negotiated': return <SyncOutlined spin />;
        case 'finalized': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'rejected': return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
        default: return <ClockCircleOutlined />;
    }
};

const AdminProposalDetailsPage: React.FC = () => {
    const { proposalId } = useParams<{ proposalId: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showFullDescription, setShowFullDescription] = useState<boolean>(false);
    const [preferenceModalVisible, setPreferenceModalVisible] = useState<boolean>(false);
    const [preferencesModalVisible, setPreferencesModalVisible] = useState<boolean>(false);
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [preferencesLoading, setPreferencesLoading] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        if (proposalId) {
            const fetchDetails = async () => {
                try {
                    setLoading(true);
                    const fetchedProposal = await getProposalByIdForAdmin(proposalId);
                    setProposal(fetchedProposal);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        } else {
            setError("No proposal ID was provided.");
            setLoading(false);
        }
        
        // Load current user
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
            setCurrentUser(storedUser);
        } catch (e) {
            console.error('Error loading user:', e);
        }
    }, [proposalId]);

    const handleInitiate = async () => {
        if (proposal) {
            try {
                await initiateNegotiation(proposal._id);
                message.success('Negotiation initiated successfully.');
                const updatedProposal = await getProposalByIdForAdmin(proposal._id);
                setProposal(updatedProposal);
            } catch (err: any) {
                message.error(err.message);
            }
        }
    };

    const handleDelete = async () => {
        if (proposal) {
            try {
                await deleteProposal(proposal._id);
                message.success('Proposal deleted successfully.');
                navigate('/admin/proposals');
            } catch (err: any) {
                message.error(err.message);
            }
        }
    };

    const handleViewPreferences = async () => {
        if (!proposalId) return;
        
        try {
            setPreferencesLoading(true);
            const response = await getProposalSubmitterPreferences(proposalId);
            
            // This endpoint returns the actual proposal submitter's preferences
            setPreferences(response.preferences);
            setPreferencesModalVisible(true);
        } catch (err: any) {
            message.error(err.message || 'Failed to fetch preferences');
        } finally {
            setPreferencesLoading(false);
        }
    };

    const handleExportPreferences = () => {
        if (!preferences.length) {
            message.warning('No stakeholder preferences to export');
            return;
        }

        const csvContent = generatePreferencesCSV(preferences);
        downloadCSV(csvContent, `stakeholder-preferences-${proposal?.title?.replace(/\s+/g, '-') || 'proposal'}-${new Date().toISOString().split('T')[0]}.csv`);
        message.success('Stakeholder preferences exported successfully');
    };

    const generatePreferencesCSV = (prefs: Preference[]): string => {
        const headers = ['Stakeholder Name', 'Stakeholder Email', 'Stakeholder Role', 'Cost', 'Timeline', 'Quality', 'Usability', 'Security', 'Method', 'Confidence', 'Rationale', 'Submitted Date'];
        
        // Add a note about filtering
        const note = '# This export contains only stakeholder preferences (admin preferences are excluded)';
        
        const rows = prefs.map(pref => {
            const stakeholder = typeof pref.stakeholder === 'string' ? null : pref.stakeholder;
            return [
                stakeholder?.name || 'Unknown',
                stakeholder?.email || 'Unknown',
                stakeholder?.role || 'Unknown',
                (pref.priorities.cost * 100).toFixed(1) + '%',
                (pref.priorities.timeline * 100).toFixed(1) + '%',
                (pref.priorities.quality * 100).toFixed(1) + '%',
                (pref.priorities.usability * 100).toFixed(1) + '%',
                (pref.priorities.security * 100).toFixed(1) + '%',
                pref.method || 'manual',
                ((pref.confidence || 1) * 100).toFixed(1) + '%',
                pref.rationale || '',
                new Date(pref.createdAt || '').toLocaleDateString()
            ];
        });
        
        const csvRows = [
            note,
            headers.map(cell => `"${cell}"`).join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ];
        
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
                                {proposal.summary && (
                                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6f6f6', borderRadius: '6px' }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            💡 {showFullDescription ? 'Showing full description.' : 'This is an AI-generated summary.'} 
                                            <Button type="link" size="small" onClick={() => setShowFullDescription(!showFullDescription)}>
                                                View {showFullDescription ? 'Summary' : 'Full Description'}
                                            </Button>
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        </Card>
                        <Card variant="borderless" title="Negotiation History">
                            {proposal.negotiationHistory?.length > 0 ? (
                                <Timeline items={proposal.negotiationHistory.map(e => ({ dot: getHistoryIcon(e.action), children: (<><Text strong style={{textTransform:'capitalize'}}>{e.action}</Text><Paragraph type="secondary" style={{margin:0}}>{e.details} - <Text italic>{new Date(e.timestamp).toLocaleString()}</Text></Paragraph></>) }))} />
                            ) : <Empty description="No negotiation history available." />}
                        </Card>
                    </Space>
                </Col>
                <Col xs={24} lg={8}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card variant="borderless" title="Admin Actions">
                             <Space direction="vertical" style={{width: '100%'}}>
                                <Button 
                                    type="default" 
                                    icon={<EyeOutlined />}
                                    onClick={handleViewPreferences}
                                    loading={preferencesLoading}
                                    block
                                >
                                    View Preferences
                                </Button>
                                <Button 
                                    type="default" 
                                    icon={<BarChartOutlined />}
                                    onClick={() => setPreferenceModalVisible(true)}
                                    block
                                >
                                    Submit Preferences
                                </Button>
                                {proposal.status === 'pending' && (
                                    <Popconfirm title="Start Negotiation?" onConfirm={handleInitiate}>
                                        <Button type="primary" icon={<PlayCircleOutlined />} block>Initiate Negotiation</Button>
                                    </Popconfirm>
                                )}
                                <Popconfirm title="Delete Proposal?" description="This is permanent." onConfirm={handleDelete}>
                                    <Button danger icon={<DeleteOutlined />} block>Delete Proposal</Button>
                                </Popconfirm>
                            </Space>
                        </Card>
                        <Card variant="borderless" title="Details">
                            <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label={<Space><InfoCircleOutlined />Status</Space>}>{renderStatusTag(proposal.status)}</Descriptions.Item>
                                <Descriptions.Item label={<Space><CalendarOutlined />Submitted</Space>}>{new Date(proposal.createdAt).toLocaleDateString()}</Descriptions.Item>
                                <Descriptions.Item label={<Space><ClockCircleOutlined />Updated</Space>}>{new Date(proposal.updatedAt).toLocaleDateString()}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card variant="borderless" title="Submitted By">
                            <Space>
                                <Avatar icon={<UserOutlined />} />
                                <div>
                                    <Text strong>{proposal.submittedBy.name}</Text>
                                    <br/>
                                    <Text type="secondary" style={{ textTransform: 'capitalize' }}>{proposal.submittedBy.role.replace('_', ' ')}</Text>
                                    <br/>
                                    <Text type="secondary">{proposal.submittedBy.email}</Text>
                                </div>
                            </Space>
                        </Card>
                        <Card variant="borderless" title="Blockchain Record">
                            <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label="Status">
                                    {proposal.blockchainStored ? (
                                        <Tag icon={<CheckCircleOutlined />} color="success">On-Chain</Tag>
                                    ) : (
                                        <Tag icon={<ClockCircleOutlined />} color="warning">Pending Storage</Tag>
                                    )}
                                </Descriptions.Item>
                                {proposal.blockchainStored ? (
                                    <>
                                        <Descriptions.Item label="Block #">{proposal.blockchainBlockNumber}</Descriptions.Item>
                                        <Descriptions.Item label="Tx Hash">
                                            <Text copyable={{ text: proposal.blockchainTxHash }} style={{ maxWidth: '100%' }}>
                                                <a href={`https://sepolia.etherscan.io/tx/${proposal.blockchainTxHash}`} target="_blank" rel="noopener noreferrer">
                                                    {`${proposal.blockchainTxHash?.substring(0, 10)}...`} <LinkOutlined />
                                                </a>
                                            </Text>
                                        </Descriptions.Item>
                                    </>
                                ) : (
                                    <Descriptions.Item label="Network">
                                        <Text type="secondary">Sepolia Testnet</Text>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>
                    </Space>
                </Col>
            </Row>
            
            {/* Preference Elicitation Modal */}
            <Modal
                title="Preference Elicitation"
                open={preferenceModalVisible}
                onCancel={() => setPreferenceModalVisible(false)}
                footer={null}
                width={900}
                destroyOnClose
            >
                {currentUser && proposal && (
                    <PreferenceElicitation
                        proposalId={proposal._id}
                        proposalTitle={proposal.title}
                        user={currentUser}
                        onSuccess={() => {
                            setPreferenceModalVisible(false);
                            message.success('Preferences submitted successfully!');
                        }}
                        onCancel={() => setPreferenceModalVisible(false)}
                    />
                )}
            </Modal>

            {/* Preferences Viewing Modal */}
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
