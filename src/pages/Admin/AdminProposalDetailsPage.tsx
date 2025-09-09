import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Alert, Breadcrumb, Descriptions, Tag, Row, Col, Empty, Space, Timeline, Avatar, Button, Popconfirm, App } from 'antd';
import { HomeOutlined, FileTextOutlined, CalendarOutlined, InfoCircleOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, LinkOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { getProposalByIdForAdmin, initiateNegotiation, deleteProposal } from '../../services/adminService';
import type { Proposal } from '../../services/proposalService';

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
                            <Card type="inner" title="Full Description"><Paragraph style={{ whiteSpace: 'pre-wrap' }}>{proposal.description}</Paragraph></Card>
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
                                {proposal.status === 'pending' && (
                                    <Popconfirm title="Start Negotiation?" onConfirm={handleInitiate}>
                                        <Button type="primary" icon={<PlayCircleOutlined />}>Initiate Negotiation</Button>
                                    </Popconfirm>
                                )}
                                <Popconfirm title="Delete Proposal?" description="This is permanent." onConfirm={handleDelete}>
                                    <Button danger icon={<DeleteOutlined />}>Delete Proposal</Button>
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
                                <div><Text strong>{proposal.submittedBy.name}</Text><br/><Text type="secondary">{proposal.submittedBy.email}</Text></div>
                            </Space>
                        </Card>
                        {proposal.blockchainStored && (
                             <Card variant="borderless" title="Blockchain Record">
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Status"><Tag icon={<CheckCircleOutlined />} color="success">On-Chain</Tag></Descriptions.Item>
                                    <Descriptions.Item label="Block #">{proposal.blockchainBlockNumber}</Descriptions.Item>
                                    <Descriptions.Item label="Tx Hash">
                                        <Text copyable={{ text: proposal.blockchainTxHash }} style={{ maxWidth: '100%' }}>
                                            <a href={`https://sepolia.etherscan.io/tx/${proposal.blockchainTxHash}`} target="_blank" rel="noopener noreferrer">
                                                {`${proposal.blockchainTxHash?.substring(0, 10)}...`} <LinkOutlined />
                                            </a>
                                        </Text>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        )}
                    </Space>
                </Col>
            </Row>
        </div>
    );
};

export default AdminProposalDetailsPage;
