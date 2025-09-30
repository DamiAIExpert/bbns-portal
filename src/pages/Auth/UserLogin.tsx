import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Input, Button, Card, Typography, Alert, Avatar, App, Row, Col, Space } from 'antd';
import { MailOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { loginUser } from '../../services/authService';
import type { LoginCredentials } from '../../services/authService';
import studentLoginImage from '../../assets/images/student_login.svg'; // Ensure this image exists

const { Title, Paragraph, Text } = Typography;

// --- STYLED COMPONENTS ---

const LoginWrapper = styled(Row)`
  min-height: 100vh;
  background-color: #ffffff;
`;

const IllustrationPanel = styled(Col)`
  background: #f0f5ff; // A light, welcoming blue
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px;

  // This media query hides the illustration panel on screens smaller than 992px (tablets and phones)
  @media (max-width: 992px) {
    display: none;
  }
`;

const FormPanel = styled(Col)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  box-shadow: none; // A cleaner look without shadows
  border: none;
`;

// --- COMPONENT ---
const UserLogin: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [greeting, setGreeting] = useState('Welcome Back!');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning!');
    else if (hour < 18) setGreeting('Good Afternoon!');
    else setGreeting('Good Evening!');
  }, []);
  
  const onFinish = async (values: LoginCredentials) => {
    setLoading(true);
    setError('');
    try {
      const response = await loginUser(values);

      if (response?.token && response?.user) {
        message.success('Login Successful! Redirecting...');
        
        setTimeout(() => {
          // Redirect based on the user's role
          navigate(response.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginWrapper>
      {/* Left Panel: This will only be visible on large screens (lg) */}
      <IllustrationPanel xs={0} lg={12}>
        <div style={{ textAlign: 'center', maxWidth: '450px' }}>
          <img 
            src={studentLoginImage} 
            alt="Stakeholders collaborating" 
            style={{ width: '100%', marginBottom: '24px' }} 
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <Title level={2}>Blockchain-Based Negotiation System</Title>
          <Paragraph type="secondary">
            A secure and transparent platform for requirement analysis and decision-making.
          </Paragraph>
        </div>
      </IllustrationPanel>

      {/* Right Panel: This will take up the full width on small screens (xs) and half on large screens (lg) */}
      <FormPanel xs={24} lg={12}>
        <LoginCard>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Avatar size={64} icon={<TeamOutlined />} style={{ backgroundColor: '#27ae60', marginBottom: '16px' }} />
            <Title level={3}>{greeting}</Title>
            <Text type="secondary">Sign in to the BBNS Portal.</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ marginBottom: '24px' }} />}

          <Form name="user_login" onFinish={onFinish} size="large" layout="vertical" requiredMark={false}>
            <Form.Item
              name="email"
              label="Email Address"
              rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="your.email@example.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form.Item>
            
            <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                <Link to="/forgot-password">Forgot Password?</Link>
                <Text>
                    Don't have an account? <Link to="/register">Register Now</Link>
                </Text>
            </Space>
          </Form>
        </LoginCard>
      </FormPanel>
    </LoginWrapper>
  );
};

export default UserLogin;
