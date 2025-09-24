// src/components/PreferenceElicitation.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Slider, 
  Button, 
  Space, 
  Alert, 
  Progress, 
  Radio, 
  Checkbox, 
  Row, 
  Col,
  App,
  Divider,
  Tooltip,
  Modal,
  Input
} from 'antd';
import { 
  InfoCircleOutlined, 
  CheckCircleOutlined, 
  BarChartOutlined,
} from '@ant-design/icons';
import { 
  submitPreferences, 
  updatePreferences, 
  getUserPreferences,
  extractPreferencesFromProposal,
  analyzeProposalForPreferences,
  normalizePreferences,
  validatePreferences,
  generateDefaultPreferences,
  getElicitationMethods,
  type PreferenceSubmission,
  type PreferenceElicitationMethod
} from '../services/preferenceService';
import type { User } from '../services/authService';

const { Title, Text, Paragraph } = Typography;

interface PreferenceElicitationProps {
  proposalId: string;
  proposalTitle: string;
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PreferenceElicitation: React.FC<PreferenceElicitationProps> = ({
  proposalId,
  proposalTitle,
  user,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(false);
  const [existingPreferences, setExistingPreferences] = useState<any>(null);
    const [elicitationMethod, setElicitationMethod] = useState<PreferenceElicitationMethod | null>(null);
    const [preferences, setPreferences] = useState<Record<string, number>>({});
    const [step, setStep] = useState(1);
    const [extractionAnalysis, setExtractionAnalysis] = useState<any>(null);
    const [showExtractionAnalysis, setShowExtractionAnalysis] = useState(false);
  
  const methods = getElicitationMethods();
  const criteria = ['cost', 'timeline', 'quality', 'usability', 'security'];
  
  useEffect(() => {
    // Load existing preferences if any
    loadExistingPreferences();
    
    // Set default method
    setElicitationMethod(methods[0]);
    
    // Generate default preferences based on user role
    const defaultPrefs = generateDefaultPreferences(user.role);
    setPreferences(defaultPrefs);
    form.setFieldsValue({ preferences: defaultPrefs });
  }, [proposalId, user.role]);

  const loadExistingPreferences = async () => {
    try {
      const existing = await getUserPreferences(proposalId);
      if (existing) {
        setExistingPreferences(existing);
        setPreferences(existing.priorities);
        form.setFieldsValue({ 
          preferences: existing.priorities,
          rationale: existing.rationale 
        });
      }
    } catch (error) {
      console.error('Error loading existing preferences:', error);
    }
  };

  const handleMethodChange = (method: PreferenceElicitationMethod) => {
    setElicitationMethod(method);
    setStep(1);
  };

  const handleExtractPreferences = async () => {
    try {
      setLoading(true);
      message.loading('Analyzing proposal content with AI...', 0);
      
      const extraction = await extractPreferencesFromProposal(proposalId, {
        userRole: user.role,
        forceRegenerate: false
      });
      
      if (extraction.extracted) {
        setPreferences(extraction.preferences.priorities);
        form.setFieldsValue({ 
          preferences: extraction.preferences.priorities,
          rationale: extraction.preferences.rationale 
        });
        
        message.destroy();
        message.success(`Preferences extracted with ${(extraction.extraction.confidence * 100).toFixed(1)}% confidence!`);
        
        // Show extraction analysis
        setExtractionAnalysis(extraction.extraction);
        setShowExtractionAnalysis(true);
      } else {
        message.destroy();
        message.info('Preferences already exist for this proposal');
      }
    } catch (error: any) {
      message.destroy();
      message.error(error.message || 'Failed to extract preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeProposal = async () => {
    try {
      setLoading(true);
      const analysis = await analyzeProposalForPreferences(proposalId, user.role);
      setExtractionAnalysis(analysis);
      setShowExtractionAnalysis(true);
    } catch (error: any) {
      message.error(error.message || 'Failed to analyze proposal');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (criterion: string, value: number) => {
    const newPreferences = { ...preferences, [criterion]: value };
    setPreferences(newPreferences);
    form.setFieldsValue({ preferences: newPreferences });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Validate preferences
      const validation = validatePreferences(values.preferences);
      if (!validation.valid) {
        message.error(validation.errors.join(', '));
        return;
      }
      
      // Normalize preferences
      const normalizedPrefs = normalizePreferences(values.preferences);
      
      const submission: PreferenceSubmission = {
        priorities: normalizedPrefs,
        rationale: values.rationale || '',
        pushOnChain: false
      };
      
      if (existingPreferences) {
        await updatePreferences(proposalId, submission);
        message.success('Preferences updated successfully!');
      } else {
        await submitPreferences(proposalId, submission);
        message.success('Preferences submitted successfully!');
      }
      
      onSuccess?.();
    } catch (error: any) {
      message.error(error.message || 'Failed to submit preferences');
    } finally {
      setLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <Card title="Choose Preference Elicitation Method" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<BarChartOutlined />}
            onClick={handleExtractPreferences}
            loading={loading}
          >
            🤖 Extract with AI
          </Button>
          <Button 
            type="default" 
            icon={<InfoCircleOutlined />}
            onClick={handleAnalyzeProposal}
            loading={loading}
          >
            Analyze Proposal
          </Button>
        </Space>
        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          AI can analyze the proposal content to automatically extract your preferences, or you can choose a manual method below.
        </Paragraph>
      </div>
      
      <Radio.Group 
        value={elicitationMethod?.name} 
        onChange={(e) => {
          const method = methods.find(m => m.name === e.target.value);
          if (method) handleMethodChange(method);
        }}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {methods.map(method => (
            <Radio key={method.name} value={method.name} style={{ width: '100%' }}>
              <div>
                <Text strong>{method.name}</Text>
                <br />
                <Text type="secondary">{method.description}</Text>
              </div>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </Card>
  );

  const renderPairwiseComparison = () => (
    <Card title="Pairwise Comparison" style={{ marginBottom: 24 }}>
      <Paragraph type="secondary">
        Compare each pair of criteria. For each pair, indicate which is more important and by how much.
      </Paragraph>
      
      <Form.Item label="Cost vs Timeline">
        <Radio.Group>
          <Radio value="cost">Cost is much more important</Radio>
          <Radio value="cost-some">Cost is somewhat more important</Radio>
          <Radio value="equal">Equally important</Radio>
          <Radio value="timeline-some">Timeline is somewhat more important</Radio>
          <Radio value="timeline">Timeline is much more important</Radio>
        </Radio.Group>
      </Form.Item>
      
      {/* Add more pairwise comparisons */}
      <Alert 
        message="Pairwise comparison interface will be expanded in future iterations"
        type="info" 
        showIcon 
      />
    </Card>
  );

  const renderDirectRating = () => (
    <Card title="Direct Rating" style={{ marginBottom: 24 }}>
      <Paragraph type="secondary">
        Rate each criterion on a scale from 1 (least important) to 10 (most important).
      </Paragraph>
      
      {criteria.map(criterion => (
        <Form.Item 
          key={criterion} 
          label={
            <Space>
              <Text strong style={{ textTransform: 'capitalize' }}>{criterion}</Text>
              <Tooltip title={`Rate the importance of ${criterion} for this proposal`}>
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          }
        >
          <Slider
            min={1}
            max={10}
            value={preferences[criterion] * 10 || 5}
            onChange={(value) => handlePreferenceChange(criterion, value / 10)}
            marks={{
              1: '1',
              5: '5',
              10: '10'
            }}
            tooltip={{ formatter: (value) => `${value}/10` }}
          />
        </Form.Item>
      ))}
    </Card>
  );

  const renderRanking = () => (
    <Card title="Ranking" style={{ marginBottom: 24 }}>
      <Paragraph type="secondary">
        Rank the criteria from most important (1) to least important ({criteria.length}).
      </Paragraph>
      
      <Form.Item label="Rank the criteria">
        <Checkbox.Group 
          value={Object.keys(preferences).sort((a, b) => preferences[b] - preferences[a])}
          onChange={(values) => {
            const newPrefs: Record<string, number> = {};
            values.forEach((value, index) => {
              newPrefs[value as string] = (criteria.length - index) / criteria.length;
            });
            setPreferences(newPrefs);
            form.setFieldsValue({ preferences: newPrefs });
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {criteria.map(criterion => (
              <Checkbox key={criterion} value={criterion}>
                <Text style={{ textTransform: 'capitalize' }}>{criterion}</Text>
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Form.Item>
    </Card>
  );

  const renderChoiceExperiment = () => (
    <Card title="Choice Experiment" style={{ marginBottom: 24 }}>
      <Paragraph type="secondary">
        Choose between different proposal scenarios to reveal your preferences.
      </Paragraph>
      
      <Alert 
        message="Choice experiment interface will be implemented in future iterations"
        type="info" 
        showIcon 
      />
    </Card>
  );

  const renderElicitationInterface = () => {
    if (!elicitationMethod) return null;
    
    switch (elicitationMethod.type) {
      case 'pairwise':
        return renderPairwiseComparison();
      case 'rating':
        return renderDirectRating();
      case 'ranking':
        return renderRanking();
      case 'choice':
        return renderChoiceExperiment();
      default:
        return renderDirectRating();
    }
  };

  const renderSummary = () => (
    <Card title="Preference Summary" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        {Object.entries(preferences).map(([criterion, value]) => (
          <Col key={criterion} span={8}>
            <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
              <Text strong style={{ textTransform: 'capitalize' }}>{criterion}</Text>
              <br />
              <Text type="secondary">{(value * 100).toFixed(1)}%</Text>
              <br />
              <Progress 
                percent={value * 100} 
                size="small" 
                showInfo={false}
                strokeColor="#1890ff"
              />
            </div>
          </Col>
        ))}
      </Row>
      
      <Divider />
      
      <Form.Item 
        label="Rationale (Optional)"
        name="rationale"
        tooltip="Explain why you prioritized these criteria"
      >
        <Input.TextArea 
          rows={3} 
          placeholder="Explain your reasoning for these preferences..."
        />
      </Form.Item>
    </Card>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ marginBottom: 8 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          Preference Elicitation
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Help us understand your priorities for: <Text strong>"{proposalTitle}"</Text>
        </Paragraph>
        
        {existingPreferences && (
          <Alert
            message="You have already submitted preferences for this proposal"
            description="You can update your preferences below"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ preferences }}
        >
          {step === 1 && renderMethodSelection()}
          
          {step === 2 && renderElicitationInterface()}
          
          {step === 3 && renderSummary()}
          
          <Form.Item name="preferences" hidden>
            <input />
          </Form.Item>
          
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              {onCancel && (
                <Button onClick={onCancel}>
                  Cancel
                </Button>
              )}
              
              {step > 1 && (
                <Button onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
              
              {step < 3 ? (
                <Button type="primary" onClick={() => setStep(step + 1)}>
                  Next
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  {existingPreferences ? 'Update Preferences' : 'Submit Preferences'}
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Card>
      
      {/* Extraction Analysis Modal */}
      <Modal
        title="AI Preference Analysis"
        open={showExtractionAnalysis}
        onCancel={() => setShowExtractionAnalysis(false)}
        footer={[
          <Button key="close" onClick={() => setShowExtractionAnalysis(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {extractionAnalysis && (
          <div>
            <Card title="Analysis Results" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Confidence: </Text>
                  <Text>{((extractionAnalysis.confidence || 0) * 100).toFixed(1)}%</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Method: </Text>
                  <Text>{extractionAnalysis.method || 'nlp-extraction'}</Text>
                </Col>
              </Row>
            </Card>
            
            {extractionAnalysis.analysis && (
              <Card title="Detailed Analysis" style={{ marginBottom: 16 }}>
                <Paragraph>
                  <Text strong>Rationale: </Text>
                  {extractionAnalysis.rationale || 'Analysis completed'}
                </Paragraph>
                
                {extractionAnalysis.analysis.nlp && (
                  <div>
                    <Text strong>NLP Analysis:</Text>
                    <ul>
                      <li>Sentiment Score: {extractionAnalysis.analysis.nlp.sentiment?.score?.toFixed(2) || 'N/A'}</li>
                      <li>Key Entities: {extractionAnalysis.analysis.nlp.entities?.length || 0} found</li>
                      <li>Sentences Analyzed: {extractionAnalysis.analysis.nlp.sentences?.length || 0}</li>
                    </ul>
                  </div>
                )}
                
                {extractionAnalysis.analysis.keywords && (
                  <div>
                    <Text strong>Keyword Analysis:</Text>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      {Object.entries(extractionAnalysis.analysis.keywords).map(([criterion, score]) => (
                        <Col key={criterion} span={8}>
                          <div style={{ textAlign: 'center', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                            <Text strong style={{ textTransform: 'capitalize' }}>{criterion}</Text>
                            <br />
                            <Text type="secondary">Score: {Number(score).toFixed(2)}</Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PreferenceElicitation;
