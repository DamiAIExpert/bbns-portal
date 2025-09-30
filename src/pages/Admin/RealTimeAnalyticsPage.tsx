// src/pages/Admin/RealTimeAnalyticsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Alert,
  Tabs,
  Progress,
  Space,
  Button,
  Tooltip,
  Badge,
  Tag,
  Divider,
  notification
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  SyncOutlined,
  DatabaseOutlined,
  BlockOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import {
  Bar,
  Line,
  Pie,
  Column,
  Area,
  Gauge,
  Liquid
} from '@ant-design/plots';
import {
  fetchComprehensiveMetrics,
  type ComprehensiveMetrics,
  type SystemMetrics,
  type StakeholderMetrics,
  type ProposalMetrics,
  type NegotiationMetrics,
  type FinalProposalMetrics,
  type ResearchMetrics,
  type BlockchainMetrics,
  formatPercentage,
  formatNumber,
  getPerformanceColor
} from '../../services/metricsService';

const { Title, Paragraph, Text } = Typography;

const RealTimeAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ComprehensiveMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const comprehensiveMetrics = await fetchComprehensiveMetrics();
      setMetrics(comprehensiveMetrics);
      setLastUpdated(new Date());
      
      notification.success({
        message: 'Metrics Updated',
        description: 'Analytics data has been refreshed successfully.',
        placement: 'topRight'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load metrics';
      setError(errorMessage);
      notification.error({
        message: 'Error Loading Metrics',
        description: errorMessage,
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const renderSystemOverview = (systemMetrics: SystemMetrics) => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Users"
            value={systemMetrics.totalUsers}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Active Stakeholders"
            value={systemMetrics.totalStakeholders}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Proposals"
            value={systemMetrics.totalProposals}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Negotiations"
            value={systemMetrics.totalNegotiations}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderEfficiencyMetrics = (systemMetrics: SystemMetrics) => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Processing Efficiency"
            value={formatPercentage(systemMetrics.processingEfficiency)}
            prefix={<RiseOutlined />}
            valueStyle={{ 
              color: getPerformanceColor(systemMetrics.processingEfficiency, { good: 60, excellent: 80 })
            }}
          />
          <Progress 
            percent={systemMetrics.processingEfficiency} 
            strokeColor={getPerformanceColor(systemMetrics.processingEfficiency, { good: 60, excellent: 80 })}
            showInfo={false}
            style={{ marginTop: 8 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Negotiation Success"
            value={formatPercentage(systemMetrics.negotiationSuccessRate)}
            prefix={<TrophyOutlined />}
            valueStyle={{ 
              color: getPerformanceColor(systemMetrics.negotiationSuccessRate, { good: 60, excellent: 80 })
            }}
          />
          <Progress 
            percent={systemMetrics.negotiationSuccessRate} 
            strokeColor={getPerformanceColor(systemMetrics.negotiationSuccessRate, { good: 60, excellent: 80 })}
            showInfo={false}
            style={{ marginTop: 8 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Final Proposals"
            value={systemMetrics.totalFinalProposals}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: systemMetrics.totalFinalProposals > 0 ? '#52c41a' : '#faad14' }}
          />
          <Text type="secondary">
            {systemMetrics.totalFinalProposals > 0 ? 'Generated' : 'Pending'}
          </Text>
        </Card>
      </Col>
    </Row>
  );

  const renderStakeholderDistribution = (stakeholderMetrics: StakeholderMetrics) => {
    const pieData = Object.entries(stakeholderMetrics.roleDistribution).map(([role, data]) => ({
      type: role,
      value: data.count,
      percentage: data.percentage
    }));

    const pieConfig = {
      data: pieData,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name}: {percentage}%'
      },
      interactions: [{ type: 'element-active' }]
    };

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Stakeholder Distribution" extra={<PieChartOutlined />}>
            <Pie {...pieConfig} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Consensus Metrics">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong>Participation Rate</Text>
                <Progress 
                  percent={stakeholderMetrics.participationRate} 
                  strokeColor="#52c41a"
                  style={{ marginTop: 8 }}
                />
              </div>
              <div>
                <Text strong>Agreement Level</Text>
                <Progress 
                  percent={stakeholderMetrics.agreementLevel} 
                  strokeColor="#1890ff"
                  style={{ marginTop: 8 }}
                />
              </div>
              <div>
                <Text strong>Conflict Resolution</Text>
                <Progress 
                  percent={stakeholderMetrics.conflictResolution} 
                  strokeColor="#722ed1"
                  style={{ marginTop: 8 }}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderNegotiationPerformance = (negotiationMetrics: NegotiationMetrics) => {
    const performanceData = [
      { metric: 'Success Rate', value: negotiationMetrics.successRate, color: '#52c41a' },
      { metric: 'Consensus Level', value: negotiationMetrics.consensusLevel, color: '#1890ff' },
      { metric: 'Fairness Index', value: negotiationMetrics.fairnessIndex * 100, color: '#722ed1' },
      { metric: 'Nash Product', value: negotiationMetrics.nashProduct * 100, color: '#fa8c16' }
    ];

    const columnConfig = {
      data: performanceData,
      xField: 'metric',
      yField: 'value',
      color: '#1890ff',
      label: {
        position: 'top' as const,
        formatter: (datum: any) => `${(datum.value || 0).toFixed(1)}%`
      }
    };

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Negotiation Performance" extra={<BarChartOutlined />}>
            <Column {...columnConfig} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Key Metrics">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Statistic
                title="Total Participants"
                value={formatNumber(negotiationMetrics.totalParticipants)}
                prefix={<TeamOutlined />}
              />
              <Statistic
                title="Total Rounds"
                value={negotiationMetrics.totalRounds}
                prefix={<ClockCircleOutlined />}
              />
              <Statistic
                title="Conflicts Resolved"
                value={formatNumber(negotiationMetrics.conflictsResolved)}
                prefix={<CheckCircleOutlined />}
              />
              <Statistic
                title="Avg Participants/Negotiation"
                value={negotiationMetrics.averageParticipantsPerNegotiation}
                precision={1}
                prefix={<TeamOutlined />}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderFinalProposalMetrics = (finalProposalMetrics: FinalProposalMetrics) => (
    <Card title="Final Proposal Analysis" extra={<TrophyOutlined />}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small" title="Basic Info">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Proposal ID:</Text>
                <br />
                <Text code>{finalProposalMetrics.finalProposalId}</Text>
              </div>
              <div>
                <Text strong>Topic:</Text>
                <br />
                <Tag color="blue">{finalProposalMetrics.topicKey}</Tag>
              </div>
              <div>
                <Text strong>Created:</Text>
                <br />
                <Text>{new Date(finalProposalMetrics.createdAt).toLocaleDateString()}</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title="Requirements">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title="Total Requirements"
                value={finalProposalMetrics.requirements.total}
                prefix={<CheckCircleOutlined />}
              />
              <Statistic
                title="Per Stakeholder"
                value={finalProposalMetrics.requirements.requirementsPerStakeholder}
                precision={2}
                prefix={<TeamOutlined />}
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title="Implementation">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Phase 1:</Text>
                <br />
                <Text type="secondary">{finalProposalMetrics.implementationTimeline.phase1}</Text>
              </div>
              <div>
                <Text strong>Phase 2:</Text>
                <br />
                <Text type="secondary">{finalProposalMetrics.implementationTimeline.phase2}</Text>
              </div>
              <div>
                <Text strong>Phase 3:</Text>
                <br />
                <Text type="secondary">{finalProposalMetrics.implementationTimeline.phase3}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  const renderResearchMetrics = (researchMetrics: ResearchMetrics) => (
    <Card title="Research Evaluation Framework" extra={<ExperimentOutlined />}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Data Points"
            value={formatNumber(researchMetrics.evaluationDataPoints)}
            prefix={<DatabaseOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Benchmark Variants"
            value={researchMetrics.benchmarkVariantsTested}
            prefix={<BarChartOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Significant Differences"
            value={researchMetrics.statisticalSignificance}
            prefix={<RiseOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Research Grade"
            value={researchMetrics.researchGrade}
            prefix={<TrophyOutlined />}
          />
        </Col>
      </Row>
    </Card>
  );

  const renderBlockchainMetrics = (blockchainMetrics: BlockchainMetrics) => (
    <Card title="Blockchain Integration" extra={<BlockOutlined />}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Integration Status"
              value={blockchainMetrics.integration}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Immutable Records"
              value={blockchainMetrics.immutableRecords}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Transparency Level"
              value={blockchainMetrics.transparencyLevel}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Verification Status"
              value={blockchainMetrics.verificationStatus}
              valueStyle={{ color: blockchainMetrics.verificationStatus === 'Complete' ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );

  if (loading && !metrics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>Loading comprehensive analytics...</Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Analytics"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={loadMetrics}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!metrics) {
    return (
      <Alert
        message="No Data Available"
        description="Unable to load analytics data."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>Real-Time Analytics Dashboard</Title>
          <Paragraph type="secondary">
            Comprehensive metrics and performance analysis for the blockchain negotiation system
          </Paragraph>
        </div>
        <Space>
          {lastUpdated && (
            <Text type="secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
          <Button 
            type="primary" 
            icon={<SyncOutlined />} 
            onClick={loadMetrics}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Tabs 
        defaultActiveKey="overview" 
        type="card"
        items={[
          {
            key: 'overview',
            label: 'System Overview',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {renderSystemOverview(metrics.systemMetrics)}
                {renderEfficiencyMetrics(metrics.systemMetrics)}
              </Space>
            )
          },
          {
            key: 'stakeholders',
            label: 'Stakeholders',
            children: renderStakeholderDistribution(metrics.stakeholderMetrics)
          },
          {
            key: 'negotiations',
            label: 'Negotiations',
            children: renderNegotiationPerformance(metrics.negotiationMetrics)
          },
          {
            key: 'final-proposals',
            label: 'Final Proposals',
            children: metrics.finalProposalMetrics ? (
              renderFinalProposalMetrics(metrics.finalProposalMetrics)
            ) : (
              <Alert
                message="No Final Proposals"
                description="No final proposals have been generated yet."
                type="info"
                showIcon
              />
            )
          },
          {
            key: 'research',
            label: 'Research',
            children: renderResearchMetrics(metrics.researchMetrics)
          },
          {
            key: 'blockchain',
            label: 'Blockchain',
            children: renderBlockchainMetrics(metrics.blockchainMetrics)
          }
        ]}
      />
    </div>
  );
};

export default RealTimeAnalyticsPage;
