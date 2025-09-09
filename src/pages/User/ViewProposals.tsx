import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Grid is imported to help with responsive design.
import { Table, Tag, Space, Button, Typography, Card, Spin, Alert, Empty, Breadcrumb, Input, Grid } from 'antd';
// ADDED: ColumnsType is imported to provide strong typing for the table columns.
import type { ColumnsType } from 'antd/es/table';
import { HomeOutlined, EyeOutlined, SearchOutlined, PlusOutlined, FolderOpenOutlined } from '@ant-design/icons';
// 'Proposal' is a type, so it's imported with the 'type' keyword.
import { getMyProposals } from '../../services/proposalService';
import type { Proposal } from '../../services/proposalService';

const { Title, Paragraph } = Typography;
// The useBreakpoint hook from Ant Design is used to detect screen size.
const { useBreakpoint } = Grid;

const ViewProposals: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');

    // This hook tracks the current screen size.
    const screens = useBreakpoint();
    // A boolean flag to easily check if the screen is mobile-sized.
    const isMobile = !screens.md;

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                setLoading(true);
                const fetchedProposals = await getMyProposals();
                setProposals(fetchedProposals);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProposals();
    }, []);

    // CORRECTED: The columns array is now strongly typed with ColumnsType<Proposal>.
    // This resolves the TypeScript error by ensuring the 'responsive' property's
    // value is correctly interpreted as a Breakpoint[] type, not a generic string[].
    const columns: ColumnsType<Proposal> = [
        {
            title: 'Requirement Title',
            dataIndex: 'title',
            key: 'title',
            sorter: (a: Proposal, b: Proposal) => a.title.localeCompare(b.title),
        },
        {
            title: 'Date Submitted',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
            sorter: (a: Proposal, b: Proposal) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            // This column will be hidden on screens smaller than the 'md' breakpoint.
            responsive: ['md'],
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Pending', value: 'pending' },
                { text: 'In Negotiation', value: 'in_negotiation' },
                { text: 'Finalized', value: 'finalized' },
                { text: 'Rejected', value: 'rejected' },
            ],
            onFilter: (value: any, record: Proposal) => record.status.indexOf(value as string) === 0,
            render: (status: Proposal['status']) => {
                const colors: { [key: string]: string } = {
                    pending: 'gold',
                    in_negotiation: 'processing',
                    finalized: 'success',
                    rejected: 'error',
                };
                const formattedStatus = status ? status.replace(/_/g, ' ') : 'N/A';
                return <Tag color={colors[status] || 'default'}>{formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}</Tag>;
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Proposal) => (
                <Space size="middle">
                    <Link to={`/user/proposals/${record._id}`}>
                        {/* The button text is hidden on mobile to save space. */}
                        <Button icon={<EyeOutlined />}>{!isMobile && 'View Details'}</Button>
                    </Link>
                </Space>
            ),
        },
    ];

    const filteredProposals = proposals.filter(p => 
        p.title.toLowerCase().includes(searchText.toLowerCase())
    );

    const renderContent = () => {
        if (loading) {
            return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
        }
        if (error) {
            return <Alert message="Error" description={error} type="error" showIcon />;
        }
        if (proposals.length === 0) {
            return (
                <Empty
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    description={<span>You haven't submitted any requirements yet.</span>}
                >
                    <Link to="/user/submit-proposal">
                        <Button type="primary" icon={<PlusOutlined />}>Submit Your First Requirement</Button>
                    </Link>
                </Empty>
            );
        }
        return (
             <Table
                columns={columns}
                dataSource={filteredProposals.map(p => ({ ...p, key: p._id }))}
                pagination={{ pageSize: 10 }}
                // Enables horizontal scrolling on the table for small screens.
                scroll={{ x: true }}
            />
        );
    };

    return (
        <div>
            <Breadcrumb
                items={[
                    { href: '/user/dashboard', title: <HomeOutlined /> },
                    { title: 'My Requirements' },
                ]}
                style={{ marginBottom: '24px' }}
            />
            {/* Card padding is adjusted for mobile view. */}
            <Card bordered={false} bodyStyle={{ padding: isMobile ? '16px 0' : '24px' }}>
                {/* The header now stacks vertically on mobile. */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '16px',
                    padding: isMobile ? '0 16px' : '0' // Add horizontal padding on mobile
                }}>
                    <div>
                        {/* Title is smaller and subtitle is hidden on mobile. */}
                        <Title level={isMobile ? 4 : 3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                            <FolderOpenOutlined style={{ marginRight: '12px' }} />
                            My Submitted Requirements
                        </Title>
                        {!isMobile && (
                            <Paragraph type="secondary" style={{ margin: '4px 0 0 36px' }}>
                                Track the status and view details of your submissions.
                            </Paragraph>
                        )}
                    </div>
                     <Input
                        placeholder="Search by title..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        // Search input takes full width on mobile.
                        style={{ width: isMobile ? '100%' : 300 }}
                    />
                </div>
                <div style={{ marginTop: '24px' }}>
                    {renderContent()}
                </div>
            </Card>
        </div>
    );
};

export default ViewProposals;
