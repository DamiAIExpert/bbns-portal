import React, { useState, useMemo } from 'react';
import { Form, Input, Button, Card, Typography, App, Breadcrumb, Tag, Grid } from 'antd';
import { FileTextOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { User } from '../../services/authService';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const SubmitProposal: React.FC = () => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    
    // Ant Design's hook to get screen size information.
    const screens = useBreakpoint();

    // Determine if the current screen is mobile-sized (less than md breakpoint).
    const isMobile = !screens.md;

    // Get the user's role from localStorage to be sent with the submission
    const userRole = useMemo(() => {
        try {
            const storedUser: User | null = JSON.parse(localStorage.getItem('user') || 'null');
            return storedUser?.role || 'student'; // Default to 'student' if not found
        } catch (e) {
            return 'student';
        }
    }, []);

    const onFinish = async (values: { description: string }) => {
        setLoading(true);
        
        // Construct the data payload as required by the backend
        const submissionData = {
            title: "Software Requirement for Student Portal", // Set the default title
            description: values.description,
            stakeholders: [{ role: userRole }],
        };

        try {
            await api.post('/proposals', submissionData);
            message.success('Thank you! Your requirement has been submitted successfully.');
            form.resetFields();
            setTimeout(() => navigate('/user/dashboard'), 1500); // Redirect to dashboard after success
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to submit requirement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Breadcrumb
                items={[
                    { href: '/user/dashboard', title: <HomeOutlined /> },
                    { title: 'Submit Requirement' },
                ]}
                // Reduce margin on smaller screens
                style={{ marginBottom: isMobile ? '16px' : '24px' }}
            />
            {/* On mobile, we reduce the card's internal padding since the parent layout already provides it. */}
            <Card variant="borderless" bodyStyle={{ padding: isMobile ? '1px' : '24px' }}>
                {/* Use a smaller title on mobile devices */}
                <Title level={isMobile ? 4 : 3}>Data Collection for Ph.D. Research</Title>
                <Paragraph type="secondary">
                    This form is for collecting data on software requirements for a new student portal as part of a Ph.D. research study. Your contribution is highly valued.
                </Paragraph>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    // Adjust top margin for mobile
                    style={{ marginTop: isMobile ? '16px' : '24px' }}
                >
                    <Paragraph strong>
                        Project Title: Software Requirement for Student Portal
                    </Paragraph>

                    <Form.Item
                        name="description"
                        label="Please kindly provide your requirement for the new student portal:"
                        rules={[{ required: true, message: 'This field cannot be empty. Please describe your requirement.' }]}
                    >
                        <TextArea 
                            // Use fewer rows on mobile to save vertical space
                            rows={isMobile ? 6 : 8} 
                            placeholder="Clearly explain the problem, the proposed feature or solution, and the expected benefits..." 
                        />
                    </Form.Item>
                    
                    <Form.Item>
                         <Tag icon={<UserOutlined />} color="blue">
                            Submitting as: <span style={{textTransform: 'capitalize'}}>{userRole.replace(/_/g, ' ')}</span>
                         </Tag>
                    </Form.Item>

                    <Form.Item>
                        {/* The `block` property makes the button full-width, which is better for mobile UX. */}
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading} 
                            size="large" 
                            icon={<FileTextOutlined />}
                            block 
                        >
                            {loading ? 'Submitting...' : 'Submit My Requirement'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default SubmitProposal;
