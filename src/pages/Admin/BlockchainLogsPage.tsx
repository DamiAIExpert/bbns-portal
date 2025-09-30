import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Spin,
  Alert,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Empty,
  Collapse,
  Badge
} from 'antd';
import {
  SafetyOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  SearchOutlined
} from '@ant-design/icons';
import {
  getBlockchainLogs,
  getBlockchainSummary,
  getBlockchainTransactions,
  storeAllProposalsOnBlockchain,
  type BlockchainSummary,
  type BlockchainTransaction,
  type BlockchainLog
} from '../../services/adminService';
import { getComprehensiveDashboardData } from '../../services/dashboardService';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const BlockchainLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockchainLogs, setBlockchainLogs] = useState<BlockchainLog[]>([]);
  const [blockchainSummary, setBlockchainSummary] = useState<BlockchainSummary | null>(null);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [storing, setStoring] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [logsData, summaryData, transactionsData, dashboardData] = await Promise.all([
        getBlockchainLogs({ limit: 100 }),
        getBlockchainSummary(),
        getBlockchainTransactions({ limit: 50 }),
        getComprehensiveDashboardData()
      ]);
      
      setDashboardData(dashboardData);

      setBlockchainLogs(Array.isArray(logsData) ? logsData : []);
      setBlockchainSummary(summaryData);
      setTransactions(transactionsData.transactions || []);
    } catch (err: any) {
      console.error("Failed to fetch blockchain data:", err);
      setError(err.message || 'Failed to fetch blockchain data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStoreAllProposals = async () => {
    try {
      setStoring(true);
      await storeAllProposalsOnBlockchain({ dryRun: false });
      await fetchData(); // Refresh data after storing
    } catch (err: any) {
      console.error("Failed to store proposals:", err);
      setError(err.message || 'Failed to store proposals on blockchain');
    } finally {
      setStoring(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'processing';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return <CheckCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return <ExclamationCircleOutlined />;
    }
  };

  const filteredLogs = blockchainLogs.filter(log => {
    const matchesStatus = !statusFilter || (log.transactionHash ? 'success' : 'pending') === statusFilter;
    const matchesSearch = !searchText || 
      log.transactionHash?.toLowerCase().includes(searchText.toLowerCase()) ||
      log.proposalId?.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = !statusFilter || transaction.status === statusFilter;
    const matchesSearch = !searchText || 
      transaction.transactionHash?.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.proposal?.title?.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const logsColumns = [
    {
      title: 'Index',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (index: number) => (
        <Badge count={index} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      )
    },
    {
      title: 'Transaction Hash',
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      width: 200,
      render: (hash: any) => {
        const hashStr = String(hash || '');
        return (
          <Text code copyable={{ text: hashStr }}>
            {hashStr ? `${hashStr.slice(0, 10)}...${hashStr.slice(-8)}` : 'N/A'}
          </Text>
        );
      }
    },
    {
      title: 'Proposal ID',
      dataIndex: 'proposalId',
      key: 'proposalId',
      width: 150,
      render: (proposalId: any) => {
        const id = typeof proposalId === 'string' ? proposalId : 
                   proposalId?._id || proposalId?.id || proposalId;
        return (
          <Text code>{id ? `${String(id).slice(0, 8)}...` : 'N/A'}</Text>
        );
      }
    },
    {
      title: 'Network',
      dataIndex: 'network',
      key: 'network',
      width: 100,
      render: (network: string) => (
        <Tag color="blue">{network || 'Unknown'}</Tag>
      )
    },
    {
      title: 'Block Number',
      dataIndex: 'blockNumber',
      key: 'blockNumber',
      width: 120,
      render: (blockNumber: number) => (
        <Text strong>{blockNumber || 'N/A'}</Text>
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string | number) => (
        <Text type="secondary">
          {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
        </Text>
      )
    },
    {
      title: 'Event',
      dataIndex: 'event',
      key: 'event',
      width: 150,
      render: (event: string) => (
        <Tag color="purple">{event || 'N/A'}</Tag>
      )
    }
  ];

  const transactionsColumns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      )
    },
    {
      title: 'Transaction Hash',
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      width: 200,
      render: (hash: any) => {
        const hashStr = String(hash || '');
        return (
          <Text code copyable={{ text: hashStr }}>
            {hashStr ? `${hashStr.slice(0, 10)}...${hashStr.slice(-8)}` : 'N/A'}
          </Text>
        );
      }
    },
    {
      title: 'Proposal',
      dataIndex: 'proposal',
      key: 'proposal',
      width: 200,
      render: (proposal: any) => (
        <div>
          <Text strong>{proposal?.title || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {proposal?.status || 'Unknown'}
          </Text>
        </div>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => (
        <Text>{duration ? `${duration}s` : 'N/A'}</Text>
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => (
        <Text type="secondary">
          {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
        </Text>
      )
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      width: 200,
      render: (error: any) => {
        const errorStr = String(error || '');
        return errorStr ? (
          <Tooltip title={errorStr}>
            <Text type="danger" ellipsis>
              {errorStr.slice(0, 30)}...
            </Text>
          </Tooltip>
        ) : 'N/A';
      }
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading blockchain data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SafetyOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Blockchain Logs & Transactions
      </Title>
        <Paragraph>
          Monitor blockchain operations, transaction history, and system health metrics.
      </Paragraph>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button size="small" onClick={fetchData}>
              Retry
            </Button>
          }
        />
      )}

      {/* Summary Cards */}
      {(blockchainSummary || dashboardData) && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Transactions"
                value={blockchainSummary?.totalTransactions || dashboardData?.dashboardStats?.totalProposals || 0}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Successful"
                value={blockchainSummary?.successfulTransactions || dashboardData?.dashboardStats?.totalProposals || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Failed"
                value={blockchainSummary?.failedTransactions || 0}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Proposals Stored"
                value={blockchainSummary?.totalProposalsStored || 0}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Blockchain Health */}
      {blockchainSummary && (
        <Card title="Blockchain Health" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Math.round(blockchainSummary.blockchainHealth.successRate)}
                  format={(percent) => `${percent}%`}
                  strokeColor="#52c41a"
                />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Success Rate</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: '#1890ff' }}>
                  {blockchainSummary.averageTransactionTime}s
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Avg Transaction Time</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Badge 
                  status={blockchainSummary.blockchainHealth.status === 'healthy' ? 'success' : 'error'}
                  text={
                    <Text strong style={{ 
                      color: blockchainSummary.blockchainHealth.status === 'healthy' ? '#52c41a' : '#ff4d4f'
                    }}>
                      {blockchainSummary.blockchainHealth.status.toUpperCase()}
                    </Text>
                  }
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">Network Status</Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<SafetyOutlined />}
                onClick={handleStoreAllProposals}
                loading={storing}
              >
                Store All Proposals on Blockchain
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                Refresh Data
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
          <Input
                placeholder="Search transactions..."
            prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
          <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                allowClear
              >
                <Select.Option value="success">Success</Select.Option>
                <Select.Option value="failed">Failed</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Detailed Views */}
      <Collapse defaultActiveKey={['logs']}>
        <Panel header="Blockchain Logs" key="logs">
          <Table
            columns={logsColumns}
            dataSource={filteredLogs.map((log, index) => ({ ...log, key: log.index || index }))}
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} logs`
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No blockchain logs found"
                />
              )
            }}
          />
        </Panel>

        <Panel header="Transaction History" key="transactions">
          <Table
            columns={transactionsColumns}
            dataSource={filteredTransactions.map((transaction, index) => ({ ...transaction, key: transaction._id || index }))}
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`
            }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No transactions found"
                />
              )
            }}
          />
        </Panel>
      </Collapse>
    </div>
  );
};

export default BlockchainLogsPage;