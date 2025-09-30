import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Input, Button, Card, Typography, Alert, Avatar, App, Row, Col, Select } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
// Import both register and login functions
import { register, loginUser } from '../../services/authService';
import type { RegisterData } from '../../services/authService';
import registrationImage from '../../assets/images/student_login.svg';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// --- STYLED COMPONENTS ---

const RegisterWrapper = styled(Row)`
  min-height: 100vh;
  background-color: #ffffff;
`;

const IllustrationPanel = styled(Col)`
  background: #f0f5ff;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px;

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

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  box-shadow: none;
  border: none;
`;

// --- COMPONENT ---

const RegisterForm: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onFinish = async (values: RegisterData) => {
    setLoading(true);
    setError('');
    try {
      // Step 1: Register the new user
      await register(values);
      message.success('Registration successful! Logging you in...');

      // Step 2: Automatically log the user in with the same credentials
      const loginResponse = await loginUser({ email: values.email, password: values.password });

      // Step 3: Redirect to the requirement submission page
      if (loginResponse?.token && loginResponse?.user) {
        setTimeout(() => {
          navigate('/user/submit-proposal');
        }, 1500);
      } else {
        // Fallback if auto-login fails, send them to the login page
        navigate('/login');
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterWrapper>
      <IllustrationPanel xs={0} lg={12}>
        <div style={{ textAlign: 'center', maxWidth: '450px' }}>
          <img src={registrationImage} alt="Collaboration illustration" style={{ width: '100%', marginBottom: '24px' }} />
          <Title level={2}>Join the Negotiation Platform</Title>
          <Paragraph type="secondary">
            Create an account to start submitting requirements and collaborating with stakeholders.
          </Paragraph>
        </div>
      </IllustrationPanel>
      <FormPanel xs={24} lg={12}>
        <RegisterCard>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Avatar size={64} icon={<TeamOutlined />} style={{ backgroundColor: '#27ae60', marginBottom: '16px' }} />
            <Title level={3}>Create Your Account</Title>
          </div>

          {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ marginBottom: '24px' }} />}

          <Form name="register" onFinish={onFinish} size="large" layout="vertical" requiredMark={false}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please input your full name!', whitespace: true }]}
            >
              <Input prefix={<UserOutlined />} placeholder="e.g., John Doe" />
            </Form.Item>
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
              rules={[{ required: true, message: 'Please input your password!' }, { min: 8, message: 'Password must be at least 8 characters.' }]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Create a strong password" />
            </Form.Item>
            <Form.Item
              name="confirm"
              label="Confirm Password"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm your password" />
            </Form.Item>
             <Form.Item
                name="role"
                label="Your Role"
                rules={[{ required: true, message: 'Please select your role!' }]}
            >
                <Select placeholder="Select your primary role">
                    <Option value="student">Student</Option>
                    <Option value="faculty">Faculty</Option>
                    <Option value="it_staff">IT Staff / Developer</Option>
                </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </Form.Item>
            <Text style={{ textAlign: 'center', display: 'block' }}>
              Already have an account? <Link to="/login">Sign In</Link>
            </Text>
          </Form>
        </RegisterCard>
      </FormPanel>
    </RegisterWrapper>
  );
};

export default RegisterForm;
