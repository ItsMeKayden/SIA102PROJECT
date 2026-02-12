import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';

import Overview from './frontend/pages/Overview';
import StaffInformation from './frontend/pages/StaffInformation';
import Attendance from './frontend/pages/Attendance';
import Analytics from './frontend/pages/Analytics';
import Appointments from './frontend/pages/Appointments';
import Schedule from './frontend/pages/Schedule';
import Notification from './frontend/pages/Notification';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="staff" element={<StaffInformation />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="notification" element={<Notification />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
