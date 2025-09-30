// src/pages/Admin/ResearchAnalyticsPage.tsx
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
  Table,
  App,
  Collapse,
  List,
  Descriptions
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
  ExperimentOutlined,
  BulbOutlined,
  BookOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import {
  Bar,
  Line,
  Pie,
  Column,
  Area,
  Gauge,
  Liquid,
  Scatter,
  Radar
} from '@ant-design/plots';
import {
  fetchStakeholderCompositionAnalysis,
  fetchMethodComparisonAnalysis,
  fetchSuccessFactorsAnalysis,
  fetchStakeholderBehaviorAnalysis,
  fetchBlockchainImpactAnalysis,
  fetchPredictiveMetricsAnalysis,
  fetchConflictResolutionAnalysis,
  fetchLongitudinalAnalysis,
  fetchComprehensiveResearchDashboard,
  type StakeholderCompositionAnalysis,
  type MethodComparisonAnalysis,
  type SuccessFactorsAnalysis,
  type StakeholderBehaviorAnalysis,
  type BlockchainImpactAnalysis,
  type PredictiveMetricsAnalysis,
  type ConflictResolutionAnalysis,
  type LongitudinalAnalysis,
  type ComprehensiveResearchDashboard,
  calculateCorrelationStrength,
  formatStatisticalSignificance,
  getPerformanceColor,
  formatPercentage,
  formatNumber
} from '../../services/researchAnalyticsService';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const ResearchAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { notification } = App.useApp();
  
  // Research data state
  const [stakeholderAnalysis, setStakeholderAnalysis] = useState<StakeholderCompositionAnalysis | null>(null);
  const [methodComparison, setMethodComparison] = useState<MethodComparisonAnalysis | null>(null);
  const [successFactors, setSuccessFactors] = useState<SuccessFactorsAnalysis | null>(null);
  const [stakeholderBehavior, setStakeholderBehavior] = useState<StakeholderBehaviorAnalysis | null>(null);
  const [blockchainImpact, setBlockchainImpact] = useState<BlockchainImpactAnalysis | null>(null);
  const [predictiveMetrics, setPredictiveMetrics] = useState<PredictiveMetricsAnalysis | null>(null);
  const [conflictResolution, setConflictResolution] = useState<ConflictResolutionAnalysis | null>(null);
  const [longitudinalAnalysis, setLongitudinalAnalysis] = useState<LongitudinalAnalysis | null>(null);
  const [dashboard, setDashboard] = useState<ComprehensiveResearchDashboard | null>(null);

  const loadAllResearchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        stakeholderData,
        methodData,
        successData,
        behaviorData,
        blockchainData,
        predictiveData,
        conflictData,
        longitudinalData,
        dashboardData
      ] = await Promise.all([
        fetchStakeholderCompositionAnalysis(),
        fetchMethodComparisonAnalysis(),
        fetchSuccessFactorsAnalysis(),
        fetchStakeholderBehaviorAnalysis(),
        fetchBlockchainImpactAnalysis(),
        fetchPredictiveMetricsAnalysis(),
        fetchConflictResolutionAnalysis(),
        fetchLongitudinalAnalysis(),
        fetchComprehensiveResearchDashboard()
      ]);

      setStakeholderAnalysis(stakeholderData);
      setMethodComparison(methodData);
      setSuccessFactors(successData);
      setStakeholderBehavior(behaviorData);
      setBlockchainImpact(blockchainData);
      setPredictiveMetrics(predictiveData);
      setConflictResolution(conflictData);
      setLongitudinalAnalysis(longitudinalData);
      setDashboard(dashboardData);
      
      notification.success({
        message: 'Research Data Loaded',
        description: 'All research analytics data has been loaded successfully.',
        placement: 'topRight'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load research data';
      setError(errorMessage);
      notification.error({
        message: 'Error Loading Research Data',
        description: errorMessage,
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    loadAllResearchData();
  }, [loadAllResearchData]);

  const renderResearchOverview = (dashboard: ComprehensiveResearchDashboard) => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Research Questions"
            value={dashboard.researchOverview?.totalResearchQuestions || 0}
            prefix={<BookOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Data Points"
            value={formatNumber(dashboard.researchOverview?.dataPoints || 0)}
            prefix={<DatabaseOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Benchmark Variants"
            value={dashboard.researchOverview?.benchmarkVariants || 0}
            prefix={<ExperimentOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Research Grade"
            value={dashboard.researchOverview?.researchGrade || 'N/A'}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderStakeholderComposition = (analysis: StakeholderCompositionAnalysis) => {
    const pieData = Object.entries(analysis.analysis?.roleDistribution || {}).map(([role, count]) => ({
      type: role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '),
      value: count,
      percentage: ((count / (analysis.analysis?.totalStakeholders || 1)) * 100).toFixed(1)
    }));

    const pieConfig = {
      data: pieData,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      color: ['#1890ff', '#52c41a', '#fa8c16'],
      label: {
        type: 'outer',
        content: '{name}: {percentage}%',
        style: {
          fontSize: 12,
          fontWeight: 'bold'
        }
      },
      legend: {
        position: 'bottom' as const,
        itemName: {
          style: {
            fontSize: 12,
            fontWeight: 'bold'
          }
        }
      }
    };

    const getMetricColor = (value: number, type: 'time' | 'score' | 'rate') => {
      if (type === 'time') return value < 100 ? '#52c41a' : value < 200 ? '#fa8c16' : '#ff4d4f';
      if (type === 'score') return value >= 8 ? '#52c41a' : value >= 6 ? '#fa8c16' : '#ff4d4f';
      if (type === 'rate') return value >= 80 ? '#52c41a' : value >= 60 ? '#fa8c16' : '#ff4d4f';
      return '#1890ff';
    };

    return (
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card 
            title="Stakeholder Distribution" 
            extra={<PieChartOutlined style={{ color: '#1890ff' }} />}
            style={{ height: '100%' }}
          >
            <Pie {...pieConfig} />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">Total Stakeholders: {analysis.analysis?.totalStakeholders || 0}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Effectiveness Metrics" style={{ height: '100%' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>Participation Rate</Text>
                  <Text strong style={{ fontSize: 16, color: getMetricColor(analysis.analysis?.effectivenessMetrics?.participationRate || 0, 'rate') }}>
                    {analysis.analysis?.effectivenessMetrics?.participationRate || 0}%
                  </Text>
                </div>
                <Progress 
                  percent={analysis.analysis?.effectivenessMetrics?.participationRate || 0} 
                  strokeColor={getMetricColor(analysis.analysis?.effectivenessMetrics?.participationRate || 0, 'rate')}
                  trailColor="#f0f0f0"
                  strokeWidth={8}
                />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>Consensus Time</Text>
                  <Text strong style={{ fontSize: 18, color: getMetricColor(analysis.analysis?.effectivenessMetrics?.consensusTime || 0, 'time') }}>
                    {analysis.analysis?.effectivenessMetrics?.consensusTime || 0}s
                  </Text>
                </div>
                <div style={{ 
                  background: '#f6ffed', 
                  border: '1px solid #b7eb8f', 
                  borderRadius: 6, 
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <Text type="secondary">Average time to reach consensus</Text>
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>Satisfaction Score</Text>
                  <Text strong style={{ fontSize: 18, color: getMetricColor(analysis.analysis?.effectivenessMetrics?.satisfactionScore || 0, 'score') }}>
                    {analysis.analysis?.effectivenessMetrics?.satisfactionScore || 0}/10
                  </Text>
                </div>
                <div style={{ 
                  background: '#f6ffed', 
                  border: '1px solid #b7eb8f', 
                  borderRadius: 6, 
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <Text type="secondary">Stakeholder satisfaction rating</Text>
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>Conflict Resolution Rate</Text>
                  <Text strong style={{ fontSize: 16, color: getMetricColor(analysis.analysis?.effectivenessMetrics?.conflictResolutionRate || 0, 'rate') }}>
                    {analysis.analysis?.effectivenessMetrics?.conflictResolutionRate || 0}%
                  </Text>
                </div>
                <Progress 
                  percent={analysis.analysis?.effectivenessMetrics?.conflictResolutionRate || 0} 
                  strokeColor={getMetricColor(analysis.analysis?.effectivenessMetrics?.conflictResolutionRate || 0, 'rate')}
                  trailColor="#f0f0f0"
                  strokeWidth={8}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderMethodComparison = (analysis: MethodComparisonAnalysis) => {
    const comparisonData = [
      { method: analysis.analysis?.ourMethod?.name || 'Our Method', ...(analysis.analysis?.ourMethod || {}) },
      ...(analysis.analysis?.benchmarks || [])
    ];

    const columnConfig = {
      data: comparisonData,
      xField: 'method',
      yField: 'satisfaction',
      color: '#1890ff',
      label: {
        position: 'top' as const,
        formatter: (datum: any) => `${datum.satisfaction.toFixed(1)}`
      }
    };

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Method Comparison - Satisfaction Scores" extra={<BarChartOutlined />}>
            <Column {...columnConfig} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Statistical Analysis">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong>Our Method Performance</Text>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="TTC">{analysis.analysis?.ourMethod?.ttc || 0}s</Descriptions.Item>
                  <Descriptions.Item label="Satisfaction">{analysis.analysis?.ourMethod?.satisfaction || 0}/10</Descriptions.Item>
                  <Descriptions.Item label="Success Rate">{analysis.analysis?.ourMethod?.successRate || 0}%</Descriptions.Item>
                  <Descriptions.Item label="Fairness Index">{analysis.analysis?.ourMethod?.fairnessIndex || 0}</Descriptions.Item>
                </Descriptions>
              </div>
              <div>
                <Text strong>Statistical Significance</Text>
                <Text type="secondary">{analysis.statisticalAnalysis?.ttest || 'Statistical analysis not available'}</Text>
                <br />
                <Text type="secondary">{analysis.statisticalAnalysis?.effectSize || 'Effect size analysis pending'}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderSuccessFactors = (analysis: SuccessFactorsAnalysis) => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="System Factors" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Conflict Detection</Text>
              <br />
              <Tag color="green">Enabled</Tag>
              <br />
              <Text type="secondary">{analysis.analysis?.systemFactors?.conflictDetection?.impact || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Blockchain Transparency</Text>
              <br />
              <Tag color="green">Enabled</Tag>
              <br />
              <Text type="secondary">{analysis.analysis?.systemFactors?.blockchainTransparency?.impact || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Real-Time Tracking</Text>
              <br />
              <Tag color="green">Enabled</Tag>
              <br />
              <Text type="secondary">{analysis.analysis?.systemFactors?.realTimeTracking?.impact || 'N/A'}</Text>
            </div>
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card title="Process Factors" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Round-Robin Fairness</Text>
              <br />
              <Text type="secondary">{analysis.analysis?.processFactors?.roundRobinFairness?.impact || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Swing Weighting</Text>
              <br />
              <Text type="secondary">{analysis.analysis?.processFactors?.swingWeighting?.impact || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Nash Bargaining</Text>
              <br />
              <Text type="secondary">{analysis.analysis?.processFactors?.nashBargaining?.impact || 'N/A'}</Text>
            </div>
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card title="Stakeholder Factors" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Statistic
              title="Participation Rate"
              value={formatPercentage(analysis.analysis?.stakeholderFactors?.participationRate || 0)}
              valueStyle={{ color: '#52c41a' }}
            />
            <Statistic
              title="Engagement Level"
              value={analysis.analysis?.stakeholderFactors?.engagementLevel || 'N/A'}
              valueStyle={{ color: '#1890ff' }}
            />
            <Statistic
              title="Satisfaction Score"
              value={analysis.analysis?.stakeholderFactors?.satisfactionScore || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Space>
        </Card>
      </Col>
    </Row>
  );

  const renderPredictiveMetrics = (analysis: PredictiveMetricsAnalysis) => {
    console.log('Predictive Metrics Analysis:', analysis);
    console.log('Early Indicators:', analysis.analysis?.earlyIndicators);
    
    const earlyIndicators = Object.entries(analysis.analysis?.earlyIndicators || {}).map(([metric, data]) => ({
      metric,
      correlation: data.correlation,
      threshold: data.threshold,
      strength: calculateCorrelationStrength(data.correlation)
    }));

    console.log('Processed Early Indicators:', earlyIndicators);

    const scatterData = earlyIndicators.map(item => ({
      x: item.correlation,
      y: item.threshold,
      category: item.metric,
      strength: item.strength
    }));

    console.log('Scatter Data:', scatterData);

    const scatterConfig = {
      data: scatterData,
      xField: 'x',
      yField: 'y',
      colorField: 'strength',
      size: 6,
      point: {
        shape: 'circle'
      },
      label: {
        fields: ['category'],
        position: 'top'
      }
    };

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Predictive Metrics Correlation" extra={<Scatter />}>
            {scatterData && scatterData.length > 0 ? (
              <Scatter {...scatterConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">No data available for scatter plot</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Model Accuracy">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title="Overall Accuracy"
                value={formatPercentage(analysis.analysis?.modelAccuracy?.overallAccuracy || 0)}
                valueStyle={{ color: '#52c41a' }}
              />
              <Statistic
                title="Precision"
                value={(analysis.analysis?.modelAccuracy?.precision || 0).toFixed(3)}
                valueStyle={{ color: '#1890ff' }}
              />
              <Statistic
                title="Recall"
                value={(analysis.analysis?.modelAccuracy?.recall || 0).toFixed(3)}
                valueStyle={{ color: '#722ed1' }}
              />
              <Statistic
                title="F1 Score"
                value={(analysis.analysis?.modelAccuracy?.f1Score || 0).toFixed(3)}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderJustificationReport = (title: string, insights: string[], recommendations: string[]) => (
    <Card title={`${title} - Justification Report`} extra={<FileTextOutlined />}>
      <Collapse>
        <Panel header="Key Insights" key="insights">
          <List
            dataSource={insights}
            renderItem={(item) => (
              <List.Item>
                <BulbOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                {item}
              </List.Item>
            )}
          />
        </Panel>
        <Panel header="Recommendations" key="recommendations">
          <List
            dataSource={recommendations}
            renderItem={(item) => (
              <List.Item>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                {item}
              </List.Item>
            )}
          />
        </Panel>
      </Collapse>
    </Card>
  );

  if (loading && !dashboard) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>Loading comprehensive research analytics...</Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Research Analytics"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={loadAllResearchData}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!dashboard) {
    return (
      <Alert
        message="No Research Data Available"
        description="Unable to load research analytics data."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <App>
      <div style={{ 
        padding: '24px', 
        background: '#f5f5f5', 
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <div style={{ 
          marginBottom: 32, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0'
        }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1f1f1f', fontWeight: 600 }}>
              Research Analytics Dashboard
            </Title>
            <Paragraph type="secondary" style={{ margin: '8px 0 0 0', fontSize: 16 }}>
              Comprehensive research analysis with data visualization and justification reports
            </Paragraph>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<SyncOutlined />} 
              onClick={loadAllResearchData}
              loading={loading}
              size="large"
              style={{ 
                background: '#1890ff',
                borderColor: '#1890ff',
                fontWeight: 500,
                height: '40px',
                paddingLeft: '20px',
                paddingRight: '20px'
              }}
            >
              Refresh Data
            </Button>
          </Space>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          type="card"
          style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #f0f0f0',
            overflow: 'hidden'
          }}
          tabBarStyle={{
            background: '#fafafa',
            margin: 0,
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0'
          }}
          items={[
            {
              key: 'overview',
              label: 'Research Overview',
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {renderResearchOverview(dashboard)}
                  
                  <Card 
                    title="Research Questions" 
                    style={{ 
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px solid #f0f0f0'
                    }}
                    headStyle={{
                      background: '#fafafa',
                      borderBottom: '1px solid #f0f0f0',
                      fontWeight: 600,
                      fontSize: 16
                    }}
                  >
                    <List
                      dataSource={[
                        "How does stakeholder composition affect negotiation outcomes?",
                        "Which grouping strategy performs best?",
                        "What factors contribute to negotiation success?",
                        "How do different stakeholder groups behave during negotiations?",
                        "What is the impact of blockchain on negotiation outcomes?",
                        "What metrics can predict negotiation success?",
                        "How effective are different conflict resolution methods?",
                        "How do stakeholder relationships evolve over time?"
                      ]}
                      renderItem={(item, index) => (
                        <List.Item style={{ 
                          padding: '12px 0',
                          borderBottom: '1px solid #f5f5f5'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div style={{
                              background: '#1890ff',
                              color: 'white',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              marginRight: '12px',
                              minWidth: '32px',
                              textAlign: 'center'
                            }}>
                              RQ{index + 1}
                            </div>
                            <Text style={{ fontSize: 15, lineHeight: 1.5 }}>{item}</Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>

                  <Card title="Research Questions & Supporting Analysis">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Card size="small" title="Research Questions 1-4">
                          <List
                            dataSource={[
                              { rq: "RQ1: Stakeholder Composition", analysis: "Stakeholder Composition Tab", description: "Role distribution, participation rates, consensus metrics" },
                              { rq: "RQ2: Method Comparison", analysis: "Method Comparison Tab", description: "Performance vs benchmarks, statistical significance" },
                              { rq: "RQ3: Success Factors", analysis: "Success Factors Tab", description: "System, process, and stakeholder factors" },
                              { rq: "RQ4: Stakeholder Behavior", analysis: "Stakeholder Behavior Tab", description: "Participation patterns, negotiation styles" }
                            ]}
                            renderItem={(item) => (
                              <List.Item>
                                <div>
                                  <Text strong>{item.rq}</Text>
                                  <br />
                                  <Text type="secondary">{item.analysis}: {item.description}</Text>
                                </div>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} md={12}>
                        <Card size="small" title="Research Questions 5-8">
                          <List
                            dataSource={[
                              { rq: "RQ5: Blockchain Impact", analysis: "Blockchain Impact Tab", description: "Trust metrics, transparency, security benefits" },
                              { rq: "RQ6: Predictive Metrics", analysis: "Predictive Metrics Tab", description: "Early indicators, model accuracy, correlations" },
                              { rq: "RQ7: Conflict Resolution", analysis: "Conflict Resolution Tab", description: "Resolution methods, effectiveness metrics" },
                              { rq: "RQ8: Longitudinal Analysis", analysis: "Longitudinal Analysis Tab", description: "Temporal patterns, relationship evolution" }
                            ]}
                            renderItem={(item) => (
                              <List.Item>
                                <div>
                                  <Text strong>{item.rq}</Text>
                                  <br />
                                  <Text type="secondary">{item.analysis}: {item.description}</Text>
                                </div>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </Card>

                  <Card title="Key Research Findings">
                    <List
                      dataSource={dashboard.keyFindings}
                      renderItem={(item) => (
                        <List.Item>
                          <TrophyOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          {item}
                        </List.Item>
                      )}
                    />
                  </Card>

                  <Card title="Research Impact">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Card size="small" title="Theoretical Contributions">
                          <List
                            dataSource={dashboard.researchImpact.theoreticalContributions}
                            renderItem={(item) => (
                              <List.Item>
                                <BookOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                                {item}
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} md={8}>
                        <Card size="small" title="Practical Applications">
                          <List
                            dataSource={dashboard.researchImpact.practicalApplications}
                            renderItem={(item) => (
                              <List.Item>
                                <ExperimentOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                                {item}
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} md={8}>
                        <Card size="small" title="Methodological Innovations">
                          <List
                            dataSource={dashboard.researchImpact.methodologicalInnovations}
                            renderItem={(item) => (
                              <List.Item>
                                <RiseOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                                {item}
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </Card>
                </Space>
              )
            },
            {
              key: 'stakeholder',
              label: 'Stakeholder Composition',
              children: stakeholderAnalysis && (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {renderStakeholderComposition(stakeholderAnalysis)}
                  {renderJustificationReport(
                    "Stakeholder Composition Analysis",
                    stakeholderAnalysis.insights,
                    stakeholderAnalysis.recommendations
                  )}
                </Space>
              )
            },
            {
              key: 'methods',
              label: 'Method Comparison',
              children: methodComparison && (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {renderMethodComparison(methodComparison)}
                  {renderJustificationReport(
                    "Method Comparison Analysis",
                    methodComparison.insights,
                    methodComparison.insights // Using insights as recommendations for this analysis
                  )}
                </Space>
              )
            },
            {
              key: 'success',
              label: 'Success Factors',
              children: successFactors && (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {renderSuccessFactors(successFactors)}
                  {renderJustificationReport(
                    "Success Factors Analysis",
                    successFactors.insights,
                    successFactors.recommendations
                  )}
                </Space>
              )
            },
            {
              key: 'predictive',
              label: 'Predictive Metrics',
              children: predictiveMetrics && (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {console.log('predictiveMetrics data:', predictiveMetrics)}
                  {renderPredictiveMetrics(predictiveMetrics)}
                  {renderJustificationReport(
                    "Predictive Metrics Analysis",
                    predictiveMetrics.insights,
                    predictiveMetrics.recommendations
                  )}
                </Space>
              )
            },
            {
              key: 'blockchain',
              label: 'Blockchain Impact',
              children: blockchainImpact && (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card title="Blockchain Trust Metrics">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Stakeholder Confidence"
                          value={formatPercentage(blockchainImpact.analysis?.trustMetrics?.stakeholderConfidence || 0)}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Transparency Rating"
                          value={blockchainImpact.analysis?.trustMetrics?.transparencyRating || 0}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Audit Trail Completeness"
                          value={formatPercentage(blockchainImpact.analysis?.trustMetrics?.auditTrailCompleteness || 0)}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Verification Success"
                          value={formatPercentage(blockchainImpact.analysis?.trustMetrics?.verificationSuccess || 0)}
                          valueStyle={{ color: '#fa8c16' }}
                        />
                      </Col>
                    </Row>
                  </Card>
                  {renderJustificationReport(
                    "Blockchain Impact Analysis",
                    blockchainImpact.insights,
                    blockchainImpact.recommendations
                  )}
                </Space>
              )
            }
          ]}
        />
      </div>
    </App>
  );
};

export default ResearchAnalyticsPage;