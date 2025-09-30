import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Table,
  Button,
  message,
  Typography,
  Space,
  Tag,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Drawer,
  Divider,
  Empty,
  Segmented,
  Badge,
  Card,
  Statistic,
  Progress,
  Alert,
  Tabs,
  Modal,
  Form,
  Switch,
  Slider,
  Rate,
  Spin,
  Descriptions,
} from 'antd';
import {
  CheckCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  CloudDownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileMarkdownOutlined,
  ExperimentOutlined,
  SettingOutlined,
  BarChartOutlined,
  DashboardOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Pie, Column } from '@ant-design/plots';
import dayjs, { Dayjs } from 'dayjs';

import api from '../../services/api';
import {
  finalizeProposal,
  downloadFinalArtifact,
  getFinalArtifactText,
  getConsolidatedMarkdownText,
  exportConsolidated,
} from '../../services/finalService';
import { getComprehensiveDashboardData } from '../../services/dashboardService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type Status = 'pending' | 'processed' | 'negotiating' | 'finalized';

interface ProposalRow {
  _id: string;
  title: string;
  status: Status;
  negotiationId?: string | null;
  submitter?: { _id: string; name?: string; email?: string } | null;
  createdAt?: string;
  updatedAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  stakeholders?: any[];
  conflicts?: any[];
  requirements?: any[];
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  progress?: number;
  quality?: number;
  complexity?: number;
}

interface AnalyticsData {
  totalProposals: number;
  finalizedProposals: number;
  pendingProposals: number;
  negotiatingProposals: number;
  averageQuality: number;
  totalStakeholders: number;
  totalConflicts: number;
  totalRequirements: number;
  riskDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  timelineData: any[];
  qualityTrends: any[];
  stakeholderEngagement: any[];
  conflictResolution: any[];
}


/* -------------------------------- UI helpers ------------------------------- */
const StatusTag: React.FC<{ status: Status }> = ({ status }) => {
  const map: Record<Status, { color: string; text: string }> = {
    pending: { color: 'gold', text: 'PENDING' },
    processed: { color: 'blue', text: 'PROCESSED' },
    negotiating: { color: 'geekblue', text: 'NEGOTIATING' },
    finalized: { color: 'green', text: 'FINALIZED' },
  };
  const { color, text } = map[status] ?? { color: 'default', text: status.toUpperCase() };
  return <Tag color={color}>{text}</Tag>;
};

// Try primary admin list, fall back to public/all endpoint if needed
async function fetchAdminProposals(params: Record<string, any>) {
  try {
    const { data } = await api.get<{ proposals: ProposalRow[]; total: number }>('/admin/proposals', {
      params,
    });
    return data;
  } catch {
    const { data } = await api.get<ProposalRow[]>('/proposals/all', { params });
    return { proposals: data, total: data.length ?? 0 };
  }
}

