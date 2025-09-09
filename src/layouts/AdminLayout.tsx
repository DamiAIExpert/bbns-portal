// src/layouts/AdminLayout.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Button,
  message,
  Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  FileDoneOutlined,
  TeamOutlined,
  SettingOutlined,
  SafetyOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  DownloadOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { logoutUser } from '../services/authService';
import type { User } from '../services/authService';
import api from '../services/api';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// ---------- Sidebar items ----------
const adminMenuItems: MenuProps['items'] = [
  { key: '/admin/dashboard', icon: <AppstoreOutlined />, label: <NavLink to="/admin/dashboard">Dashboard</NavLink> },
  { key: '/admin/users', icon: <TeamOutlined />, label: <NavLink to="/admin/users">User Management</NavLink> },
  { key: '/admin/proposals', icon: <FileDoneOutlined />, label: <NavLink to="/admin/proposals">Proposals</NavLink> },
  { key: '/admin/finalize', icon: <CheckSquareOutlined />, label: <NavLink to="/admin/finalize">Finalize</NavLink> }, // new
  { key: '/admin/evaluation', icon: <BarChartOutlined />, label: <NavLink to="/admin/evaluation">Evaluation Reports</NavLink> },
  { key: '/admin/blockchain-logs', icon: <SafetyOutlined />, label: <NavLink to="/admin/blockchain-logs">Blockchain Logs</NavLink> },
  { key: '/admin/settings', icon: <SettingOutlined />, label: <NavLink to="/admin/settings">Settings</NavLink> },
];

// ---------- helpers for file downloads (CSV exports) ----------
const getFilenameFromCD = (cd?: string, fallback = 'export.csv') => {
  if (!cd) return fallback;
  // RFC 5987: filename*=UTF-8''
  const star = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(cd);
  if (star && star[2]) return decodeURIComponent(star[2].trim());
  // fallback: filename=
  const m = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(cd);
  if (!m || !m[1]) return fallback;
  return m[1].replace(/^["']|["']$/g, '');
};

const saveBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [downloading, setDownloading] = useState<'pending' | 'negotiating' | 'finalized' | null>(null);

  const user: User | null = useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }, []);

  const activeMenuKey = useMemo(() => {
    return (
      adminMenuItems?.find((item) =>
        location.pathname.startsWith((item?.key as string) || '')
      )?.key || '/admin/dashboard'
    );
  }, [location.pathname]);

  const handleLogout = () => {
    logoutUser();
  };

  // ---------- Data Export actions (CSV) ----------
  // Backend: GET /api/admin/proposals/export?status=pending|negotiating|finalized
  const exportCSV = useCallback(
    async (status: 'pending' | 'negotiating' | 'finalized') => {
      try {
        setDownloading(status);
        const res = await api.get('/admin/proposals/export', {
          params: { status },
          responseType: 'blob',
          headers: { Accept: 'text/csv' },
        });
        const cd = (res.headers as any)['content-disposition'] as string | undefined;
        const filename = getFilenameFromCD(cd, `proposals-${status}.csv`);
        saveBlob(res.data as Blob, filename);
        message.success(`Downloaded ${filename}`);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Unable to download CSV.';
        message.error(msg);
      } finally {
        setDownloading(null);
      }
    },
    []
  );

  const exportMenu: MenuProps = {
    items: [
      { key: 'pending', icon: <DownloadOutlined />, label: 'Download Pending Proposals', onClick: () => exportCSV('pending') },
      { key: 'negotiating', icon: <DownloadOutlined />, label: 'Download Negotiating Proposals', onClick: () => exportCSV('negotiating') },
      { key: 'finalized', icon: <DownloadOutlined />, label: 'Download Finalized Proposals', onClick: () => exportCSV('finalized') },
    ],
  };

  const userMenu: MenuProps = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: <Link to="/admin/profile">Admin Profile</Link> },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout, danger: true },
    ],
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading user data...
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        theme="dark"
      >
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <Title
            level={4}
            style={{
              color: 'white',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? 'A' : 'Admin Panel'}
          </Title>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeMenuKey as string]} items={adminMenuItems} />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />

            {/* Header Quick Data Export (CSV) */}
            <Dropdown menu={exportMenu} trigger={['click']}>
              <Tooltip title="Export proposals CSV by stage">
                <Button icon={<DatabaseOutlined />} loading={!!downloading}>
                  Data Export
                </Button>
              </Tooltip>
            </Dropdown>
          </div>

          <Dropdown menu={userMenu} trigger={['click']}>
            <a onClick={(e) => e.preventDefault()} style={{ cursor: 'pointer' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#e74c3c' }}>
                  {user.name ? user.name[0].toUpperCase() : 'A'}
                </Avatar>
                <Text strong>{user.name || 'Admin'}</Text>
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
        </Header>

        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#f4f6f8' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
