import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, App, Row, Col, Avatar, Spin, Alert, Breadcrumb, Descriptions, Tag, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, HomeOutlined, IdcardOutlined, InfoCircleOutlined, CalendarOutlined } from '@ant-design/icons';
// CORRECTED: 'User' is a type, so it's imported with the 'type' keyword.
import { getUserProfile, updateUserProfile } from '../../services/authService';
import type { User } from '../../services/authService';
import api from '../../services/api'; // For the change password endpoint

const { Title, Text, Paragraph } = Typography;

const Profile: React.FC = () => {
    const [updateInfoForm] = Form.useForm();
    const [changePasswordForm] = Form.useForm();
    const { message } = App.useApp();
    
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [infoLoading, setInfoLoading] = useState<boolean>(false);
    const [passwordLoading, setPasswordLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const profileData = await getUserProfile();
                setUser(profileData);
                // Pre-fill the form with the user's current data
                updateInfoForm.setFieldsValue({ name: profileData.name, email: profileData.email });
            } catch (err: any) {
                setError(err.message || 'Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [updateInfoForm]);

    const handleUpdateInfo = async (values: { name: string }) => {
        setInfoLoading(true);
        try {
            const updatedUser = await updateUserProfile(values.name);
            setUser(updatedUser); // Update the local state with the new user info
            message.success('Profile updated successfully!');
        } catch (err: any) {
            message.error(err.message || 'Failed to update profile.');
        } finally {
            setInfoLoading(false);
        }
    };

    const handleChangePassword = async (values: any) => {
        setPasswordLoading(true);
        try {
            // This endpoint will need to be created in your backend API
            await api.put('/auth/change-password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            message.success('Password changed successfully!');
            changePasswordForm.resetFields();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <div>
             <Breadcrumb
                items={[
                    { href: '/user/dashboard', title: <HomeOutlined /> },
                    { title: 'My Profile' },
                ]}
                style={{ marginBottom: '24px' }}
            />
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card bordered={false} style={{ textAlign: 'center' }}>
                        <Avatar size={128} icon={<UserOutlined />} style={{ backgroundColor: '#27ae60', marginBottom: 24 }} />
                        <Title level={4}>{user?.name}</Title>
                        <Text type="secondary">{user?.email}</Text>
                        <Descriptions bordered column={1} style={{marginTop: 24, textAlign: 'left'}}>
                            <Descriptions.Item label={<Space><IdcardOutlined />Role</Space>}>
                                <Text style={{textTransform: 'capitalize'}}>{user?.role.replace('_', ' ')}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><InfoCircleOutlined />Status</Space>}>
                                <Tag color={user?.isActive ? 'success' : 'error'}>
                                    {user?.isActive ? 'Active' : 'Inactive'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><CalendarOutlined />Date Joined</Space>}>
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card title="Update Personal Information" bordered={false}>
                        <Form form={updateInfoForm} layout="vertical" onFinish={handleUpdateInfo} requiredMark={false}>
                            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your full name.' }]}>
                                <Input prefix={<UserOutlined />} />
                            </Form.Item>
                            <Form.Item name="email" label="Email Address">
                                <Input prefix={<MailOutlined />} disabled />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={infoLoading}>Update Information</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                    <Card title="Change Password" bordered={false} style={{ marginTop: 24 }}>
                        <Paragraph type="secondary">
                            For security, you will be logged out after successfully changing your password.
                        </Paragraph>
                        <Form form={changePasswordForm} layout="vertical" onFinish={handleChangePassword} requiredMark={false}>
                            <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true, message: 'Please enter your current password.' }]}>
                                <Input.Password prefix={<LockOutlined />} />
                            </Form.Item>
                            <Form.Item name="newPassword" label="New Password" rules={[{ required: true, message: 'Please enter a new password.' }, {min: 6, message: 'Password must be at least 6 characters.'}]} hasFeedback>
                                <Input.Password prefix={<LockOutlined />} />
                            </Form.Item>
                            <Form.Item
                                name="confirmPassword"
                                label="Confirm New Password"
                                dependencies={['newPassword']}
                                hasFeedback
                                rules={[
                                    { required: true, message: 'Please confirm your new password.' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('The new passwords do not match!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={passwordLoading}>Change Password</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;
