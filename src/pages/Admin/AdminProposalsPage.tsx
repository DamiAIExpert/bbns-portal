import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Table, Tag, Space, Button, Typography, Card, Spin, Alert, App, Popconfirm, Tooltip, Modal, Progress, Row, Col, Statistic, Select } from 'antd';
import { FileDoneOutlined, EyeOutlined, DeleteOutlined, PlayCircleOutlined, FileTextOutlined, BarChartOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, LinkOutlined, DownloadOutlined, UndoOutlined, RobotOutlined, CheckOutlined } from '@ant-design/icons';
import { getAllProposals, deleteProposal, initiateNegotiation, summarizeAllProposals, storeAllProposalsOnBlockchain, undoAllElicitation, elicitAllPreferences, markElicitationDone } from '../../services/adminService';
import { extractPreferencesBatch, getExtractionStats, getAdminProposalPreferences } from '../../services/preferenceService';
import { getComprehensiveDashboardData } from '../../services/dashboardService';
import type { Proposal } from '../../services/proposalService';
import type { BlockchainStorageResponse } from '../../services/adminService';

const { Title, Paragraph } = Typography;

const AdminProposalsPage: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [summarizing, setSummarizing] = useState<boolean>(false);
    const [summarizeModalVisible, setSummarizeModalVisible] = useState<boolean>(false);
    const [summarizeProgress, setSummarizeProgress] = useState<number>(0);
    const [summarizeResult, setSummarizeResult] = useState<any>(null);
    const [elicitingPreferences, setElicitingPreferences] = useState<boolean>(false);
    const [preferenceModalVisible, setPreferenceModalVisible] = useState<boolean>(false);
    const [preferenceProgress, setPreferenceProgress] = useState<number>(0);
    const [preferenceResult, setPreferenceResult] = useState<any>(null);
    const [selectedRole, setSelectedRole] = useState<string>('student');
    const [extractionStats, setExtractionStats] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [storingOnBlockchain, setStoringOnBlockchain] = useState<boolean>(false);
    const [blockchainModalVisible, setBlockchainModalVisible] = useState<boolean>(false);
    const [blockchainProgress, setBlockchainProgress] = useState<number>(0);
    const [blockchainResult, setBlockchainResult] = useState<BlockchainStorageResponse | null>(null);
    const [undoingElicitation, setUndoingElicitation] = useState<boolean>(false);
    const [elicitationForAll, setElicitationForAll] = useState<boolean>(false);
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
        loadExtractionStats();
        loadDashboardData();
    }, [fetchProposals]);

    const loadDashboardData = async () => {
        try {
            const data = await getComprehensiveDashboardData();
            setDashboardData(data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const loadExtractionStats = async () => {
        try {
            const stats = await getExtractionStats();
            setExtractionStats(stats);
        } catch (error) {
            console.error('Error loading extraction stats:', error);
        }
    };

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

    const handleBatchSummarize = async () => {
        try {
            setSummarizing(true);
            setSummarizeModalVisible(true);
            setSummarizeProgress(0);
            setSummarizeResult(null);

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setSummarizeProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + Math.random() * 20;
                });
            }, 500);

            const result = await summarizeAllProposals(false, 0, false);

            clearInterval(progressInterval);
            setSummarizeProgress(100);
            setSummarizeResult(result);

            message.success(`Successfully summarized ${result.processed} proposals!`);
            
            // Refresh proposals to show updated summaries
            setTimeout(() => {
                fetchProposals();
                setSummarizeModalVisible(false);
                setSummarizing(false);
            }, 2000);

        } catch (err: any) {
            message.error(err.message || 'Failed to summarize proposals');
            setSummarizing(false);
            setSummarizeModalVisible(false);
        }
    };

    const handleBatchPreferenceElicitation = async () => {
        try {
            setElicitingPreferences(true);
            setPreferenceModalVisible(true);
            setPreferenceProgress(0);
            setPreferenceResult(null);

            // Get all proposal IDs
            const proposalIds = proposals.map(p => p._id);

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setPreferenceProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + Math.random() * 15;
                });
            }, 300);

            const result = await extractPreferencesBatch(proposalIds, {
                userRole: selectedRole,
                forceRegenerate: false
            });

            clearInterval(progressInterval);
            setPreferenceProgress(100);
            setPreferenceResult(result);

            message.success(`Successfully extracted preferences for ${result.summary.successful} proposals!`);
            
            // Refresh stats and proposals
            setTimeout(() => {
                loadExtractionStats();
                fetchProposals();
                setPreferenceModalVisible(false);
                setElicitingPreferences(false);
            }, 2000);

        } catch (err: any) {
            message.error(err.message || 'Failed to extract preferences');
            setElicitingPreferences(false);
            setPreferenceModalVisible(false);
        }
    };

    const handleStoreOnBlockchain = async () => {
        try {
            setStoringOnBlockchain(true);
            setBlockchainModalVisible(true);
            setBlockchainProgress(0);
            setBlockchainResult(null);

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setBlockchainProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + Math.random() * 15;
                });
            }, 300);

            const result = await storeAllProposalsOnBlockchain({
                dryRun: false,
                limit: 1000
            });

            clearInterval(progressInterval);
            setBlockchainProgress(100);
            setBlockchainResult(result);

            message.success(`Successfully stored ${result.successful} proposal IDs on blockchain!`);
            
            // Refresh proposals to get updated blockchain status
            setTimeout(() => {
                fetchProposals();
                setBlockchainModalVisible(false);
                setStoringOnBlockchain(false);
            }, 2000);

        } catch (err: any) {
            message.error(err.message || 'Failed to store proposals on blockchain');
            setStoringOnBlockchain(false);
            setBlockchainModalVisible(false);
        }
    };

    const handleUndoElicitation = async () => {
        try {
            setUndoingElicitation(true);
            
            const result = await undoAllElicitation();
            message.success(result.message);
            
            // Refresh stats and proposals
            loadExtractionStats();
            fetchProposals();
            
        } catch (err: any) {
            message.error(err.message || 'Failed to undo elicitation');
        } finally {
            setUndoingElicitation(false);
        }
    };

    const handleElicitationForAll = async () => {
        try {
            setElicitationForAll(true);
            
            const result = await elicitAllPreferences();
            message.success(`${result.message} - Created ${result.created} preferences from ${result.processed} proposals`);
            
            // Refresh stats and proposals
            loadExtractionStats();
            fetchProposals();
            
        } catch (err: any) {
            message.error(err.message || 'Failed to run elicitation for all proposals');
        } finally {
            setElicitationForAll(false);
        }
    };

    const handleMarkDoneForIndividual = async (proposalId: string) => {
        try {
            const result = await markElicitationDone(proposalId);
            message.success(result.message);
            
            // Refresh proposals
            fetchProposals();
            
        } catch (err: any) {
            message.error(err.message || 'Failed to mark proposal as done');
        }
    };

    const handleBulkExportPreferences = async () => {
        try {
            message.loading('Preparing bulk preference export...', 0);
            
            // Get all proposal IDs
            const proposalIds = proposals.map(p => p._id);
            
            if (proposalIds.length === 0) {
                message.destroy();
                message.warning('No proposals to export');
                return;
            }

            // Fetch preferences for all proposals (backend now filters out admin preferences)
            const allPreferences = [];
            for (const proposalId of proposalIds) {
                try {
                    const prefs = await getAdminProposalPreferences(proposalId);
                    
                    // Backend now filters out admin preferences, so we can use the data directly
                    allPreferences.push(...prefs.map(pref => ({
                        ...pref,
                        proposalTitle: proposals.find(p => p._id === proposalId)?.title || 'Unknown'
                    })));
                } catch (error) {
                    console.warn(`Failed to fetch preferences for proposal ${proposalId}:`, error);
                }
            }

            message.destroy();
            
            if (allPreferences.length === 0) {
                message.warning('No stakeholder preferences found to export (admin preferences are excluded)');
                return;
            }

            // Generate CSV
            const csvContent = generateBulkPreferencesCSV(allPreferences);
            downloadCSV(csvContent, `bulk-stakeholder-preferences-export-${new Date().toISOString().split('T')[0]}.csv`);
            
            message.success(`Successfully exported ${allPreferences.length} stakeholder preferences from ${proposalIds.length} proposals`);
            
        } catch (err: any) {
            message.destroy();
            message.error(err.message || 'Failed to export preferences');
        }
    };

    const generateBulkPreferencesCSV = (prefs: any[]): string => {
        const headers = ['Proposal Title', 'Stakeholder Name', 'Stakeholder Email', 'Stakeholder Role', 'Cost', 'Timeline', 'Quality', 'Usability', 'Security', 'Method', 'Confidence', 'Rationale', 'Submitted Date'];
        
        // Add a note about filtering
        const note = '# This export contains only stakeholder preferences (admin preferences are excluded)';
        
        const rows = prefs.map(pref => {
            const stakeholder = typeof pref.stakeholder === 'string' ? null : pref.stakeholder;
            return [
                pref.proposalTitle || 'Unknown',
                stakeholder?.name || 'Unknown',
                stakeholder?.email || 'Unknown',
                stakeholder?.role || 'Unknown',
                ((pref.priorities?.cost || 0) * 100).toFixed(1) + '%',
                ((pref.priorities?.timeline || 0) * 100).toFixed(1) + '%',
                ((pref.priorities?.quality || 0) * 100).toFixed(1) + '%',
                ((pref.priorities?.usability || 0) * 100).toFixed(1) + '%',
                ((pref.priorities?.security || 0) * 100).toFixed(1) + '%',
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
            title: 'Blockchain',
            dataIndex: 'blockchainStored',
            key: 'blockchainStored',
            filters: [
                { text: 'Stored', value: true },
                { text: 'Pending', value: false },
            ],
            onFilter: (value: any, record: Proposal) => record.blockchainStored === value,
            render: (blockchainStored: boolean, record: Proposal) => {
                if (blockchainStored) {
                    return (
                        <Tooltip title={`Block #${record.blockchainBlockNumber}`}>
                            <Tag icon={<CheckCircleOutlined />} color="success">
                                On-Chain
                            </Tag>
                        </Tooltip>
                    );
                } else {
                    return (
                        <Tag icon={<ClockCircleOutlined />} color="warning">
                            Pending
                        </Tag>
                    );
                }
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
                    <Tooltip title="Mark Elicitation as Done">
                        <Button 
                            icon={<CheckOutlined />} 
                            type="default"
                            onClick={() => handleMarkDoneForIndividual(record._id)}
                        />
                    </Tooltip>
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

    // Note: Filtering is now handled by Ant Design Table's built-in filtering system

    return (
        <div className="bg-gray-50 min-h-screen font-inter">
            {/* Header Section */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <FileDoneOutlined className="text-2xl text-blue-600" />
                    <div>
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                Proposal Management
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">
                                Review, manage, and initiate negotiations for all submitted requirements.
                            </p>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 flex-wrap">
                        <Tooltip title="Remove all existing preferences from all proposals">
                            <Button 
                                type="default" 
                                danger
                                icon={<UndoOutlined />}
                                onClick={handleUndoElicitation}
                                loading={undoingElicitation}
                                size="middle"
                                className="whitespace-nowrap"
                            >
                                Undo Elicitation
                            </Button>
                        </Tooltip>
                        <Tooltip title="Run automated preference elicitation for all proposals">
                            <Button 
                                type="primary" 
                                icon={<RobotOutlined />}
                                onClick={handleElicitationForAll}
                                loading={elicitationForAll}
                                size="middle"
                                className="whitespace-nowrap"
                            >
                                Elicitation for All
                            </Button>
                        </Tooltip>
                        <Tooltip title="Extract preferences from all proposals using AI">
                            <Button 
                                type="default" 
                                icon={<BarChartOutlined />}
                                onClick={handleBatchPreferenceElicitation}
                                loading={elicitingPreferences}
                                size="middle"
                                className="whitespace-nowrap"
                            >
                                Extract All Preferences
                            </Button>
                        </Tooltip>
                        <Tooltip title="Summarize all proposals using AI">
                            <Button 
                                type="default" 
                                icon={<FileTextOutlined />}
                                onClick={handleBatchSummarize}
                                loading={summarizing}
                                size="middle"
                                className="whitespace-nowrap"
                            >
                                Summarize All Proposals
                            </Button>
                        </Tooltip>
                        <Tooltip title="Store all proposal IDs on blockchain for immutability">
                            <Button 
                                type="default" 
                                icon={<LinkOutlined />}
                                onClick={handleStoreOnBlockchain}
                                loading={storingOnBlockchain}
                                size="middle"
                                className="whitespace-nowrap"
                            >
                                Store on Blockchain
                            </Button>
                        </Tooltip>
                        <Tooltip title="Export all preferences from all proposals as CSV">
                            <Button 
                                type="default" 
                                icon={<DownloadOutlined />}
                                onClick={handleBulkExportPreferences}
                                size="middle"
                                className="whitespace-nowrap"
                            >
                                Export All Preferences
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            </div>
            
            {/* Main Content Area */}
            <div className="px-6 py-6">
            {/* Preference Elicitation Statistics */}
            {(extractionStats || dashboardData) && (
                <>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" className="text-center">
                            <Statistic
                                title="Total Preferences"
                                value={dashboardData?.proposalMetrics?.totalProposals || extractionStats?.totalPreferences || 0}
                                prefix={<BarChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" className="text-center">
                            <Statistic
                                title="AI Extractions"
                                value={dashboardData?.proposalMetrics?.processingEfficiency || extractionStats?.extractionMethods?.['nlp-extraction'] || 0}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" className="text-center">
                            <Statistic
                                title="Manual Submissions"
                                value={dashboardData?.stakeholderMetrics?.totalStakeholders || extractionStats?.extractionMethods?.['manual'] || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" className="text-center">
                            <Statistic
                                title="Avg Confidence"
                                value={dashboardData?.negotiationMetrics?.fairnessIndex * 100 || extractionStats?.averageConfidence || 0}
                                suffix="%"
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ color: '#722ed1' }}
                                precision={1}
                            />
                        </Card>
                    </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" className="text-center">
                            <Statistic
                                title="Role-Based Fallbacks"
                                value={extractionStats.extractionMethods?.['role-based-fallback'] || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#fa8c16' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" className="text-center">
                            <Statistic
                                title="NLP Fallbacks"
                                value={extractionStats.extractionMethods?.['nlp-fallback'] || 0}
                                prefix={<FileTextOutlined />}
                                valueStyle={{ color: '#eb2f96' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" className="text-center">
                            <Statistic
                                title="Most Important Criterion"
                                value={Object.keys(extractionStats.criteriaDistribution || {}).length > 0 
                                    ? Object.entries(extractionStats.criteriaDistribution || {})
                                        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'
                                    : 'N/A'
                                }
                                prefix={<BarChartOutlined />}
                                valueStyle={{ color: '#13c2c2' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" className="text-center">
                            <Statistic
                                title="Recent Extractions"
                                value={extractionStats.recentExtractions?.length || 0}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                </Row>
                </>
            )}
            
            {/* Proposals Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Proposals</h2>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Role for extraction:</span>
                        <Select
                            value={selectedRole}
                            onChange={setSelectedRole}
                            style={{ width: 120 }}
                            options={[
                                { value: 'student', label: 'Student' },
                                { value: 'faculty', label: 'Faculty' },
                                { value: 'it_staff', label: 'IT Staff' },
                                { value: 'admin', label: 'Admin' }
                            ]}
                        />
                        </div>
                    </div>
                </div>
                <div className="p-6">
                {loading ? (
                        <div className="text-center py-12">
                        <Spin size="large" />
                    </div>
                ) : error ? (
                        <Alert message="Error" description={error} type="error" showIcon className="rounded-md" />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={proposals.map(p => ({ ...p, key: p._id }))}
                        scroll={{ x: 'max-content' }}
                            pagination={{ 
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} proposals`,
                            }}
                            className="rounded-lg"
                        />
                    )}
                </div>
            </div>

            {/* Batch Summarization Modal */}
            <Modal
                title="Batch Summarization in Progress"
                open={summarizeModalVisible}
                closable={false}
                footer={null}
                width={500}
            >
                <div className="text-center py-6">
                    <FileTextOutlined className="text-4xl text-blue-600 mb-4" />
                    <Title level={4} className="mb-4">Processing Proposals</Title>
                    <Paragraph type="secondary" className="mb-6">
                        AI is analyzing and summarizing all proposals. This may take a few minutes...
                    </Paragraph>
                    
                    <Progress 
                        percent={Math.round(summarizeProgress)} 
                        status={summarizeProgress === 100 ? "success" : "active"}
                        className="mb-4"
                    />
                    
                    {summarizeResult && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <Title level={5} className="text-green-600 mb-2">✅ Summarization Complete!</Title>
                            <Paragraph className="mb-0">
                                Successfully processed <strong>{summarizeResult.processed}</strong> proposals.
                            </Paragraph>
                        </div>
                    )}
                </div>
            </Modal>
            
            {/* Preference Elicitation Modal */}
            <Modal
                title="Batch Preference Extraction in Progress"
                open={preferenceModalVisible}
                closable={false}
                footer={null}
                width={500}
            >
                <div className="text-center py-6">
                    <BarChartOutlined className="text-4xl text-blue-600 mb-4" />
                    <Title level={4} className="mb-4">Extracting Preferences</Title>
                    <Paragraph type="secondary" className="mb-6">
                        AI is analyzing proposal content to extract stakeholder preferences. This may take a few minutes...
                    </Paragraph>
                    
                    <Progress 
                        percent={Math.round(preferenceProgress)} 
                        status={preferenceProgress === 100 ? "success" : "active"}
                        className="mb-4"
                    />
                    
                    {preferenceResult && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <Title level={5} className="text-green-600 mb-2">✅ Extraction Complete!</Title>
                            <Paragraph className="mb-0">
                                Successfully processed <strong>{preferenceResult.summary.successful}</strong> proposals.
                                {preferenceResult.summary.failed > 0 && (
                                    <span className="text-orange-600"> {preferenceResult.summary.failed} failed.</span>
                                )}
                            </Paragraph>
                        </div>
                    )}
                </div>
            </Modal>
            
            {/* Blockchain Storage Modal */}
            <Modal
                title="Storing Proposal IDs on Blockchain"
                open={blockchainModalVisible}
                closable={false}
                footer={null}
                width={500}
            >
                <div className="text-center py-6">
                    <LinkOutlined className="text-4xl text-blue-600 mb-4" />
                    <Title level={4} className="mb-4">Storing on Blockchain</Title>
                    <Paragraph type="secondary" className="mb-6">
                        Storing proposal IDs on blockchain for immutability and research integrity. This may take a few minutes...
                    </Paragraph>
                    
                    <Progress 
                        percent={Math.round(blockchainProgress)} 
                        status={blockchainProgress === 100 ? "success" : "active"}
                        className="mb-4"
                    />
                    
                    {blockchainResult && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <Title level={5} className="text-green-600 mb-2">✅ Blockchain Storage Complete!</Title>
                            <Paragraph className="mb-2">
                                Successfully stored <strong>{blockchainResult.successful}</strong> proposal IDs on blockchain.
                            </Paragraph>
                            {blockchainResult.failed > 0 && (
                                <Paragraph className="text-orange-600 mb-0">
                                    {blockchainResult.failed} proposals failed to store.
                                </Paragraph>
                            )}
                            <div className="mt-2 text-xs text-gray-600">
                                Network: Sepolia | Total Processed: {blockchainResult.processed}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
            </div>
        </div>
    );
};

export default AdminProposalsPage;
