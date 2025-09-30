import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
// CORRECTED: The unused 'App' component has been removed from this import.
import { Form, Input, Button, Card, Typography, Alert, Avatar } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { forgotPassword } from '../../services/authService';

const { Title, Text } = Typography;

// --- STYLED COMPONENTS ---
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 16px; /* Added padding for mobile view */
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: none;
`;

// --- COMPONENT ---
const ForgotPassword = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await forgotPassword(values.email);
      setSuccess(response.message || 'If an account with that email exists, a password reset link has been sent.');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <StyledCard>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Avatar size={64} icon={<MailOutlined />} style={{ backgroundColor: '#27ae60', marginBottom: '16px' }} />
          <Title level={3}>Forgot Password?</Title>
          <Text type="secondary">Enter your email and we'll send you a link to reset your password.</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ marginBottom: '24px' }} />}
        {success && <Alert message={success} type="success" showIcon style={{ marginBottom: '24px' }} />}

        <Form name="forgot_password" onFinish={onFinish} size="large" layout="vertical" requiredMark={false}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="your.email@example.com" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </Form.Item>

          <Text style={{ textAlign: 'center', display: 'block' }}>
            <Link to="/login">Back to Login</Link>
          </Text>
        </Form>
      </StyledCard>
    </Wrapper>
  );
};

export default ForgotPassword;
