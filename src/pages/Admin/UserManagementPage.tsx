import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Space, Button, Typography, Card, Spin, Alert, Input, Modal, Select, App, Popconfirm, Form } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined, TeamOutlined } from '@ant-design/icons';
import { getAllUsers, updateUser, updateUserRole, updateUserStatus, deleteUser } from '../../services/adminService';
import type { AdminUser } from '../../services/adminService';

const { Title, Paragraph } = Typography; // CORRECTED: Removed unused 'Text' import
const { Option } = Select;

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleUserEdit = (user: AdminUser) => {
        setEditingUser(user);
        form.setFieldsValue({
            name: user.name,
            email: user.email,
            role: user.role,
        });
        setIsModalOpen(true);
    };

    const handleUserUpdate = async () => {
        if (!editingUser) return;

        try {
            const values = await form.validateFields();
            
            const promises = [];

            // Check if name or email have changed
            if (values.name !== editingUser.name || values.email !== editingUser.email) {
                promises.push(updateUser(editingUser._id, { name: values.name, email: values.email }));
            }

            // Check if role has changed
            if (values.role !== editingUser.role) {
                promises.push(updateUserRole(editingUser._id, values.role));
            }

            if (promises.length > 0) {
                await Promise.all(promises);
                message.success(`Successfully updated ${editingUser.name}'s details.`);
            }

            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers(); // Refresh the user list

        } catch (err: any) {
            // This catches validation errors as well
            if (err.message) {
                 message.error(err.message);
            }
            console.error("Update failed:", err);
        }
    };

    const handleStatusToggle = async (user: AdminUser) => {
        try {
            await updateUserStatus(user._id, !user.isActive);
            message.success(`Successfully ${!user.isActive ? 'activated' : 'deactivated'} ${user.name}'s account.`);
            fetchUsers(); // Refresh the user list
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUser(userId);
            message.success('User successfully deleted.');
            fetchUsers(); // Refresh the user list
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: AdminUser, b: AdminUser) => a.name.localeCompare(b.name) },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color="blue" style={{textTransform: 'capitalize'}}>{role.replace('_', ' ')}</Tag> },
        { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Tag icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />} color={isActive ? 'success' : 'error'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
        { title: 'Date Joined', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: AdminUser) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => handleUserEdit(record)}>Edit</Button>
                    <Popconfirm
                        title={`Are you sure you want to ${record.isActive ? 'deactivate' : 'activate'} this user?`}
                        onConfirm={() => handleStatusToggle(record)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger={record.isActive}>{record.isActive ? 'Deactivate' : 'Activate'}</Button>
                    </Popconfirm>
                    <Popconfirm
                        title="Delete User"
                        description="This action is permanent and cannot be undone. Are you sure?"
                        onConfirm={() => handleDeleteUser(record._id)}
                        okText="Yes, Delete"
                        cancelText="No"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-inter">
            <Title level={2} className="text-gray-800 mb-4 flex items-center">
                <TeamOutlined className="mr-3 text-blue-600" /> User Management
            </Title>
            <Paragraph type="secondary" className="text-gray-600 mb-8">View, manage, and update user accounts and roles.</Paragraph>

            <Card variant="borderless" className="mt-6 rounded-lg shadow-md">
                <Input
                    placeholder="Search by name or email..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="mb-6 max-w-sm rounded-md"
                />
                {loading ? (
                    <div className="text-center py-12">
                        <Spin size="large" />
                    </div>
                ) : error ? (
                    <Alert message="Error" description={error} type="error" showIcon className="rounded-md" />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={filteredUsers.map(u => ({ ...u, key: u._id }))}
                        scroll={{ x: 'max-content' }}
                        className="rounded-lg overflow-hidden"
                        pagination={{ pageSize: 10 }}
                    />
                )}
            </Card>

            <Modal
                title="Edit User Details"
                open={isModalOpen}
                onOk={handleUserUpdate}
                onCancel={() => setIsModalOpen(false)}
                okText="Save Changes"
                className="rounded-lg"
            >
                {editingUser && (
                    <Form form={form} layout="vertical" name="editUserForm" initialValues={{ name: editingUser.name, email: editingUser.email, role: editingUser.role }}>
                        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the user\'s name!' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role!' }]}>
                            <Select className="w-full rounded-md">
                                <Option value="student">Student</Option>
                                <Option value="faculty">Faculty</Option>
                                <Option value="it_staff">IT Staff</Option>
                                <Option value="admin">Admin</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default UserManagementPage;
