import React, { useState, useEffect } from 'react';
// CORRECTED: The unused 'Link' component has been removed from this import.
import { useParams } from 'react-router-dom';
import { Card, Typography, Spin, Alert, Breadcrumb, Descriptions, Tag, Row, Col, Empty, Space, Timeline, Avatar } from 'antd';
import { HomeOutlined, FileTextOutlined, CalendarOutlined, InfoCircleOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, LinkOutlined } from '@ant-design/icons';
// CORRECTED: 'Proposal' is a type, so we now use 'import type' to import it.
import { getProposalById } from '../../services/proposalService';
import type { Proposal } from '../../services/proposalService';

const { Title, Paragraph, Text } = Typography;

// --- Helper function to get a relevant icon for each history event ---
const getHistoryIcon = (action: string) => {
    switch (action) {
        case 'submitted':
            return <FileTextOutlined />;
        case 'negotiated':
            return <SyncOutlined spin />;
        case 'finalized':
            return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'rejected':
            return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
        default:
            return <ClockCircleOutlined />;
    }
};

const ProposalDetailsPage: React.FC = () => {
    const { proposalId } = useParams<{ proposalId: string }>();
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (proposalId) {
            const fetchProposalDetails = async () => {
                try {
                    setLoading(true);
                    const fetchedProposal = await getProposalById(proposalId);
                    setProposal(fetchedProposal);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchProposalDetails();
        } else {
            setError("No proposal ID was provided.");
            setLoading(false);
        }
    }, [proposalId]);

    const renderStatusTag = (status: Proposal['status']) => {
        const colors: { [key: string]: string } = {
            pending: 'gold',
            in_negotiation: 'processing',
            finalized: 'success',
            rejected: 'error',
        };
        const formattedStatus = status ? status.replace(/_/g, ' ') : 'N/A';
        return <Tag color={colors[status] || 'default'}>{formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}</Tag>;
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    if (!proposal) {
        return <Empty description="Could not find the specified requirement." />;
    }

    return (
        <div>
            <Breadcrumb
                items={[
                    { href: '/user/dashboard', title: <HomeOutlined /> },
                    { href: '/user/view-proposals', title: 'My Requirements' },
                    { title: 'Requirement Details' },
                ]}
                style={{ marginBottom: '24px' }}
            />
            
            <Row gutter={[24, 24]}>
                {/* Main Content Column */}
                <Col xs={24} lg={16}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card bordered={false}>
                            <Title level={3} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                <FileTextOutlined style={{ marginRight: '12px' }} />
                                {proposal.title}
                            </Title>
                            <Paragraph type="secondary" style={{ marginLeft: '36px' }}>
                                Requirement ID: {proposal._id}
                            </Paragraph>

                            <Card type="inner" title="Full Requirement Description" style={{ marginTop: 24 }}>
                               <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{proposal.description}</Paragraph>
                            </Card>
                        </Card>

                        <Card bordered={false} title="Negotiation History">
                            {proposal.negotiationHistory && proposal.negotiationHistory.length > 0 ? (
                                <Timeline
                                    items={proposal.negotiationHistory.map(event => ({
                                        dot: getHistoryIcon(event.action),
                                        children: (
                                            <>
                                                <Text strong style={{textTransform: 'capitalize'}}>{event.action}</Text>
                                                <Paragraph type="secondary" style={{margin: 0}}>
                                                    {event.details} - <Text italic>{new Date(event.timestamp).toLocaleString()}</Text>
                                                </Paragraph>
                                            </>
                                        ),
                                    }))}
                                />
                            ) : (
                                <Empty description="No negotiation history available yet." />
                            )}
                        </Card>
                    </Space>
                </Col>

                {/* Sidebar Column */}
                <Col xs={24} lg={8}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card bordered={false} title="Details">
                            <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label={<Space><InfoCircleOutlined />Status</Space>}>
                                    {renderStatusTag(proposal.status)}
                                </Descriptions.Item>
                                <Descriptions.Item label={<Space><CalendarOutlined />Submitted On</Space>}>
                                    {new Date(proposal.createdAt).toLocaleDateString()}
                                </Descriptions.Item>
                                 <Descriptions.Item label={<Space><ClockCircleOutlined />Last Updated</Space>}>
                                    {new Date(proposal.updatedAt).toLocaleDateString()}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card bordered={false} title="Submitted By">
                            <Space>
                                <Avatar icon={<UserOutlined />} />
                                <div>
                                    <Text strong>{proposal.submittedBy.name}</Text>
                                    <br/>
                                    <Text type="secondary">{proposal.submittedBy.email}</Text>
                                </div>
                            </Space>
                        </Card>

                        {proposal.blockchainStored && (
                             <Card bordered={false} title="Blockchain Record">
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Status">
                                        <Tag icon={<CheckCircleOutlined />} color="success">Stored On-Chain</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Block Number">
                                        {proposal.blockchainBlockNumber}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Transaction Hash">
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

export default ProposalDetailsPage;
