import React, { useState, useMemo } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
// CORRECTED: 'MenuProps' is a type, so it's imported separately with the 'type' keyword.
// Grid has been removed as it was unused.
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
// CORRECTED: 'User' is a type, so it's also imported with the 'type' keyword.
import { logoutUser } from '../services/authService';
import type { User } from '../services/authService';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// Define the menu items for the sidebar
const menuItems: MenuProps['items'] = [
  { key: '/user/dashboard', icon: <AppstoreOutlined />, label: <NavLink to="/user/dashboard">Dashboard</NavLink> },
  { key: '/user/submit-proposal', icon: <FileAddOutlined />, label: <NavLink to="/user/submit-proposal">Submit Requirement</NavLink> },
  { key: '/user/view-proposals', icon: <FolderOpenOutlined />, label: <NavLink to="/user/view-proposals">My Requirements</NavLink> },
  { key: '/user/profile', icon: <UserOutlined />, label: <NavLink to="/user/profile">My Profile</NavLink> },
];

const UserLayout: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Memoize user data to avoid re-parsing on every render
  const user: User | null = useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }, []);

  // Determine the active menu key from the current URL
  const activeMenuKey = useMemo(() => {
    const { pathname } = location;
    // If the path is for a single proposal, force the 'My Requirements' menu item to be active
    if (pathname.startsWith('/user/proposals/')) {
        return '/user/view-proposals';
    }
    // Otherwise, use the standard logic to find the matching key
    return menuItems?.find(item => pathname.startsWith(item?.key as string))?.key || '/user/dashboard';
  }, [location.pathname]);

  const handleLogout = () => {
    logoutUser(); // This will clear localStorage and redirect
  };

  // Define the dropdown menu for the user avatar
  const userMenu: MenuProps = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: <Link to="/user/profile">My Profile</Link> },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout, danger: true }
    ]
  };

  if (!user) {
    // This is a fallback in case the user data is not available.
    // The ProtectedRoute should prevent this from happening.
    return <div>Loading user data or redirecting...</div>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        theme="dark"
        // These props make the Sider responsive.
        // It will automatically collapse when the screen width is less than the 'lg' breakpoint (992px).
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
      >
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <Title level={4} style={{ color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {collapsed ? 'B' : 'BBNS Portal'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeMenuKey as string]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Dropdown menu={userMenu} trigger={['click']}>
                <a onClick={(e) => e.preventDefault()} style={{cursor: 'pointer'}}>
                    <Space>
                        <Avatar style={{ backgroundColor: '#27ae60' }}>{user.name ? user.name[0].toUpperCase() : 'U'}</Avatar> 
                        <Text strong>{user.name || 'User'}</Text> 
                        <DownOutlined />
                    </Space>
                </a>
            </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#f4f6f8' }}>
          {/* This is the crucial part. It tells React Router where to render the child route (e.g., UserDashboard). */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserLayout;
