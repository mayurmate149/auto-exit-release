// Dashboard page after successful login
// Path: src/app/dashboard/page.js

import React from 'react';

export default function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f5f6fa' }}>
      <div style={{ padding: '2rem', borderRadius: '8px', background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h1 style={{ color: '#222', marginBottom: '1rem' }}>Welcome to Your Dashboard</h1>
        <p style={{ color: '#555' }}>You have successfully logged in with 5paisa SSO.</p>
      </div>
    </div>
  );
}
