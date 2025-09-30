// src/components/NLPAnalysis.tsx
import React from 'react';
import { Card, Row, Col, Statistic, Tag, Progress, List, Typography, Space, Divider, Alert, Spin } from 'antd';
import { 
  BulbOutlined, 
  HeartOutlined, 
  SearchOutlined, 
  FileTextOutlined, 
  BarChartOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface NLPAnalysisProps {
  analysis: {
    sentiment: {
      score: number;
      magnitude: number;
      label: string;
    };
    entities: Array<{
      name: string;
      type: string;
      salience: number;
      mentions: number;
    }>;
    keywords: string[];
    syntax: {
      sentences: number;
      tokens: number;
      avgSentenceLength: number;
    };
    classification: Array<{
      name: string;
      confidence: number;
    }>;
    complexityScore: number;
    keyPhrases: string[];
    insights: string[];
    metadata: {
      textLength: number;
      wordCount: number;
      analysisTimestamp: string;
    };
  };
  loading?: boolean;
  error?: string;
}

const NLPAnalysis: React.FC<NLPAnalysisProps> = ({ analysis, loading, error }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Analyzing proposal content...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Analysis Error"
        description={error}
        type="error"
        showIcon
        icon={<WarningOutlined />}
      />
    );
  }

  if (!analysis) {
    return (
      <Alert
        message="No Analysis Available"
        description="NLP analysis has not been performed on this proposal yet."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
      />
    );
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return '#52c41a'; // green
    if (score < -0.1) return '#ff4d4f'; // red
    return '#faad14'; // orange
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'negative': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      default: return <InfoCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getComplexityColor = (score: number) => {
    if (score > 0.7) return '#ff4d4f'; // red
    if (score > 0.4) return '#faad14'; // orange
    return '#52c41a'; // green
  };

  const getComplexityLabel = (score: number) => {
    if (score > 0.7) return 'High';
    if (score > 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <BulbOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        NLP Analysis Results
      </Title>

      {/* Overview Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sentiment"
              value={analysis.sentiment.label}
              prefix={getSentimentIcon(analysis.sentiment.label)}
              valueStyle={{ color: getSentimentColor(analysis.sentiment.score) }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Score: {analysis.sentiment.score.toFixed(2)} | Magnitude: {analysis.sentiment.magnitude.toFixed(2)}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Complexity"
              value={getComplexityLabel(analysis.complexityScore)}
              valueStyle={{ color: getComplexityColor(analysis.complexityScore) }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={Math.round(analysis.complexityScore * 100)} 
                size="small" 
                strokeColor={getComplexityColor(analysis.complexityScore)}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Word Count"
              value={analysis.metadata.wordCount}
              prefix={<FileTextOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {analysis.syntax.sentences} sentences
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Entities Found"
              value={analysis.entities.length}
              prefix={<SearchOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {analysis.keywords.length} keywords
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Key Insights */}
      {analysis.insights.length > 0 && (
        <Card title="Key Insights" style={{ marginBottom: 24 }}>
          <List
            dataSource={analysis.insights}
            renderItem={(insight) => (
              <List.Item>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>{insight}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {/* Keywords */}
        <Col xs={24} lg={12}>
          <Card title="Keywords" size="small">
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {analysis.keywords.map((keyword, index) => (
                <Tag key={index} color="blue" style={{ margin: '2px' }}>
                  {keyword}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>

        {/* Key Phrases */}
        <Col xs={24} lg={12}>
          <Card title="Key Phrases" size="small">
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {analysis.keyPhrases.map((phrase, index) => (
                <Tag key={index} color="green" style={{ margin: '2px' }}>
                  {phrase}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Top Entities */}
      <Card title="Top Entities" size="small">
        <List
          dataSource={analysis.entities.slice(0, 10)}
          renderItem={(entity) => (
            <List.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text strong>{entity.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {entity.type} • {entity.mentions} mentions
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Progress 
                    percent={Math.round(entity.salience * 100)} 
                    size="small" 
                    style={{ width: 100 }}
                  />
                  <br />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {entity.salience.toFixed(3)}
                  </Text>
                </div>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      {/* Classification */}
      {analysis.classification.length > 0 && (
        <Card title="Content Classification" size="small" style={{ marginTop: 16 }}>
          <List
            dataSource={analysis.classification}
            renderItem={(category) => (
              <List.Item>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{category.name}</Text>
                  <div>
                    <Progress 
                      percent={Math.round(category.confidence * 100)} 
                      size="small" 
                      style={{ width: 100 }}
                    />
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {category.confidence.toFixed(3)}
                    </Text>
                  </div>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Analysis Metadata */}
      <Card title="Analysis Details" size="small" style={{ marginTop: 16 }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text type="secondary">Analysis Timestamp:</Text>
            <br />
            <Text>{new Date(analysis.metadata.analysisTimestamp).toLocaleString()}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Text Length:</Text>
            <br />
            <Text>{analysis.metadata.textLength} characters</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Average Sentence Length:</Text>
            <br />
            <Text>{analysis.syntax.avgSentenceLength.toFixed(1)} words</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Total Tokens:</Text>
            <br />
            <Text>{analysis.syntax.tokens}</Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default NLPAnalysis;
