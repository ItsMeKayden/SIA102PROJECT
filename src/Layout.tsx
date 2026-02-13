import { Outlet } from 'react-router-dom';
import Sidebar from './frontend/components/Sidebar';

const Layout = () => {
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#eaeaea' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px', overflow: 'auto', width: '100%' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
