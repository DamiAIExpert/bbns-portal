import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Statistic, Spin, Alert, Table, Tag } from 'antd';
import {
    FileDoneOutlined,
    TeamOutlined,
    WarningOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { Bar, Pie } from '@ant-design/plots';
import { getAdminDashboardStats, getAllProposals } from '../../services/adminService';
import type { AdminDashboardStats } from '../../services/adminService';
import type { Proposal } from '../../services/proposalService';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch both stats and the full proposal list to generate charts
                const [statsData, proposalsData] = await Promise.all([
                    getAdminDashboardStats(),
                    getAllProposals()
                ]);

                setStats(statsData);
                setProposals(proposalsData);

            } catch (err: any) {
                console.error("Failed to load admin dashboard data:", err);
                setError(err.message || 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
    }

    if (error) {
        return <Alert message="Error Loading Data" description={error} type="error" showIcon />;
    }

    if (!stats) {
        return <Alert message="No Data" description="Could not retrieve dashboard statistics." type="warning" showIcon />;
    }

    // --- Data processing for the charts ---
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

    const recentProposalsColumns = [
        { title: 'Title', dataIndex: 'title', key: 'title', render: (text: string, record: Proposal) => <Link to={`/admin/proposals/${record._id}`}>{text}</Link> },
        { title: 'Submitted By', dataIndex: ['submittedBy', 'name'], key: 'submitter' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color="blue" style={{textTransform: 'capitalize'}}>{status.replace('_', ' ')}</Tag> },
    ];

    return (
        <div>
            <Title level={2}>Administrator Dashboard</Title>
            <Paragraph type="secondary">A business intelligence overview of the negotiation system.</Paragraph>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24} sm={12} lg={6}><Card variant="borderless"><Statistic title="Total Proposals" value={stats.totalProposals} prefix={<FileDoneOutlined />} /></Card></Col>
                {/* CORRECTED: Using 'activeUsers' from the API response */}
                <Col xs={24} sm={12} lg={6}><Card variant="borderless"><Statistic title="Active Users" value={stats.activeUsers} prefix={<TeamOutlined />} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card variant="borderless"><Statistic title="Total Votes Cast" value={stats.totalVotes} prefix={<CheckCircleOutlined />} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card variant="borderless"><Statistic title="Conflicts Detected" value={stats.conflicts} prefix={<WarningOutlined />} /></Card></Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Proposals by Status" variant="borderless">
                        <Bar data={proposalStatusData} xField="count" yField="status" seriesField="status" legend={{ position: 'top-left' }} height={250} />
                    </Card>
                </Col>
                 <Col xs={24} lg={12}>
                    <Card title="Proposal Status Distribution" variant="borderless">
                        <Pie data={proposalStatusData} angleField="count" colorField="status" radius={0.8} legend={{ position: 'right' }} height={250} />
                    </Card>
                </Col>
            </Row>

            <Row style={{ marginTop: '32px' }}>
                <Col span={24}>
                    <Card title="Recent Activity: Latest Proposals" variant="borderless">
                        <Table
                            dataSource={proposals.slice(0, 5).map(p => ({...p, key: p._id}))}
                            columns={recentProposalsColumns}
                            pagination={false}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
