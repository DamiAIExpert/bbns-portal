import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Input, Button, Card, Typography, Alert, Avatar, App } from 'antd'; 
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { loginUser } from '../../services/authService';
import type { LoginCredentials } from '../../services/authService';

const { Title, Text } = Typography;

// --- STYLED COMPONENTS ---

const AdminLoginWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: none;
`;

// --- COMPONENT ---

const AdminLogin: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const onFinish = async (values: LoginCredentials) => {
    setError('');
    setLoading(true);
    try {
      const response = await loginUser(values);

      // CRITICAL: Verify that the logged-in user has the 'admin' role
      if (response?.token && response?.user?.role === 'admin') {
        message.success('Admin login successful! Redirecting...');
        
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1000);

      } else {
        // If the user is valid but not an admin, deny access
        if (response?.user?.role) {
            setError("Access Denied. This login form is for administrators only.");
        } else {
            setError("Invalid credentials. Please try again.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLoginWrapper>
      <LoginCard>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Avatar size={64} icon={<SafetyOutlined />} style={{ backgroundColor: '#27ae60', marginBottom: '16px' }} />
          <Title level={3}>{greeting}, Administrator</Title>
          <Text type="secondary">Please sign in to continue.</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ marginBottom: '24px' }} />}

        <Form name="admin_login" onFinish={onFinish} size="large" layout="vertical" requiredMark={false}>
          <Form.Item
            name="email"
            label="Admin Email Address"
            rules={[{ required: true, message: 'Please input your email!' }, { type: 'email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin.email@example.com" />
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
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </Form.Item>
          
            <div style={{ textAlign: 'center' }}>
                <Link to="/login">
                    Are you a user? Login here
                </Link>
            </div>
        </Form>
      </LoginCard>
    </AdminLoginWrapper>
  );
};

export default AdminLogin;
