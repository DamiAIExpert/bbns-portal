import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Tag, 
    Modal, 
    Row,
    Col,
    Statistic,
    Typography,
    Alert,
    Select,
    Input,
    Tabs,
    Badge,
    Collapse,
    Divider
} from 'antd';
import {
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    SearchOutlined,
    EyeOutlined,
    UserOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { Pie, Column } from '@ant-design/plots';
import { 
    getAllConflicts,
    getProposalsWithConflicts,
} from '../../services/adminService';
import type { Conflict } from '../../services/adminService';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface ProposalWithConflicts {
    proposal: any;
    conflicts: Conflict[];
    stakeholders: any[];
    negotiation: any;
}

interface ConflictSummary {
    totalConflicts: number;
    resolvedConflicts: number;
    openConflicts: number;
    conflictsByType: Record<string, number>;
    conflictsByProposal: number;
}

const ConflictsPage: React.FC = () => {
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [proposalsWithConflicts, setProposalsWithConflicts] = useState<{
        proposalsByRole: Record<string, ProposalWithConflicts[]>;
        conflictSummary: ConflictSummary;
        totalProposalsWithConflicts: number;
    } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [searchText, setSearchText] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [conflictsData, proposalsData] = await Promise.all([
                getAllConflicts(),
                getProposalsWithConflicts()
            ]);
            
            setConflicts(conflictsData);
            setProposalsWithConflicts(proposalsData);
        } catch (err: any) {
            console.error("Failed to fetch conflicts data:", err);
            setError(err.message || 'Failed to fetch conflicts data');
        } finally {
            setLoading(false);
        }
    };

    const handleViewConflict = (conflict: Conflict) => {
        setSelectedConflict(conflict);
        setModalVisible(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'green';
            case 'open': return 'red';
            default: return 'default';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'requirement_conflict': return 'blue';
            case 'resource_conflict': return 'orange';
            case 'timeline_conflict': return 'purple';
            case 'stakeholder_conflict': return 'red';
            default: return 'default';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'red';
            case 'it_staff': return 'blue';
            case 'faculty': return 'green';
            case 'student': return 'orange';
            default: return 'default';
        }
    };

    const filteredConflicts = conflicts.filter(conflict => {
        const matchesStatus = statusFilter === 'all' || conflict.status === statusFilter;
        const matchesType = typeFilter === 'all' || conflict.type === typeFilter;
        const matchesSearch = searchText === '' || 
            conflict.description?.toLowerCase().includes(searchText.toLowerCase()) ||
            conflict.type?.toLowerCase().includes(searchText.toLowerCase());
        
        return matchesStatus && matchesType && matchesSearch;
    });

    const conflictColumns = [
        {
            title: 'ID',
            dataIndex: '_id',
            key: 'id',
            render: (id: string) => id.slice(-8),
            width: 100
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={getTypeColor(type)}>
                    {type?.replace('_', ' ').toUpperCase() || 'Unknown'}
                </Tag>
            ),
            width: 150
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status?.toUpperCase() || 'Unknown'}
                </Tag>
            ),
            width: 100
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: 300
        },
        {
            title: 'Proposal',
            dataIndex: ['proposalId', 'title'],
            key: 'proposal',
            render: (title: string, record: Conflict) => (
                <div>
                    <Text strong>{title || 'N/A'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {(record.proposalId as any)?.status || 'Unknown Status'}
                    </Text>
                </div>
            ),
            width: 200
        },
        {
            title: 'Stakeholders',
            dataIndex: 'stakeholders',
            key: 'stakeholders',
            render: (stakeholders: any[]) => (
                <div>
                    {stakeholders?.slice(0, 2).map((stakeholder, index) => (
                        <Tag key={index} color={getRoleColor(stakeholder.role)}>
                            {stakeholder.name}
                        </Tag>
                    ))}
                    {stakeholders?.length > 2 && (
                        <Tag>+{stakeholders.length - 2}</Tag>
                    )}
                </div>
            ),
            width: 200
        },
        {
            title: 'Detected',
            dataIndex: 'detectedAt',
            key: 'detectedAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
            width: 120
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Conflict) => (
                    <Button 
                    type="link" 
                        icon={<EyeOutlined />} 
                    onClick={() => handleViewConflict(record)}
                >
                    View
                </Button>
            ),
            width: 100
        }
    ];

    const renderProposalsByRole = () => {
        if (!proposalsWithConflicts?.proposalsByRole) return null;

        return Object.entries(proposalsWithConflicts.proposalsByRole).map(([role, proposals]) => (
            <Panel 
                header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>
                        <Badge count={proposals.length} showZero />
                        <Text>Proposals with Conflicts</Text>
                    </div>
                } 
                key={role}
            >
                <Row gutter={[16, 16]}>
                    {proposals.map((item, index) => (
                        <Col xs={24} sm={12} lg={8} key={index}>
                            <Card 
                                size="small"
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileTextOutlined />
                                        <Text ellipsis style={{ maxWidth: '200px' }}>
                                            {item.proposal.title}
                                        </Text>
                                    </div>
                                }
                                extra={
                                    <Badge 
                                        count={item.conflicts.length} 
                                        style={{ backgroundColor: '#ff4d4f' }}
                                    />
                                }
                                actions={[
                                    <Button 
                                        type="link" 
                                        size="small"
                                        onClick={() => {
                                            const firstConflict = item.conflicts[0];
                                            if (firstConflict) handleViewConflict(firstConflict);
                                        }}
                                    >
                                        View Conflicts
                                    </Button>
                                ]}
                            >
                                <div style={{ marginBottom: '8px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        Status: <Tag color={item.proposal.status === 'active' ? 'green' : 'default'}>
                                            {item.proposal.status}
                                        </Tag>
                                    </Text>
                                </div>
                                
                                <div style={{ marginBottom: '8px' }}>
                                    <Text strong style={{ fontSize: '12px' }}>Stakeholders:</Text>
                                    <div style={{ marginTop: '4px' }}>
                                        {item.stakeholders.slice(0, 3).map((stakeholder, idx) => (
                                            <Tag key={idx} color={getRoleColor(stakeholder.role)}>
                                                {stakeholder.name}
                                            </Tag>
                                        ))}
                                        {item.stakeholders.length > 3 && (
                                            <Tag>+{item.stakeholders.length - 3}</Tag>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Text strong style={{ fontSize: '12px' }}>Conflict Types:</Text>
                                    <div style={{ marginTop: '4px' }}>
                                        {Array.from(new Set(item.conflicts.map(c => c.type))).slice(0, 2).map((type, idx) => (
                                            <Tag key={idx} color={getTypeColor(type)}>
                                                {type?.replace('_', ' ')}
                                            </Tag>
                                        ))}
                                        {Array.from(new Set(item.conflicts.map(c => c.type))).length > 2 && (
                                            <Tag>+{Array.from(new Set(item.conflicts.map(c => c.type))).length - 2}</Tag>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Panel>
        ));
    };

    const renderConflictCharts = () => {
        if (!proposalsWithConflicts?.conflictSummary) return null;

        const { conflictSummary } = proposalsWithConflicts;

        // Status distribution chart
        const statusData = [
            { type: 'Resolved', value: conflictSummary.resolvedConflicts },
            { type: 'Open', value: conflictSummary.openConflicts }
        ];

        // Conflict types chart
        const typeData = Object.entries(conflictSummary.conflictsByType).map(([type, count]) => ({
            type: type.replace('_', ' ').toUpperCase(),
            value: count
        }));

        return (
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card title="Conflict Status Distribution" size="small">
                        <Pie
                            data={statusData}
                            angleField="value"
                            colorField="type"
                            radius={0.8}
                            label={{
                                type: 'outer',
                                content: '{name}: {percentage}'
                            }}
                            color={['#52c41a', '#ff4d4f']}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Conflict Types Distribution" size="small">
                        <Column
                            data={typeData}
                            xField="type"
                            yField="value"
                            color="#1890ff"
                            label={{
                                position: 'middle',
                                style: {
                                    fill: '#FFFFFF',
                                    opacity: 0.6
                                }
                            }}
                        />
                    </Card>
                </Col>
            </Row>
        );
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>Conflict Management</Title>
                <Paragraph>
                    Comprehensive view of conflicts across proposals and stakeholder groups. 
                    Monitor conflict resolution progress and identify patterns.
                </Paragraph>
            </div>

            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
            )}

            {/* Summary Statistics */}
            {proposalsWithConflicts?.conflictSummary && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Total Conflicts" 
                                value={proposalsWithConflicts.conflictSummary.totalConflicts}
                            prefix={<ExclamationCircleOutlined />} 
                                valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                                title="Resolved Conflicts"
                                value={proposalsWithConflicts.conflictSummary.resolvedConflicts}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                                title="Open Conflicts"
                                value={proposalsWithConflicts.conflictSummary.openConflicts}
                                prefix={<WarningOutlined />}
                                valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                                title="Proposals with Conflicts"
                                value={proposalsWithConflicts.totalProposalsWithConflicts}
                                prefix={<FileTextOutlined />}
                                valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>
            )}

            <Tabs defaultActiveKey="conflicts">
                <TabPane tab="All Conflicts" key="conflicts">
                    {/* Filters */}
                    <Card style={{ marginBottom: '16px' }}>
                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} sm={8}>
                                <Select
                                    placeholder="Filter by Status"
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    style={{ width: '100%' }}
                                >
                                    <Option value="all">All Status</Option>
                                    <Option value="open">Open</Option>
                                    <Option value="resolved">Resolved</Option>
                                </Select>
                </Col>
                            <Col xs={24} sm={8}>
                                <Select
                                    placeholder="Filter by Type"
                                    value={typeFilter}
                                    onChange={setTypeFilter}
                                    style={{ width: '100%' }}
                                >
                                    <Option value="all">All Types</Option>
                                    <Option value="requirement_conflict">Requirement Conflict</Option>
                                    <Option value="resource_conflict">Resource Conflict</Option>
                                    <Option value="timeline_conflict">Timeline Conflict</Option>
                                    <Option value="stakeholder_conflict">Stakeholder Conflict</Option>
                                </Select>
                </Col>
                    <Col xs={24} sm={8}>
                        <Input
                            placeholder="Search conflicts..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Conflicts Table */}
            <Card>
                <Table
                            columns={conflictColumns}
                    dataSource={filteredConflicts.map(c => ({ ...c, key: c._id }))}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} conflicts`
                    }}
                    scroll={{ x: 1200 }}
                />
            </Card>
                </TabPane>

                <TabPane tab="Proposals by Role" key="proposals">
                    <Card>
                        <Collapse>
                            {renderProposalsByRole()}
                        </Collapse>
                    </Card>
                </TabPane>

                <TabPane tab="Analytics" key="analytics">
                    <Card>
                        {renderConflictCharts()}
                    </Card>
                </TabPane>
            </Tabs>

            {/* Conflict Detail Modal */}
            <Modal
                title="Conflict Details"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={800}
            >
                {selectedConflict && (
                    <div>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text strong>Type:</Text>
                                <br />
                                <Tag color={getTypeColor(selectedConflict.type)}>
                                    {selectedConflict.type?.replace('_', ' ').toUpperCase()}
                                </Tag>
                            </Col>
                            <Col span={12}>
                                <Text strong>Status:</Text>
                                <br />
                                <Tag color={getStatusColor(selectedConflict.status)}>
                                    {selectedConflict.status?.toUpperCase()}
                                </Tag>
                            </Col>
                        </Row>

                        <Divider />

                        <div style={{ marginBottom: '16px' }}>
                            <Text strong>Description:</Text>
                            <br />
                            <Text>{selectedConflict.description}</Text>
                        </div>

                        {selectedConflict.proposalId && (
                            <div style={{ marginBottom: '16px' }}>
                                <Text strong>Proposal:</Text>
                                <br />
                                <Text>{(selectedConflict.proposalId as any)?.title || 'N/A'}</Text>
                            </div>
                        )}

                        {(selectedConflict as any).stakeholders && (selectedConflict as any).stakeholders.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <Text strong>Involved Stakeholders:</Text>
                                <br />
                                <div style={{ marginTop: '8px' }}>
                                    {(selectedConflict as any).stakeholders.map((stakeholder: any, index: number) => (
                                        <Tag key={index} color={getRoleColor(stakeholder.role)}>
                                            <UserOutlined /> {stakeholder.name} ({stakeholder.role})
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text strong>Detected At:</Text>
                                <br />
                                <Text>{new Date(selectedConflict.detectedAt).toLocaleString()}</Text>
                            </Col>
                            {selectedConflict.resolvedAt && (
                                <Col span={12}>
                                    <Text strong>Resolved At:</Text>
                                    <br />
                                    <Text>{new Date(selectedConflict.resolvedAt).toLocaleString()}</Text>
                                </Col>
                            )}
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ConflictsPage;