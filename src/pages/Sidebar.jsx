// import React from 'react';
// import { NavLink } from 'react-router-dom';
// import multiico from '../images/multiico.png';

// export default function Sidebar({ active }) {
//   return (
//     <div style={{
//       width: 240, background: '#fff', borderRight: '1px solid #e0e0e0',
//       minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 0
//     }}>
//       {/* Profile Section (White) */}
//       <div style={{ background: '#fff', padding: '24px 0 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
//         <img src={multiico} alt="Profile" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #16a34a', marginBottom: 10, background: '#fff' }} />
//         <div style={{ color: '#222', fontWeight: 700, fontSize: 18 }}>Admin Name</div>
//         <div style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>admin@email.com</div>
//       </div>
//       {/* Navigation */}
//       <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '32px 0 0 0' }}>
//         <SidebarLink to="/superadmin/dashboard" label="Dashboard" active={active === "Dashboard"} />
//         <SidebarLink to="/superadmin/admin-management" label="Admin Management" active={active === "Admin Management"} />
//         <SidebarLink to="/superadmin/activity-log" label="Activity Log" active={active === "Activity Log"} />
//         <SidebarLink to="/superadmin/accounts" label="Accounts" active={active === "Accounts"} />
//         <SidebarLink to="/superadmin/settings" label="System Wide Settings" active={active === "System Wide Settings"} />
        
//       </nav>
//     </div>
//   );
// }

// function SidebarLink({ to, label, active }) {
//   return (
//     <NavLink
//       to={to}
//       style={{
//         color: active ? '#16a34a' : '#444',
//         fontWeight: active ? 700 : 500,
//         background: active ? '#e8f5e9' : 'none',
//         borderRadius: 8,
//         padding: '12px 32px',
//         textDecoration: 'none',
//         fontSize: 16,
//         margin: '0 12px',
//         transition: 'background 0.2s, color 0.2s'
//       }}
//     >
//       {label}
//     </NavLink>
//   );
// }
// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import multiico from '../images/multiico.png';

export default function Sidebar({ active }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('name');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      localStorage.removeItem('userId');
    } catch (e) {
      console.warn('LocalStorage cleanup failed:', e);
    }
    navigate('/login', { replace: true });
  };

  return (
    <div style={{
      width: 240, background: '#fff', borderRight: '1px solid #e0e0e0',
      minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 0
    }}>
      {/* Profile Section (White) */}
      <div style={{
        background: '#fff', padding: '24px 0 16px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <img
          src={multiico}
          alt="Profile"
          style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #16a34a', marginBottom: 10, background: '#fff' }}
        />
        <div style={{ color: '#222', fontWeight: 700, fontSize: 18 }}>Admin Name</div>
        <div style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>admin@email.com</div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '32px 0 0 0', flexGrow: 1 }}>
        <SidebarLink to="/superadmin/dashboard" label="Dashboard" active={active === "Dashboard"} />
        <SidebarLink to="/superadmin/admin-management" label="Admin Management" active={active === "Admin Management"} />
        <SidebarLink to="/superadmin/activity-log" label="Activity Log" active={active === "Activity Log"} />
        <SidebarLink to="/superadmin/accounts" label="Accounts" active={active === "Accounts"} />
      </nav>

      {/* Logout Button (replaces System Wide Settings) */}
      <div style={{ padding: '16px 12px 24px' }}>
        <SidebarButton label="Log out" onClick={handleLogout} />
      </div>
    </div>
  );
}

function SidebarLink({ to, label, active }) {
  return (
    <NavLink
      to={to}
      style={{
        color: active ? '#16a34a' : '#444',
        fontWeight: active ? 700 : 500,
        background: active ? '#e8f5e9' : 'none',
        borderRadius: 8,
        padding: '12px 32px',
        textDecoration: 'none',
        fontSize: 16,
        margin: '0 12px',
        transition: 'background 0.2s, color 0.2s'
      }}
    >
      {label}
    </NavLink>
  );
}

function SidebarButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        color: '#b91c1c',
        fontWeight: 700,
        background: '#fee2e2',
        borderRadius: 8,
        padding: '12px 32px',
        fontSize: 16,
        border: '1px solid #fecaca',
        cursor: 'pointer',
        transition: 'filter 0.2s',
      }}
      onMouseDown={e => (e.currentTarget.style.filter = 'brightness(0.95)')}
      onMouseUp={e => (e.currentTarget.style.filter = 'none')}
    >
      Log out
    </button>
  );
}
