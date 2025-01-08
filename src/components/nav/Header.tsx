import React from 'react';
import { HomeTwoTone, EditTwoTone, CheckCircleTwoTone } from '@ant-design/icons';
import { Menu } from 'antd';
import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';


const Header: React.FC = () => {
  const [current, setCurrent] = useState('h');
  const onClick = (e: { key: string }) => {
    console.log('click ', e);
    setCurrent(e.key);
  };
  return (
    <>
     <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal">
      <Menu.Item key="h" icon= {<HomeTwoTone />}>
       <Link to="/playoffPicksWebsite">Home</Link>
      </Menu.Item>
      <Menu.Item key="r" icon= {<EditTwoTone />} style={{ marginLeft: 'auto' }}>
        <Link to="/playoffPicksWebsite/register">Register</Link>
      </Menu.Item>
      <Menu.Item key="l" icon= {<CheckCircleTwoTone />}>
        <Link to="/playoffPicksWebsite/login">Login</Link>
      </Menu.Item>
      <Menu.Item key="p" icon= {<CheckCircleTwoTone />}>
        <Link to="/playoffPicksWebsite/pickSubmission">Pick Submission</Link>
      </Menu.Item>
     </Menu>
     <Outlet/>
    </>
   
  )
};
export default Header;