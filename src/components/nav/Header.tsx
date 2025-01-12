import React from 'react';
import { HomeTwoTone, CheckCircleTwoTone } from '@ant-design/icons';
import { Menu } from 'antd';
import { useContext } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AuthContext } from '../../provider/authContext';

const Header: React.FC = () => {
  const { current, token, setCurrent } = useContext(AuthContext);
  const onClick = (e: { key: string }) => {
    setCurrent(e.key);
  };
  
  return (
    <>
      <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal">
        <Menu.Item key="h" icon={<HomeTwoTone />}>
          <Link to="/">Home</Link>
        </Menu.Item>
        {token && (
          <Menu.Item key="p" icon={<CheckCircleTwoTone />}>
            <Link to="/pickSubmission">Pick Submission</Link>
          </Menu.Item>
        )}
        {!token && (
          <Menu.Item key="l" icon={<CheckCircleTwoTone />}>
            <Link to="/login">Login</Link>
          </Menu.Item>
        )}
      </Menu>
      <Outlet />
    </>

  )
};
export default Header;