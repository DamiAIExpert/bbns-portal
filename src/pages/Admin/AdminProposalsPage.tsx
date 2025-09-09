import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Table, Tag, Space, Button, Typography, Card, Spin, Alert, Input, App, Popconfirm, Tooltip } from 'antd';
import { FileDoneOutlined, SearchOutlined, EyeOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { getAllProposals, deleteProposal, initiateNegotiation } from '../../services/adminService';
import type { Proposal } from '../../services/proposalService';

const { Title, Paragraph } = Typography;

const AdminProposalsPage: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    // Removed 'modal' as it was declared but never read
    const { message } = App.useApp();

    const fetchProposals = useCallback(async () => {
        try {
            setLoading(true);
            const fetchedProposals = await getAllProposals();
            setProposals(fetchedProposals);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    const handleInitiateNegotiation = async (proposalId: string) => {
        try {
            await initiateNegotiation(proposalId);
            message.success('Negotiation has been successfully initiated.');
            fetchProposals(); // Refresh the list to show the updated status
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const handleDelete = async (proposalId: string) => {
        try {
            await deleteProposal(proposalId);
            message.success('Proposal has been deleted.');
            fetchProposals(); // Refresh the list
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            sorter: (a: Proposal, b: Proposal) => a.title.localeCompare(b.title),
        },
        {
            title: 'Submitted By',
            dataIndex: 'submittedBy',
            key: 'submittedBy',
            render: (submittedBy: { name: string; email: string }) => (
                <div>
                    <div>{submittedBy.name}</div>
                    <small>{submittedBy.email}</small>
                </div>
            ),
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
            onFilter: (value: any, record: Proposal) => record.status.indexOf(value) === 0,
            render: (status: Proposal['status']) => {
                const colors: { [key: string]: string } = {
                    pending: 'gold',
                    in_negotiation: 'processing',
                    finalized: 'success',
                    rejected: 'error',
                };
                const formattedStatus = status.replace(/_/g, ' ');
                return <Tag color={colors[status] || 'default'}>{formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}</Tag>;
            },
        },
        {
            title: 'Date Submitted',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
            sorter: (a: Proposal, b: Proposal) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Proposal) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Link to={`/admin/proposals/${record._id}`}>
                            <Button icon={<EyeOutlined />} />
                        </Link>
                    </Tooltip>
                    {record.status === 'pending' && (
                        <Tooltip title="Initiate Negotiation">
                            <Popconfirm
                                title="Start Negotiation?"
                                description="This will move the proposal to the 'in negotiation' phase. Are you sure?"
                                onConfirm={() => handleInitiateNegotiation(record._id)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button icon={<PlayCircleOutlined />} type="primary" ghost />
                            </Popconfirm>
                        </Tooltip>
                    )}
                    <Tooltip title="Delete Proposal">
                        <Popconfirm
                            title="Delete Proposal?"
                            description="This action is permanent and cannot be undone."
                            onConfirm={() => handleDelete(record._id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredProposals = proposals.filter(p =>
        p.title.toLowerCase().includes(searchText.toLowerCase()) ||
        p.submittedBy.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.submittedBy.email.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-inter"> {/* Added basic Tailwind classes */}
            <Title level={2} className="text-gray-800 mb-4 flex items-center">
                <FileDoneOutlined className="mr-3 text-blue-600" /> Proposal Management
            </Title>
            <Paragraph type="secondary" className="text-gray-600 mb-8">Review, manage, and initiate negotiations for all submitted requirements.</Paragraph>
            <Card bordered={false} className="mt-6 rounded-lg shadow-md"> {/* Added Tailwind classes */}
                <Input
                    placeholder="Search by title or submitter..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="mb-6 max-w-sm rounded-md" // Added Tailwind classes
                />
                {loading ? (
                    <div className="text-center py-12"> {/* Added Tailwind classes */}
                        <Spin size="large" />
                    </div>
                ) : error ? (
                    // Changed JSX comment to standard JavaScript comment
                    <Alert message="Error" description={error} type="error" showIcon className="rounded-md" /> // Added Tailwind classes
                ) : (
                    <Table
                        columns={columns}
                        dataSource={filteredProposals.map(p => ({ ...p, key: p._id }))}
                        scroll={{ x: 'max-content' }}
                        className="rounded-lg overflow-hidden" // Added Tailwind classes
                        pagination={{ pageSize: 10 }} // Added pagination
                    />
                )}
            </Card>
        </div>
    );
};

export default AdminProposalsPage;
