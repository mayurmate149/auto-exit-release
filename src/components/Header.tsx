"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  // Check login state using cookie
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Check session status from API
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/5paisa/active');
        const data = await res.json();
        setLoggedIn(!!data.active);
      } catch (e) {
        setLoggedIn(false);
      }
    }
    checkSession();
  }, []);

  const handleAuthClick = async () => {
    if (loggedIn) {
      // Call logout API and redirect
      await fetch('/api/auth/5paisa/logout', { method: 'POST' });
      window.location.href = '/login'; // or use '/' if you prefer
    } else {
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', marginRight: '1rem' }}>
          <img src="/logo.svg" alt="Logo" style={{ height: '32px', width: '32px', marginRight: 0 }} />
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/positions" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>
          Positions
        </Link>
        <Link href="/settings" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>
          Settings
        </Link>
        <Link href="/mock-positions" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600 }}>
          Mock Simulator
        </Link>
        <button onClick={handleAuthClick} style={{ padding: '0.5rem 1rem' }}>
          {loggedIn ? 'Logout' : 'Login'}
        </button>
      </div>
    </header>
  );
}
