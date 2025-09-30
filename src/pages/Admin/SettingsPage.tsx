import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  App,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Alert,
  Spin,
  Divider,
  Descriptions,
  Collapse,
  Select,
  Switch,
  Modal,
  Badge
} from 'antd';
import {
  SettingOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  CloudDownloadOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { 
    downloadPendingProposals, 
    downloadNegotiatingProposals, 
  downloadFinalizedProposals,
  downloadAllProposals,
  getSystemInfo,
  getSystemHealth,
  exportSystemData,
  createSystemBackup,
  type SystemInfo,
  type SystemHealth,
  type BackupResponse
} from '../../services/adminService';
import { getComprehensiveDashboardData } from '../../services/dashboardService';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const SettingsPage: React.FC = () => {
    const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [exportType, setExportType] = useState<string>('proposals');
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [backupOptions, setBackupOptions] = useState({
    includeBlockchain: true,
    includeUsers: true
  });
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [infoData, healthData, dashboardData] = await Promise.all([
        getSystemInfo(),
        getSystemHealth(),
        getComprehensiveDashboardData()
      ]);
      
      setDashboardData(dashboardData);

      setSystemInfo(infoData);
      setSystemHealth(healthData);
    } catch (err: any) {
      console.error("Failed to fetch system data:", err);
      setError(err.message || 'Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleDownload = async (stage: 'pending' | 'in_negotiation' | 'finalized' | 'all') => {
        try {
            message.loading({ content: `Downloading ${stage.replace('_', ' ')} proposals...`, key: stage });
            
            let downloadFunction;
            switch (stage) {
                case 'pending':
                    downloadFunction = downloadPendingProposals;
                    break;
                case 'in_negotiation':
                    downloadFunction = downloadNegotiatingProposals;
                    break;
                case 'finalized':
                    downloadFunction = downloadFinalizedProposals;
                    break;
        case 'all':
          downloadFunction = downloadAllProposals;
          break;
            }

            await downloadFunction();
            message.success({ content: `Report for ${stage.replace('_', ' ')} proposals started successfully!`, key: stage, duration: 2 });
        } catch (err: any) {
            message.error({ content: err.message || `Failed to download ${stage.replace('_', ' ')} report.`, key: stage, duration: 2 });
        }
    };

  const handleExportData = async () => {
    try {
      setLoading(true);
      await exportSystemData(exportType, exportFormat);
      message.success(`Data exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (err: any) {
      console.error("Failed to export data:", err);
      message.error(err.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      const backup: BackupResponse = await createSystemBackup(backupOptions);
      message.success(`Backup created successfully! ID: ${backup.backupId}`);
      setBackupModalVisible(false);
    } catch (err: any) {
      console.error("Failed to create backup:", err);
      message.error(err.message || 'Failed to create backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#52c41a';
      case 'warning': return '#faad14';
      case 'critical': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined />;
      case 'warning': return <ExclamationCircleOutlined />;
      case 'critical': return <CloseCircleOutlined />;
      default: return <InfoCircleOutlined />;
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemoryUsage = (bytes: number) => {
    const mb = Math.round(bytes / 1024 / 1024);
    return `${mb} MB`;
  };

  if (loading && !systemInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading system information...</Text>
        </div>
      </div>
    );
  }

    return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SettingOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          System Settings & Administration
            </Title>
        <Paragraph>
          Manage system configurations, monitor health status, and perform administrative tasks.
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
            <Button size="small" onClick={fetchSystemData}>
              Retry
            </Button>
          }
        />
      )}

      {/* System Health Overview */}
      {systemHealth && (
        <Card title="System Health Overview" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <div style={{ textAlign: 'center' }}>
                <Badge
                  status={systemHealth.overall === 'healthy' ? 'success' : 
                         systemHealth.overall === 'warning' ? 'warning' : 'error'}
                  text={
                    <Text strong style={{ 
                      color: getHealthStatusColor(systemHealth.overall),
                      fontSize: '18px'
                    }}>
                      {systemHealth.overall.toUpperCase()}
                    </Text>
                  }
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">Overall Status</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div style={{ textAlign: 'center' }}>
                <Tag 
                  color={systemHealth.components.database.status === 'healthy' ? 'success' : 'error'}
                  icon={getHealthStatusIcon(systemHealth.components.database.status)}
                >
                  Database
                </Tag>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">{systemHealth.components.database.message}</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div style={{ textAlign: 'center' }}>
                <Tag 
                  color={systemHealth.components.memory.status === 'healthy' ? 'success' : 'warning'}
                  icon={getHealthStatusIcon(systemHealth.components.memory.status)}
                >
                  Memory
                </Tag>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">{systemHealth.components.memory.message}</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div style={{ textAlign: 'center' }}>
                <Tag 
                  color={systemHealth.components.uptime.status === 'healthy' ? 'success' : 'warning'}
                  icon={getHealthStatusIcon(systemHealth.components.uptime.status)}
                >
                  Uptime
                </Tag>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">{systemHealth.components.uptime.message}</Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* System Information */}
      {(systemInfo || dashboardData) && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={8}>
            <Card title="Database Status">
              <Statistic
                title="Connection Status"
                value={systemInfo?.database?.connected ? 'Connected' : 'Disconnected'}
                valueStyle={{ 
                  color: systemInfo?.database?.connected ? '#52c41a' : '#ff4d4f' 
                }}
              />
              <Divider />
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Proposals">
                  {(systemInfo?.database?.collections?.proposals || dashboardData?.dashboardStats?.totalProposals || 0).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Users">
                  {(systemInfo?.database?.collections?.users || dashboardData?.dashboardStats?.totalUsers || 0).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Negotiations">
                  {(systemInfo?.database?.collections?.negotiations || dashboardData?.dashboardStats?.totalNegotiations || 0).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Blockchain Stored">
                  {(systemInfo?.database?.collections?.blockchainStored || dashboardData?.dashboardStats?.totalProposals || 0).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="System Information">
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Node Version">
                  {systemInfo?.system?.nodeVersion || 'v22.17.0'}
                </Descriptions.Item>
                <Descriptions.Item label="Platform">
                  {systemInfo?.system?.platform || 'win32'}
                </Descriptions.Item>
                <Descriptions.Item label="Environment">
                  <Tag color="blue">{systemInfo?.system?.environment || 'development'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Uptime">
                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                  {formatUptime(systemInfo?.system?.uptime || 0)}
                </Descriptions.Item>
              </Descriptions>
              <Divider />
              <Text strong>Memory Usage</Text>
              <div style={{ marginTop: '8px' }}>
                <Progress
                  percent={systemInfo?.system?.memoryUsage?.heapTotal ? 
                    Math.round((systemInfo.system.memoryUsage.heapUsed / systemInfo.system.memoryUsage.heapTotal) * 100) : 45}
                  size="small"
                  strokeColor="#1890ff"
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {formatMemoryUsage(systemInfo?.system?.memoryUsage?.heapUsed || 1024 * 1024 * 1024)} / {formatMemoryUsage(systemInfo?.system?.memoryUsage?.heapTotal || 8 * 1024 * 1024 * 1024)}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Blockchain Status">
              <Statistic
                title="Status"
                value={systemInfo?.blockchain?.status || 'Connected'}
                valueStyle={{ color: '#52c41a' }}
              />
              <Divider />
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Total Transactions">
                  {(systemInfo?.blockchain?.totalTransactions || dashboardData?.blockchainMetrics?.totalTransactions || 0).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Activity">
                  {systemInfo?.blockchain?.lastActivity ? 
                    new Date(systemInfo.blockchain.lastActivity).toLocaleString() : 
                    'No recent activity'
                  }
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      )}

      {/* Actions */}
      <Card title="System Actions" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Data Export</Text>
                <Space wrap>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload('pending')}
                >
                  Pending Proposals
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload('in_negotiation')}
                >
                  Negotiating Proposals
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload('finalized')}
                >
                  Finalized Proposals
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload('all')}
                >
                  All Proposals
                    </Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>System Management</Text>
              <Space wrap>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={fetchSystemData}
                >
                  Refresh Status
                    </Button>
                <Button 
                  icon={<CloudDownloadOutlined />}
                  onClick={() => setBackupModalVisible(true)}
                >
                  Create Backup
                    </Button>
                </Space>
            </Space>
          </Col>
        </Row>
            </Card>

      {/* Advanced Export */}
      <Card title="Advanced Data Export" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Export Type</Text>
              <Select
                value={exportType}
                onChange={setExportType}
                style={{ width: '100%' }}
              >
                <Select.Option value="proposals">Proposals</Select.Option>
                <Select.Option value="users">Users</Select.Option>
                <Select.Option value="negotiations">Negotiations</Select.Option>
                <Select.Option value="blockchain-logs">Blockchain Logs</Select.Option>
                <Select.Option value="all">Complete System Data</Select.Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Export Format</Text>
              <Select
                value={exportFormat}
                onChange={setExportFormat}
                style={{ width: '100%' }}
              >
                <Select.Option value="csv">CSV</Select.Option>
                <Select.Option value="json">JSON</Select.Option>
                <Select.Option value="xlsx">Excel</Select.Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportData}
              loading={loading}
              style={{ width: '100%' }}
            >
              Export Data
            </Button>
          </Col>
        </Row>
            </Card>

      {/* Detailed System Information */}
      <Collapse defaultActiveKey={['health']}>
        <Panel header="Detailed System Health" key="health">
          {systemHealth && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Database Status" span={2}>
                <Tag color={systemHealth.components.database.status === 'healthy' ? 'success' : 'error'}>
                  {systemHealth.components.database.status.toUpperCase()}
                </Tag>
                <Text style={{ marginLeft: '8px' }}>
                  {systemHealth.components.database.message}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Collections Status">
                <Tag color={systemHealth.components.collections.status === 'healthy' ? 'success' : 'error'}>
                  {systemHealth.components.collections.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Memory Status">
                <Tag color={systemHealth.components.memory.status === 'healthy' ? 'success' : 'warning'}>
                  {systemHealth.components.memory.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Uptime Status">
                <Tag color={systemHealth.components.uptime.status === 'healthy' ? 'success' : 'warning'}>
                  {systemHealth.components.uptime.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Last Check">
                {new Date(systemHealth.timestamp).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Panel>
      </Collapse>

      {/* Backup Modal */}
      <Modal
        title="Create System Backup"
        open={backupModalVisible}
        onOk={handleCreateBackup}
        onCancel={() => setBackupModalVisible(false)}
        confirmLoading={backupLoading}
        okText="Create Backup"
        cancelText="Cancel"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Select what to include in the backup:</Text>
          <Space direction="vertical">
            <Space>
              <Switch
                checked={backupOptions.includeUsers}
                onChange={(checked) => setBackupOptions(prev => ({ ...prev, includeUsers: checked }))}
              />
              <Text>Include User Data</Text>
            </Space>
            <Space>
              <Switch
                checked={backupOptions.includeBlockchain}
                onChange={(checked) => setBackupOptions(prev => ({ ...prev, includeBlockchain: checked }))}
              />
              <Text>Include Blockchain Logs</Text>
            </Space>
          </Space>
          <Alert
            message="Backup Information"
            description="This will create a comprehensive backup of all selected system data. The backup will include proposals, negotiations, and optionally user data and blockchain logs."
            type="info"
            showIcon
          />
        </Space>
      </Modal>
        </div>
    );
};

export default SettingsPage;