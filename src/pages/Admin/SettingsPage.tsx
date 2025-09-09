import React from 'react';
import { Card, Typography, Button, Space, App } from 'antd';
import { SettingOutlined, DownloadOutlined } from '@ant-design/icons';
import { 
    downloadPendingProposals, 
    downloadNegotiatingProposals, 
    downloadFinalizedProposals 
} from '../../services/adminService';

const { Title, Paragraph } = Typography;

const SettingsPage: React.FC = () => {
    const { message } = App.useApp();

    const handleDownload = async (stage: 'pending' | 'in_negotiation' | 'finalized') => {
        try {
            message.loading({ content: `Downloading ${stage.replace('_', ' ')} proposals...`, key: stage });
            
            let downloadFunction;
            switch (stage) {
                case 'pending':
                    downloadFunction = downloadPendingProposals;
                    break;
                case 'in_negotiation':
                    downloadFunction = downloadNegotiatingProposals;
                    break;
                case 'finalized':
                    downloadFunction = downloadFinalizedProposals;
                    break;
            }

            await downloadFunction();
            message.success({ content: `Report for ${stage.replace('_', ' ')} proposals started successfully!`, key: stage, duration: 2 });
        } catch (err: any) {
            message.error({ content: err.message || `Failed to download ${stage.replace('_', ' ')} report.`, key: stage, duration: 2 });
        }
    };


    return (
        <div className="p-6 bg-gray-50 min-h-screen font-inter">
            <Title level={2} className="text-gray-800 mb-2 flex items-center">
                <SettingOutlined className="mr-3 text-blue-600" /> System Settings
            </Title>
            <Paragraph type="secondary" className="text-gray-600 mb-8 max-w-3xl">
                Manage system-wide configurations and download proposal data at various stages.
            </Paragraph>

            <Card variant="borderless" className="rounded-lg shadow-md mb-6">
                <Title level={4}>Data Export</Title>
                <Paragraph type="secondary">Download CSV reports of proposals based on their current stage in the negotiation process.</Paragraph>
                <Space wrap>
                    <Button icon={<DownloadOutlined />} onClick={() => handleDownload('pending')}>
                        Download Pending Proposals
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => handleDownload('in_negotiation')}>
                        Download Negotiating Proposals
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => handleDownload('finalized')}>
                        Download Finalized Proposals
                    </Button>
                </Space>
            </Card>

            <Card variant="borderless" className="rounded-lg shadow-md">
                 <Title level={4}>Future Settings</Title>
                <Paragraph>
                    This section is currently under development. Future settings will include:
                </Paragraph>
                <ul>
                    <li>Negotiation parameter adjustments (e.g., round duration, voting thresholds).</li>
                    <li>Notification preferences for administrators.</li>
                    <li>Blockchain network configuration details.</li>
                    <li>API key management for external integrations.</li>
                </ul>
            </Card>
        </div>
    );
};

export default SettingsPage;
