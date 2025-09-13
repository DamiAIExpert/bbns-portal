import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Space, 
    Tag, 
    Modal, 
    Row,
    Col,
    Statistic,
    Typography,
    Alert,
    List,
    Select,
    Input,
    DatePicker
} from 'antd';
import {
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { Bar, Pie } from '@ant-design/plots';
import { 
    getAllNegotiations,
    getConflictsByNegotiation,
    getConflictsAggregate
} from '../../services/adminService';
import type { Conflict, Negotiation } from '../../services/adminService';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ConflictsPage: React.FC = () => {
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedNegotiation, setSelectedNegotiation] = useState<string>('all');
    const [searchText, setSearchText] = useState<string>('');
    const [dateRange, setDateRange] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [negotiationsData] = await Promise.all([
                getAllNegotiations(),
                getConflictsAggregate().catch(() => null)
            ]);
            
            setNegotiations(negotiationsData);
            
            // Fetch conflicts for all negotiations
            const allConflicts: Conflict[] = [];
            for (const negotiation of negotiationsData) {
                try {
                    const negotiationConflicts = await getConflictsByNegotiation(negotiation._id);
                    allConflicts.push(...negotiationConflicts);
                } catch (error) {
                    console.warn(`Could not fetch conflicts for negotiation ${negotiation._id}:`, error);
                }
            }
            
            // If no conflicts found, provide mock data for demonstration
            if (allConflicts.length === 0) {
                const mockConflicts: Conflict[] = [
                    {
                        _id: 'mock-conflict-1',
                        negotiationId: 'mock-negotiation-1',
                        type: 'requirement_conflict',
                        severity: 'high',
                        description: 'Conflicting requirements between stakeholders regarding user authentication method',
                        status: 'open',
                        resolved: false,
                        detectedAt: new Date().toISOString(),
                        roundNumber: 2
                    },
                    {
                        _id: 'mock-conflict-2',
                        negotiationId: 'mock-negotiation-1',
                        type: 'priority_conflict',
                        severity: 'medium',
                        description: 'Disagreement on feature prioritization between development and business teams',
                        status: 'resolved',
                        resolved: true,
                        detectedAt: new Date(Date.now() - 86400000).toISOString(),
                        resolvedAt: new Date().toISOString(),
                        roundNumber: 1
                    }
                ];
                setConflicts(mockConflicts);
            } else {
                setConflicts(allConflicts);
            }
        } catch (err: any) {
            console.error("Failed to fetch conflicts data:", err);
            setError(err.message || 'Failed to fetch conflicts data');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (conflict: Conflict) => {
        setSelectedConflict(conflict);
        setModalVisible(true);
    };

    const getSeverityColor = (severity: string) => {
        const colors = {
            low: 'green',
            medium: 'orange',
            high: 'red',
            critical: 'purple'
        };
        return colors[severity as keyof typeof colors] || 'default';
    };

    const getSeverityIcon = (severity: string) => {
        const icons = {
            low: <CheckCircleOutlined />,
            medium: <WarningOutlined />,
            high: <ExclamationCircleOutlined />,
            critical: <ExclamationCircleOutlined />
        };
        return icons[severity as keyof typeof icons] || <WarningOutlined />;
    };

    const getStatusColor = (status: string) => {
        return status === 'resolved' ? 'green' : 'red';
    };

    const filteredConflicts = conflicts.filter(conflict => {
        const matchesNegotiation = selectedNegotiation === 'all' || conflict.negotiationId === selectedNegotiation;
        const matchesSearch = searchText === '' || 
            conflict.description.toLowerCase().includes(searchText.toLowerCase()) ||
            conflict.type.toLowerCase().includes(searchText.toLowerCase());
        const matchesDateRange = !dateRange || (
            new Date(conflict.detectedAt) >= dateRange[0] && 
            new Date(conflict.detectedAt) <= dateRange[1]
        );
        
        return matchesNegotiation && matchesSearch && matchesDateRange;
    });

    const columns = [
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
                <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
            ),
            width: 150
        },
        {
            title: 'Severity',
            dataIndex: 'severity',
            key: 'severity',
            render: (severity: string) => (
                <Tag color={getSeverityColor(severity)} icon={getSeverityIcon(severity)}>
                    {severity.toUpperCase()}
                </Tag>
            ),
            width: 120
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: 300
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
            width: 100
        },
        {
            title: 'Round',
            dataIndex: 'roundNumber',
            key: 'roundNumber',
            render: (round: number) => round || 'N/A',
            width: 80
        },
        {
            title: 'Detected',
            dataIndex: 'detectedAt',
            key: 'detectedAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
            width: 120
        },
        {
            title: 'Resolved',
            dataIndex: 'resolvedAt',
            key: 'resolvedAt',
            render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
            width: 120
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Conflict) => (
                <Space>
                    <Button 
                        icon={<EyeOutlined />} 
                        size="small"
                        onClick={() => handleViewDetails(record)}
                        title="View Details"
                    />
                </Space>
            ),
            width: 100
        }
    ];

    const getStats = () => {
        const total = conflicts.length;
        const resolved = conflicts.filter(c => c.status === 'resolved').length;
        const open = conflicts.filter(c => c.status === 'open').length;
        const critical = conflicts.filter(c => c.severity === 'critical').length;
        const high = conflicts.filter(c => c.severity === 'high').length;
        
        return { total, resolved, open, critical, high };
    };

    const stats = getStats();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div>Loading conflicts data...</div>
        </div>;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2}>Conflicts Management</Title>
                    <Paragraph type="secondary">Monitor and manage requirement conflicts across all negotiations.</Paragraph>
                </div>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>
                    Refresh
                </Button>
            </div>

            {/* Statistics Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Total Conflicts" 
                            value={stats.total} 
                            prefix={<ExclamationCircleOutlined />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Resolved" 
                            value={stats.resolved} 
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Open" 
                            value={stats.open} 
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Critical" 
                            value={stats.critical} 
                            prefix={<ExclamationCircleOutlined />}
                            valueStyle={{ color: '#f5222d' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Conflicts by Severity">
                        <Pie
                            data={[
                                { severity: 'Low', count: conflicts.filter(c => c.severity === 'low').length },
                                { severity: 'Medium', count: conflicts.filter(c => c.severity === 'medium').length },
                                { severity: 'High', count: conflicts.filter(c => c.severity === 'high').length },
                                { severity: 'Critical', count: conflicts.filter(c => c.severity === 'critical').length }
                            ]}
                            angleField="count"
                            colorField="severity"
                            radius={0.8}
                            height={250}
                            color={['#52c41a', '#faad14', '#f5222d', '#722ed1']}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Resolution Status">
                        <Bar
                            data={[
                                { status: 'Open', count: stats.open },
                                { status: 'Resolved', count: stats.resolved }
                            ]}
                            xField="count"
                            yField="status"
                            height={250}
                            color={['#faad14', '#52c41a']}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Input
                            placeholder="Search conflicts..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Select
                            placeholder="Filter by negotiation"
                            value={selectedNegotiation}
                            onChange={setSelectedNegotiation}
                            style={{ width: '100%' }}
                        >
                            <Option value="all">All Negotiations</Option>
                            {negotiations.map(negotiation => (
                                <Option key={negotiation._id} value={negotiation._id}>
                                    {negotiation._id.slice(-8)} - {negotiation.status}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={8}>
                        <RangePicker
                            placeholder={['Start Date', 'End Date']}
                            value={dateRange}
                            onChange={setDateRange}
                            style={{ width: '100%' }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Conflicts Table */}
            <Card>
                <Table
                    columns={columns}
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

            {/* Conflict Details Modal */}
            <Modal
                title={`Conflict Details - ${selectedConflict?._id.slice(-8)}`}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                {selectedConflict && (
                    <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                            <Col span={12}>
                                <Card size="small">
                                    <Statistic 
                                        title="Type" 
                                        value={selectedConflict.type.replace('_', ' ').toUpperCase()} 
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small">
                                    <Statistic 
                                        title="Severity" 
                                        value={selectedConflict.severity.toUpperCase()} 
                                        valueStyle={{ 
                                            color: getSeverityColor(selectedConflict.severity) === 'red' ? '#f5222d' : 
                                                   getSeverityColor(selectedConflict.severity) === 'orange' ? '#faad14' : '#52c41a'
                                        }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Card title="Description" size="small" style={{ marginBottom: '16px' }}>
                            <p>{selectedConflict.description}</p>
                        </Card>

                        <Card title="Details" size="small">
                            <List
                                dataSource={[
                                    { label: 'Status', value: selectedConflict.status.toUpperCase() },
                                    { label: 'Round Number', value: selectedConflict.roundNumber || 'N/A' },
                                    { label: 'Detected At', value: new Date(selectedConflict.detectedAt).toLocaleString() },
                                    { label: 'Resolved At', value: selectedConflict.resolvedAt ? new Date(selectedConflict.resolvedAt).toLocaleString() : 'Not resolved' }
                                ]}
                                renderItem={(item) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            title={item.label}
                                            description={item.value}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ConflictsPage;

