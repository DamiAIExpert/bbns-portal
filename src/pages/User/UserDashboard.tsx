import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Typography, Statistic, Button, Space, Badge, Table, Tag, Spin, Alert, Empty } from 'antd';
import {
    FileAddOutlined,
    FolderOpenOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    BellOutlined,
    UserOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
// CORRECTED: 'User' and 'Proposal' are types, so we use 'import type'
import type { User } from '../../services/authService';
import type { Proposal } from '../../services/proposalService';

const { Title, Paragraph } = Typography;

// --- TYPE DEFINITIONS ---
interface DashboardStats {
    myTotalProposals: number;
    proposalsInNegotiation: number;
    proposalsFinalized: number;
    notifications: number;
}

type RecentProposal = Pick<Proposal, '_id' | 'title' | 'createdAt' | 'status'>;

const UserDashboard: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [profileRes, proposalsRes] = await Promise.all([
                    api.get<{ user: User }>('/auth/profile'),
                    api.get<{ count: number; proposals: Proposal[] }>('/proposals/my-proposals')
                ]);

                if (profileRes?.data?.user) {
                    setUser(profileRes.data.user);
                }
                
                if (proposalsRes?.data?.proposals) {
                    const allProposals = proposalsRes.data.proposals;
                    
                    const calculatedStats: DashboardStats = {
                        myTotalProposals: proposalsRes.data.count || allProposals.length,
                        proposalsInNegotiation: allProposals.filter(p => p.status === 'in_negotiation').length,
                        proposalsFinalized: allProposals.filter(p => p.status === 'finalized').length,
                        notifications: 0, 
                    };
                    setStats(calculatedStats);
                    setRecentProposals(allProposals.slice(0, 5));
                }

            } catch (err: any) {
                console.error("Failed to fetch dashboard data:", err);
                setError(err.response?.data?.message || "Could not load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 18) greeting = 'Good Afternoon';
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDate = new Date().toLocaleDateString('en-US', options);

    const columns = [
        {
            title: 'Requirement Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: RecentProposal) => <Link to={`/user/proposals/${record._id}`}><strong>{text}</strong></Link>
        },
        {
            title: 'Date Submitted',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: RecentProposal['status']) => {
                const colors: { [key: string]: string } = {
                    pending: 'gold',
                    in_negotiation: 'processing',
                    finalized: 'success',
                    rejected: 'error',
                };
                const formattedStatus = status ? status.replace(/_/g, ' ') : 'N/A';
                return <Tag color={colors[status] || 'default'}>{formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}</Tag>;
            }
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Spin size="large" tip="Loading Dashboard..." />
            </div>
        );
    }

    if (error) {
        return <Alert message="API Error" description={error} type="error" showIcon />;
    }
    
    if (!user || !stats) {
        return <Empty description="Could not load dashboard data. Please try logging out and back in." />;
    }

    return (
        <div>
            <Title level={2}>{greeting}, {user.name || 'User'}!</Title>
            <Paragraph type="secondary">
                Today is {currentDate}. Here is a summary of your activities.
            </Paragraph>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic title="My Total Requirements" value={stats.myTotalProposals} prefix={<FolderOpenOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic title="In Negotiation" value={stats.proposalsInNegotiation} prefix={<SyncOutlined spin={stats.proposalsInNegotiation > 0} />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic title="Finalized / Approved" value={stats.proposalsFinalized} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Badge count={stats.notifications} overflowCount={9}>
                        <Card hoverable style={{ width: '100%' }}>
                            <Statistic title="Notifications" value={stats.notifications > 0 ? ' ' : 'No New'} prefix={<BellOutlined />} />
                        </Card>
                    </Badge>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
                <Col xs={24} lg={16}>
                    <Card title={<Space><HistoryOutlined />My Recent Requirements</Space>}>
                        <Table
                            columns={columns}
                            dataSource={recentProposals.map(p => ({ ...p, key: p._id }))}
                            pagination={{ pageSize: 5 }}
                            locale={{ emptyText: <Empty description="You have not submitted any requirements yet." /> }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Quick Actions">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Link to="/user/submit-proposal" style={{ width: '100%' }}>
                                <Button type="primary" size="large" icon={<FileAddOutlined />} block>
                                    Submit a New Requirement
                                </Button>
                            </Link>
                            <Link to="/user/profile" style={{ width: '100%' }}>
                                <Button size="large" icon={<UserOutlined />} block>
                                    Go to My Profile
                                </Button>
                            </Link>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UserDashboard;