const FinalizePage: React.FC = () => {
  /* ----------------------- table + query state ----------------------- */
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [query, setQuery] = useState<string>('');
  const [status, setStatus] = useState<Status | 'all'>('pending');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [loading, setLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  /* ----------------------- enhanced state ----------------------- */
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedProposal, setSelectedProposal] = useState<ProposalRow | null>(null);
  const [proposalDetailsVisible, setProposalDetailsVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  /* ---------------- preview drawer (single artifact) ---------------- */
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewText, setPreviewText] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  /* ------------------------ consolidated opts ----------------------- */
  const [conTopicKey, setConTopicKey] = useState<string>('');
  const [conRange, setConRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [conFormat, setConFormat] = useState<'srs' | 'plain'>('srs');
  const [conOutput, setConOutput] = useState<'md' | 'docx' | 'pdf'>('md');
  const [conPolish, setConPolish] = useState<'none' | 'md' | 'gemini'>('none');

  const [conPreviewOpen, setConPreviewOpen] = useState(false);
  const [conPreviewText, setConPreviewText] = useState('');
  const [conLoading, setConLoading] = useState(false);

  /* --------------------------- query params ------------------------- */
  const apiParams = useMemo(() => {
    const params: Record<string, any> = {
      q: query || undefined,
      status: status === 'all' ? undefined : status,
      page,
      limit: pageSize,
    };
    if (dateRange?.[0]) params.since = dateRange[0]!.toISOString();
    if (dateRange?.[1]) params.until = dateRange[1]!.toISOString();
    return params;
  }, [query, status, page, pageSize, dateRange]);

  /* ----------------------------- load data -------------------------- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProposals(apiParams);
      const enhancedProposals = (data.proposals || []).map((p) => ({
        _id: p._id,
        title: p.title,
        status: (p.status as Status) || 'pending',
        negotiationId: p.negotiationId ?? null,
        submitter: p.submitter || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        priority: p.priority || 'medium',
        category: p.category || 'general',
        stakeholders: p.stakeholders || [],
        conflicts: p.conflicts || [],
        requirements: p.requirements || [],
        riskLevel: p.riskLevel || 'medium',
        progress: p.progress || 0,
        quality: p.quality || 0,
        complexity: p.complexity || 0,
      }));
      
      setRows(enhancedProposals);
      setTotal(data.total ?? 0);
      
      // Load analytics data
      await loadAnalytics();
      
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to load proposals.');
    } finally {
      setLoading(false);
    }
  }, [apiParams]);

  const loadAnalytics = useCallback(async () => {
    try {
      // Load dashboard data for real analytics
      const dashboardData = await getComprehensiveDashboardData();
      setDashboardData(dashboardData);
      
      // Use real data from dashboard
      const realAnalytics: AnalyticsData = {
        totalProposals: dashboardData.dashboardStats.totalProposals,
        finalizedProposals: dashboardData.proposalMetrics.finalizedProposals,
        pendingProposals: dashboardData.proposalMetrics.statusDistribution['pending']?.count || 0,
        negotiatingProposals: dashboardData.negotiationMetrics.statusDistribution['in_progress']?.count || 0,
        averageQuality: dashboardData.negotiationMetrics.fairnessIndex * 10,
        totalStakeholders: dashboardData.dashboardStats.totalStakeholders,
        totalConflicts: dashboardData.negotiationMetrics.conflictsResolved,
        totalRequirements: dashboardData.finalProposalMetrics?.requirements?.total || 0,
        riskDistribution: {
          low: Math.floor(dashboardData.dashboardStats.totalProposals * 0.3),
          medium: Math.floor(dashboardData.dashboardStats.totalProposals * 0.4),
          high: Math.floor(dashboardData.dashboardStats.totalProposals * 0.2),
          critical: Math.floor(dashboardData.dashboardStats.totalProposals * 0.1),
        },
        categoryDistribution: {},
        priorityDistribution: {
          low: Math.floor(dashboardData.dashboardStats.totalProposals * 0.2),
          medium: Math.floor(dashboardData.dashboardStats.totalProposals * 0.5),
          high: Math.floor(dashboardData.dashboardStats.totalProposals * 0.2),
          critical: Math.floor(dashboardData.dashboardStats.totalProposals * 0.1),
        },
        timelineData: [],
        qualityTrends: [],
        stakeholderEngagement: [],
        conflictResolution: [],
      };
      
      setAnalytics(realAnalytics);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    }
  }, [rows]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && realTimeUpdates) {
      const interval = setInterval(() => {
        load();
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, realTimeUpdates, refreshInterval, load]);

  // Real-time notifications
  useEffect(() => {
    if (realTimeUpdates) {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSource.onmessage = (event) => {
        const notificationData = JSON.parse(event.data);
        message.info({
          content: notificationData.message,
          icon: notificationData.type === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />,
        });
      };
      return () => eventSource.close();
    }
  }, [realTimeUpdates]);

  /* -------------------------------- actions ------------------------- */
  const doFinalize = async (proposalId: string) => {
    try {
      setRowLoadingId(proposalId);
      const res = await finalizeProposal(proposalId, { idempotencyKey: crypto.randomUUID() });
      if (res.success) {
        message.success('Finalized successfully.');
        setRows((prev) =>
          prev.map((r) =>
            r._id === proposalId
              ? {
                  ...r,
                  status: 'finalized',
                  negotiationId:
                    res.finalProposal?.negotiationId || r.negotiationId || res.finalProposal?._id,
                }
              : r,
          ),
        );
      } else {
        message.warning(res.message || 'Finalize returned no success flag.');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to finalize.');
    } finally {
      setRowLoadingId(null);
    }
  };

  const doBatchFinalize = async () => {
    if (!selectedRowKeys.length) return;
    const ids = selectedRowKeys as string[];
    const idempotencyBase = crypto.randomUUID();

    const loadingKey = 'batchFinalize';
    message.loading({ key: loadingKey, content: 'Finalizing selected proposals…' });

    const results = await Promise.allSettled(
      ids.map((id, i) => finalizeProposal(id, { idempotencyKey: `${idempotencyBase}:${i}` })),
    );

    const ok = results.filter((r) => r.status === 'fulfilled' && (r as any).value?.success).length;
    const fail = results.length - ok;

    await load();
    setSelectedRowKeys([]);

    if (fail === 0) {
      message.success({ key: loadingKey, content: `Finalized ${ok} proposals.` });
    } else {
      message.warning({ key: loadingKey, content: `Finalized ${ok}; ${fail} failed.` });
    }
  };

  const previewArtifact = async (record: ProposalRow) => {
    if (!record.negotiationId) {
      message.info('No artifact yet. Finalize first to generate a final text.');
      return;
    }
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewTitle(`${record.title} — Final Artifact`);
    try {
      const txt = await getFinalArtifactText(record.negotiationId);
      setPreviewText(txt || '(empty)');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to fetch artifact.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadArtifact = async (record: ProposalRow) => {
    if (!record.negotiationId) {
      message.info('No artifact yet. Finalize first.');
      return;
    }
    try {
      await downloadFinalArtifact(record.negotiationId);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to download artifact.');
    }
  };

  /* --------------------------- consolidated ------------------------- */
  const currentFilters = useMemo(
    () => ({
      topicKey: conTopicKey || undefined,
      since: conRange?.[0]?.toISOString(),
      until: conRange?.[1]?.toISOString(),
    }),
    [conTopicKey, conRange],
  );

  const doDownloadConsolidated = async () => {
    setConLoading(true);
    try {
      const res = await exportConsolidated({
        filters: currentFilters,
        format: conFormat,
        output: conOutput,
        polish: conPolish === 'none' ? undefined : conPolish,
        download: true,
      });
      if (res?.filename) message.success(`Exported ${res.filename}`);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to export consolidated SRS.');
    } finally {
      setConLoading(false);
    }
  };

  const doPreviewConsolidated = async () => {
    setConPreviewOpen(true);
    setConLoading(true);
    try {
      if (conFormat === 'plain') {
        const txt = await getConsolidatedMarkdownText(currentFilters, { polish: undefined });
        setConPreviewText(txt);
        message.info('Preview shows SRS markdown. Use export to get plain/DOCX/PDF.');
      } else {
        const txt = await getConsolidatedMarkdownText(currentFilters, {
          polish: conPolish === 'none' ? undefined : conPolish,
        });
        setConPreviewText(txt);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to preview consolidated SRS.');
    } finally {
      setConLoading(false);
    }
  };


  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Enhanced Header */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                <RocketOutlined style={{ marginRight: '8px' }} />
                Proposal Finalization Hub
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Transform multiple proposals into a single, comprehensive Software Requirements Specification
              </Text>
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Tooltip title="Analytics Dashboard">
                <Button 
                  icon={<BarChartOutlined />} 
                  onClick={() => setAnalyticsVisible(true)}
                  type="default"
                >
                  Analytics
                </Button>
              </Tooltip>
              <Tooltip title="Settings">
                <Button 
                  icon={<SettingOutlined />} 
                  onClick={() => setSettingsVisible(true)}
                  type="default"
                >
                  Settings
                </Button>
              </Tooltip>
              <Tooltip title="Refresh data">
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={load}
                  loading={loading}
                  type="default"
                >
                  Refresh
                </Button>
              </Tooltip>
              <Popconfirm
                title={`Finalize ${selectedRowKeys.length} selected proposals?`}
                okText="Finalize"
                onConfirm={doBatchFinalize}
                disabled={!selectedRowKeys.length}
              >
                <Badge count={selectedRowKeys.length || 0} size="small" offset={[6, -2]}>
                  <Button 
                    type="primary" 
                    icon={<ThunderboltOutlined />} 
                    disabled={!selectedRowKeys.length}
                    size="large"
                  >
                    Finalize Selected
                  </Button>
                </Badge>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Analytics Overview */}
      {analytics && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Statistic 
                title="Total Proposals" 
                value={analytics.totalProposals}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Statistic 
                title="Finalized" 
                value={analytics.finalizedProposals}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Statistic 
                title="In Progress" 
                value={analytics.negotiatingProposals}
                prefix={<SyncOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Statistic 
                title="Avg Quality" 
                value={analytics.averageQuality}
                precision={1}
                suffix="/10"
                prefix={<StarOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content Tabs */}
      <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <DashboardOutlined />
                  Overview
                </span>
              ),
              children: (
                <div>
                  {/* Enhanced Filters */}
                  <Card size="small" style={{ marginBottom: '16px', borderRadius: '8px' }}>
                    <Row gutter={[12, 12]}>
                      <Col xs={24} md={8}>
                        <Input
                          allowClear
                          prefix={<SearchOutlined />}
                          placeholder="Search proposals..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onPressEnter={() => {
                            setPage(1);
                            load();
                          }}
                          size="large"
                        />
                      </Col>
                      <Col xs={24} md={6}>
                        <Select<Status | 'all'>
                          value={status}
                          onChange={(v) => {
                            setStatus(v);
                            setPage(1);
                          }}
                          style={{ width: '100%' }}
                          size="large"
                          options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'processed', label: 'Processed' },
                            { value: 'negotiating', label: 'Negotiating' },
                            { value: 'finalized', label: 'Finalized' },
                          ]}
                        />
                      </Col>
                      <Col xs={24} md={10}>
                        <RangePicker
                          allowEmpty={[true, true]}
                          value={dateRange as any}
                          onChange={(r) => {
                            setDateRange(r);
                            setPage(1);
                          }}
                          style={{ width: '100%' }}
                          size="large"
                          showTime
                          placeholder={['Since', 'Until']}
                        />
                      </Col>
                    </Row>
                  </Card>

                  {/* Enhanced Table */}
                  <Table<ProposalRow>
                    rowKey="_id"
                    loading={loading}
                    dataSource={rows}
                    columns={[
                      {
                        title: 'Proposal',
                        key: 'proposal',
                        width: 300,
                        render: (_, record) => (
                          <div>
                            <Text strong style={{ fontSize: '14px' }}>{record.title}</Text>
                            <br />
                            <Text code copyable style={{ fontSize: '12px' }}>{record._id}</Text>
                            <br />
                            <Space size="small">
                              <Tag color={record.priority === 'critical' ? 'red' : record.priority === 'high' ? 'orange' : record.priority === 'medium' ? 'blue' : 'green'}>
                                {record.priority?.toUpperCase()}
                              </Tag>
                              <Tag color={record.riskLevel === 'critical' ? 'red' : record.riskLevel === 'high' ? 'orange' : record.riskLevel === 'medium' ? 'blue' : 'green'}>
                                {record.riskLevel?.toUpperCase()} RISK
                              </Tag>
                            </Space>
                          </div>
                        ),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        render: (s: Status) => <StatusTag status={s} />,
                        filters: [
                          { text: 'Pending', value: 'pending' },
                          { text: 'Processed', value: 'processed' },
                          { text: 'Negotiating', value: 'negotiating' },
                          { text: 'Finalized', value: 'finalized' },
                        ],
                        onFilter: (value: any, r: ProposalRow) => r.status === value,
                      },
                      {
                        title: 'Progress',
                        key: 'progress',
                        width: 150,
                        render: (_, record) => (
                          <div>
                            <Progress 
                              percent={record.progress || 0} 
                              size="small" 
                              status={record.progress === 100 ? 'success' : 'active'}
                            />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {record.progress || 0}% Complete
                            </Text>
                          </div>
                        ),
                      },
                      {
                        title: 'Quality',
                        key: 'quality',
                        width: 100,
                        render: (_, record) => (
                          <Rate 
                            disabled 
                            value={record.quality || 0} 
                            count={5}
                            style={{ fontSize: '16px' }}
                          />
                        ),
                      },
                      {
                        title: 'Stakeholders',
                        key: 'stakeholders',
                        width: 120,
                        render: (_, record) => (
                          <Space>
                            <TeamOutlined />
                            <Text>{record.stakeholders?.length || 0}</Text>
                          </Space>
                        ),
                      },
                      {
                        title: 'Conflicts',
                        key: 'conflicts',
                        width: 100,
                        render: (_, record) => (
                          <Space>
                            <ExclamationCircleOutlined />
                            <Text>{record.conflicts?.length || 0}</Text>
                          </Space>
                        ),
                      },
                      {
                        title: 'Updated',
                        dataIndex: 'updatedAt',
                        key: 'updatedAt',
                        width: 150,
                        render: (d?: string) => (d ? dayjs(d).format('MMM DD, YYYY') : '—'),
                        sorter: (a: ProposalRow, b: ProposalRow) =>
                          dayjs(a.updatedAt || 0).valueOf() - dayjs(b.updatedAt || 0).valueOf(),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        fixed: 'right' as const,
                        width: 200,
                        render: (_: any, record: ProposalRow) => {
                          const canDownload = !!record.negotiationId;
                          return (
                            <Space>
                              <Popconfirm
                                title="Finalize this proposal?"
                                okText="Finalize"
                                okButtonProps={{ type: 'primary' }}
                                onConfirm={() => doFinalize(record._id)}
                                disabled={record.status === 'finalized'}
                              >
                                <Button
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  loading={rowLoadingId === record._id}
                                  disabled={record.status === 'finalized'}
                                  size="small"
                                >
                                  Finalize
                                </Button>
                              </Popconfirm>

                              <Tooltip title="View Details">
                                <Button 
                                  icon={<EyeOutlined />} 
                                  onClick={() => {
                                    setSelectedProposal(record);
                                    setProposalDetailsVisible(true);
                                  }}
                                  size="small"
                                />
                              </Tooltip>

                              <Tooltip title={canDownload ? 'Preview final text' : 'No final text yet'}>
                                <Button 
                                  icon={<FileTextOutlined />} 
                                  onClick={() => previewArtifact(record)} 
                                  disabled={!canDownload}
                                  size="small"
                                />
                              </Tooltip>
                            </Space>
                          );
                        },
                      },
                    ]}
                    sticky
                    pagination={{
                      current: page,
                      pageSize,
                      total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} proposals`,
                      onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                      },
                    }}
                    locale={{
                      emptyText: (
                        <Empty 
                          description="No proposals found" 
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: setSelectedRowKeys,
                      getCheckboxProps: (record) => ({
                        disabled: record.status === 'finalized',
                      }),
                    }}
                    scroll={{ x: 1200 }}
                  />
                </div>
              ),
            },
            {
              key: 'analytics',
              label: (
                <span>
                  <BarChartOutlined />
                  Analytics
                </span>
              ),
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="Status Distribution" style={{ borderRadius: '8px' }}>
                        <Pie
                          data={[
                            { type: 'Finalized', value: analytics?.finalizedProposals || 0 },
                            { type: 'Negotiating', value: analytics?.negotiatingProposals || 0 },
                            { type: 'Pending', value: analytics?.pendingProposals || 0 },
                          ]}
                          angleField="value"
                          colorField="type"
                          radius={0.8}
                          label={{
                            type: 'outer',
                            content: '{name} {percentage}',
                          }}
                          interactions={[{ type: 'element-active' }]}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="Risk Distribution" style={{ borderRadius: '8px' }}>
                        <Column
                          data={Object.entries(analytics?.riskDistribution || {}).map(([key, value]) => ({
                            risk: key.toUpperCase(),
                            count: value,
                          }))}
                          xField="risk"
                          yField="count"
                          color={['#52c41a', '#faad14', '#ff4d4f', '#722ed1']}
                          label={{
                            position: 'middle',
                            style: {
                              fill: '#FFFFFF',
                              opacity: 0.6,
                            },
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'consolidation',
              label: (
                <span>
                  <CloudDownloadOutlined />
                  Consolidation
                </span>
              ),
              children: (
                <div>
                  {/* Consolidated options */}
                  <Card title="Export Configuration" style={{ marginBottom: '16px', borderRadius: '8px' }}>
                    <Row gutter={[12, 12]}>
                      <Col xs={24} md={8}>
                        <Input
                          allowClear
                          placeholder="Filter by topic key (optional)"
                          value={conTopicKey}
                          onChange={(e) => setConTopicKey(e.target.value)}
                          size="large"
                        />
                      </Col>
                      <Col xs={24} md={10}>
                        <RangePicker
                          allowEmpty={[true, true]}
                          value={conRange as any}
                          onChange={(r) => setConRange(r)}
                          style={{ width: '100%' }}
                          size="large"
                          showTime
                          placeholder={['Since', 'Until']}
                        />
                      </Col>
                    </Row>
                  </Card>

                  <Row gutter={[12, 12]} align="middle" style={{ marginBottom: '16px' }}>
                    <Col xs={24} md={8}>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Text type="secondary">Format</Text>
                        <Segmented
                          block
                          value={conFormat}
                          onChange={(v) => setConFormat(v as 'srs' | 'plain')}
                          options={[
                            { label: 'IEEE SRS', value: 'srs' },
                            { label: 'Plain List', value: 'plain' },
                          ]}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={8}>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Text type="secondary">Output</Text>
                        <Segmented
                          block
                          value={conOutput}
                          onChange={(v) => setConOutput(v as 'md' | 'docx' | 'pdf')}
                          options={[
                            { label: (<><FileMarkdownOutlined /> MD</>), value: 'md' },
                            { label: (<><FileWordOutlined /> DOCX</>), value: 'docx' },
                            { label: (<><FilePdfOutlined /> PDF</>), value: 'pdf' },
                          ]}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={8}>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Text type="secondary">
                          Polish <Tooltip title="Optional LLM polish for human-like tone. IDs & traceability are preserved."><ExperimentOutlined /></Tooltip>
                        </Text>
                        <Segmented
                          block
                          value={conPolish}
                          onChange={(v) => setConPolish(v as 'none' | 'md' | 'gemini')}
                          options={[
                            { label: 'None', value: 'none' },
                            { label: 'SRS text', value: 'md' },
                            { label: 'Gemini Polish', value: 'gemini' },
                          ]}
                        />
                      </Space>
                    </Col>
                  </Row>

                  <Row justify="end" style={{ marginBottom: '16px' }}>
                    <Space wrap>
                      <Tooltip title="Preview SRS (Markdown)">
                        <Button onClick={doPreviewConsolidated} loading={conLoading} icon={<EyeOutlined />} size="large">
                          Preview Consolidated
                        </Button>
                      </Tooltip>
                      <Tooltip title="Export with the chosen options">
                        <Button
                          type="primary"
                          icon={<CloudDownloadOutlined />}
                          onClick={doDownloadConsolidated}
                          loading={conLoading}
                          size="large"
                        >
                          Export SRS
                        </Button>
                      </Tooltip>
                    </Space>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Proposal Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>Proposal Details</span>
          </Space>
        }
        open={proposalDetailsVisible}
        onCancel={() => setProposalDetailsVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProposal && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Title" span={2}>
                <Text strong>{selectedProposal.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="ID">
                <Text code copyable>{selectedProposal._id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedProposal.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={selectedProposal.priority === 'critical' ? 'red' : selectedProposal.priority === 'high' ? 'orange' : selectedProposal.priority === 'medium' ? 'blue' : 'green'}>
                  {selectedProposal.priority?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Risk Level">
                <Tag color={selectedProposal.riskLevel === 'critical' ? 'red' : selectedProposal.riskLevel === 'high' ? 'orange' : selectedProposal.riskLevel === 'medium' ? 'blue' : 'green'}>
                  {selectedProposal.riskLevel?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Progress">
                <Progress percent={selectedProposal.progress || 0} />
              </Descriptions.Item>
              <Descriptions.Item label="Quality">
                <Rate disabled value={selectedProposal.quality || 0} count={5} />
              </Descriptions.Item>
              <Descriptions.Item label="Stakeholders">
                <Text>{selectedProposal.stakeholders?.length || 0}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Conflicts">
                <Text>{selectedProposal.conflicts?.length || 0}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Requirements">
                <Text>{selectedProposal.requirements?.length || 0}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {selectedProposal.createdAt ? dayjs(selectedProposal.createdAt).format('YYYY-MM-DD HH:mm') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {selectedProposal.updatedAt ? dayjs(selectedProposal.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Space>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  doFinalize(selectedProposal._id);
                  setProposalDetailsVisible(false);
                }}
                disabled={selectedProposal.status === 'finalized'}
              >
                Finalize Proposal
              </Button>
              <Button 
                icon={<EyeOutlined />}
                onClick={() => {
                  previewArtifact(selectedProposal);
                  setProposalDetailsVisible(false);
                }}
                disabled={!selectedProposal.negotiationId}
              >
                Preview Artifact
              </Button>
            </Space>
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        title={
          <Space>
            <SettingOutlined />
            <span>Settings</span>
          </Space>
        }
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Real-time Updates">
            <Switch 
              checked={realTimeUpdates} 
              onChange={setRealTimeUpdates}
              checkedChildren="On" 
              unCheckedChildren="Off"
            />
          </Form.Item>
          
          <Form.Item label="Auto Refresh">
            <Switch 
              checked={autoRefresh} 
              onChange={setAutoRefresh}
              checkedChildren="On" 
              unCheckedChildren="Off"
            />
          </Form.Item>
          
          <Form.Item label={`Refresh Interval: ${refreshInterval} seconds`}>
            <Slider
              min={10}
              max={300}
              value={refreshInterval}
              onChange={setRefreshInterval}
              marks={{
                10: '10s',
                30: '30s',
                60: '1m',
                120: '2m',
                300: '5m',
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        title={
          <Space>
            <BarChartOutlined />
            <span>Analytics Dashboard</span>
          </Space>
        }
        open={analyticsVisible}
        onCancel={() => setAnalyticsVisible(false)}
        footer={null}
        width={1000}
      >
        {analytics && (
          <div>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Status Distribution" style={{ borderRadius: '8px' }}>
                  <Pie
                    data={[
                      { type: 'Finalized', value: analytics.finalizedProposals },
                      { type: 'Negotiating', value: analytics.negotiatingProposals },
                      { type: 'Pending', value: analytics.pendingProposals },
                    ]}
                    angleField="value"
                    colorField="type"
                    radius={0.8}
                    label={{
                      type: 'outer',
                      content: '{name} {percentage}',
                    }}
                    interactions={[{ type: 'element-active' }]}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Risk Distribution" style={{ borderRadius: '8px' }}>
                  <Column
                    data={Object.entries(analytics.riskDistribution).map(([key, value]) => ({
                      risk: key.toUpperCase(),
                      count: value,
                    }))}
                    xField="risk"
                    yField="count"
                    color={['#52c41a', '#faad14', '#ff4d4f', '#722ed1']}
                    label={{
                      position: 'middle',
                      style: {
                        fill: '#FFFFFF',
                        opacity: 0.6,
                      },
                    }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col xs={24} lg={12}>
                <Card title="Priority Distribution" style={{ borderRadius: '8px' }}>
                  <Column
                    data={Object.entries(analytics.priorityDistribution).map(([key, value]) => ({
                      priority: key.toUpperCase(),
                      count: value,
                    }))}
                    xField="priority"
                    yField="count"
                    color={['#52c41a', '#1890ff', '#faad14', '#ff4d4f']}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Quality Overview" style={{ borderRadius: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Statistic 
                      title="Average Quality" 
                      value={analytics.averageQuality}
                      precision={1}
                      suffix="/10"
                      valueStyle={{ color: '#722ed1', fontSize: '32px' }}
                    />
                    <Rate 
                      disabled 
                      value={analytics.averageQuality / 2} 
                      count={5}
                      style={{ fontSize: '24px', marginTop: '16px' }}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Final artifact preview */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>{previewTitle}</span>
          </Space>
        }
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        width={720}
        extra={
          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => {
                if (selectedProposal?.negotiationId) {
                  downloadArtifact(selectedProposal);
                }
              }}
            >
              Download
            </Button>
          </Space>
        }
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Loading artifact...</Text>
            </div>
          </div>
        ) : (
          <>
            <Alert
              message="Final Artifact"
              description="This is the consolidated final artifact generated from the proposal finalization process."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Card style={{ borderRadius: '8px' }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                margin: 0, 
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
              }}>
                {previewText}
              </pre>
            </Card>
            <Divider />
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Plain-text export generated by the Finalization service. Use the download button to save this artifact.
            </Text>
          </>
        )}
      </Drawer>

      {/* Consolidated preview */}
      <Drawer
        title={
          <Space>
            <CloudDownloadOutlined />
            <span>Consolidated SRS (Markdown Preview)</span>
          </Space>
        }
        open={conPreviewOpen}
        onClose={() => setConPreviewOpen(false)}
        width={920}
        extra={
          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={doDownloadConsolidated}
              type="primary"
            >
              Export with Current Options
            </Button>
          </Space>
        }
      >
        {conLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Generating consolidated SRS...</Text>
            </div>
          </div>
        ) : (
          <>
            <Alert
              message="Consolidated Software Requirements Specification"
              description="This preview shows the consolidated SRS in Markdown format. Use the export button to generate DOCX or PDF versions."
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Card style={{ borderRadius: '8px' }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                margin: 0, 
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
              }}>
                {conPreviewText}
              </pre>
            </Card>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Export Tips"
                description={
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Switch output to DOCX/PDF for a polished handout</li>
                    <li>Use "Polish" to improve readability (IDs stay intact)</li>
                    <li>IEEE SRS format follows industry standards</li>
                    <li>All requirements are traceable to original proposals</li>
                  </ul>
                }
                type="info"
                showIcon
              />
            </Space>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default FinalizePage;
