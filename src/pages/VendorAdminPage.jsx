import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, 
  LayoutDashboard, 
  Smartphone, 
  Monitor, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Power, 
  RefreshCw, 
  LogOut, 
  Lock, 
  Mail, 
  Trash2,
  Calendar,
  Building2,
  Phone,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Sun,
  Moon
} from 'lucide-react';

const SUPABASE_URL = 'https://vejvxpjswlmcsbfiqywp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlanZ4cGpzd2xtY3NiZmlxeXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MzI3NTMsImV4cCI6MjEwMDEwODc1M30.oliBQIW9k8TL_d5q73bza7tt-CSK34yY-prJrYTfcBI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function VendorAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => localStorage.getItem('sa_theme') || 'dark');
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('sa_theme', nextTheme);
  };

  // Dashboard Filters & Pagination State
  const [platformTab, setPlatformTab] = useState('all'); // 'all' | 'mobile' | 'desktop'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'revoked'
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileData, setMobileData] = useState([]);
  const [desktopData, setDesktopData] = useState([]);
  const [hotelsData, setHotelsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [snapshotsData, setSnapshotsData] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [statusToast, setStatusToast] = useState('');

  // Date Filter State
  const [dateFilter, setDateFilter] = useState('all'); 
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [specificDate, setSpecificDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Check 50-year persistent login token in localStorage
    const savedToken = localStorage.getItem('bestbill_super_admin_token');
    if (savedToken) {
      try {
        const parsed = JSON.parse(savedToken);
        if (parsed && parsed.email === 'shubhampilane143@pilane.com') {
          setIsLoggedIn(true);
        }
      } catch (e) {
        localStorage.removeItem('bestbill_super_admin_token');
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllLicenses();
    }
  }, [isLoggedIn]);

  const formatPlanLabel = (plan) => {
    if (!plan || plan === 'registered') return 'FREE TRIAL';
    const p = String(plan).toLowerCase();
    if (p === 'monthly') return 'MONTHLY';
    if (p === 'yearly') return 'YEARLY';
    if (p === 'permanent' || p === 'lifetime') return 'PERMANENT';
    return 'FREE TRIAL';
  };

  const getPlanBadgeStyle = (plan) => {
    const p = String(plan).toLowerCase();
    if (p === 'monthly') return { bg: '#e0e7ff', color: '#3730a3' }; // Indigo
    if (p === 'yearly') return { bg: '#fef3c7', color: '#92400e' };  // Amber
    if (p === 'permanent' || p === 'lifetime') return { bg: '#dcfce7', color: '#166534' }; // Green
    return { bg: '#f3e8ff', color: '#7e22ce' }; // Purple for Trial
  };

  const fetchAllLicenses = async () => {
    setLoading(true);
    try {
      console.log('[SUPER ADMIN] Refreshing hardware licenses, hotels, and users from Supabase...');
      const [mRes, dRes, hRes, uRes, aRes] = await Promise.all([
        supabase.from('mobile_licenses').select('*').order('registration_date', { ascending: false }),
        supabase.from('desktop_licenses').select('*').order('registration_date', { ascending: false }),
        supabase.from('hotels').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*'),
        supabase.from('analytics_snapshots').select('hotel_code, created_at')
      ]);

      setMobileData(mRes.data || []);
      setDesktopData(dRes.data || []);
      setHotelsData(hRes.data || []);
      setUsersData(uRes.data || []);
      setSnapshotsData(aRes.data || []);
    } catch (err) {
      console.error('[SUPER ADMIN] Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    if (email.trim().toLowerCase() === 'shubhampilane143@pilane.com' && password === 'BestBill@Shubh#18') {
      const tokenPayload = {
        email: 'shubhampilane143@pilane.com',
        token: '50_YEAR_PERMANENT_SUPERADMIN_SESSION',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('bestbill_super_admin_token', JSON.stringify(tokenPayload));
      setIsLoggedIn(true);
    } else {
      setLoginError('Invalid Super Admin email address or password.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bestbill_super_admin_token');
    setIsLoggedIn(false);
  };

  // Delete Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleToggleStatus = async (item, platform) => {
    const table = platform === 'mobile' ? 'mobile_licenses' : 'desktop_licenses';
    const newStatus = !item.is_active;
    const actionName = newStatus ? 'ACTIVATED' : 'REVOKED';

    // 1. INSTANT OPTIMISTIC UI UPDATE (Zero Page Refresh / Zero Flicker!)
    if (platform === 'mobile') {
      setMobileData(prev => prev.map(m => m.id === item.id ? { ...m, is_active: newStatus } : m));
    } else {
      setDesktopData(prev => prev.map(d => d.id === item.id ? { ...d, is_active: newStatus } : d));
    }

    setStatusToast(`License for "${item.hotel_name || 'Hotel'}" ${actionName}!`);
    setTimeout(() => setStatusToast(''), 3000);

    // 2. BACKGROUND SUPABASE UPDATE
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) {
        console.error('[SUPABASE] Toggle update error:', error.message);
        // Rollback local state on error
        if (platform === 'mobile') {
          setMobileData(prev => prev.map(m => m.id === item.id ? { ...m, is_active: item.is_active } : m));
        } else {
          setDesktopData(prev => prev.map(d => d.id === item.id ? { ...d, is_active: item.is_active } : d));
        }
        alert(`Failed to update status: ${error.message}`);
      }
    } catch (err) {
      console.error('[SUPABASE] Toggle exception:', err.message);
    }
  };

  const executeDeleteRecord = async () => {
    if (!deleteConfirmItem) return;
    const item = deleteConfirmItem;
    setDeleting(true);

    const table = item.platform === 'mobile' ? 'mobile_licenses' : 'desktop_licenses';
    try {
      console.log(`[SUPER ADMIN] Deleting record id ${item.id} from ${table}...`);
      
      // Delete from license table
      const { error: licErr } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id);

      if (licErr) console.warn('[SUPER ADMIN] License delete warning:', licErr.message);

      // If device_uuid is present, also try deleting by device_uuid
      if (item.device_uuid) {
        await supabase.from(table).delete().eq('device_uuid', item.device_uuid);
      }

      // Also try cleaning up related hotel entry if matching owner_id or hotel_name
      if (item.hotel_name) {
        await supabase.from('hotels').delete().ilike('hotel_name', item.hotel_name.trim());
      }

      // INSTANT LOCAL UI REMOVAL (Card vanishes immediately!)
      if (item.platform === 'mobile') {
        setMobileData(prev => prev.filter(m => m.id !== item.id && m.device_uuid !== item.device_uuid));
      } else {
        setDesktopData(prev => prev.filter(d => d.id !== item.id && d.device_uuid !== item.device_uuid));
      }

      setStatusToast(`Record for "${item.hotel_name || 'Hotel'}" deleted permanently!`);
      setTimeout(() => setStatusToast(''), 4000);
    } catch (err) {
      console.error('[SUPER ADMIN] Delete error:', err);
      alert(`Delete Error: ${err.message}`);
    } finally {
      setDeleting(false);
      setDeleteConfirmItem(null);
    }
  };

  // Combine Mobile & Desktop records
  const combinedList = [
    ...mobileData.map(item => ({ ...item, platform: 'mobile' })),
    ...desktopData.map(item => ({ ...item, platform: 'desktop' }))
  ];

  // Filtering Logic
  const filteredData = combinedList.filter(item => {
    // 1. Platform Filter
    if (platformTab === 'mobile' && item.platform !== 'mobile') return false;
    if (platformTab === 'desktop' && item.platform !== 'desktop') return false;

    // 2. License Status Filter
    if (statusFilter === 'active' && !item.is_active) return false;
    if (statusFilter === 'revoked' && item.is_active) return false;

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchedHotelRow = (hotelsData || []).find(h => 
        h.id === item.id || 
        (h.hotel_code && h.hotel_code === item.device_uuid) || 
        (h.hotel_name && item.hotel_name && h.hotel_name.toLowerCase().trim() === item.hotel_name.toLowerCase().trim())
      );
      const matchedSnapRow = (snapshotsData || []).find(s => s.hotel_code && s.hotel_code === item.device_uuid);
      const hotelCodeStr = (matchedHotelRow?.hotel_code || item.hotel_code || matchedSnapRow?.hotel_code || '').toLowerCase();

      const nameMatch = item.hotel_name && item.hotel_name.toLowerCase().includes(q);
      const ownerMatch = item.owner_name && item.owner_name.toLowerCase().includes(q);
      const phoneMatch = (item.mobile_number || item.phone) && String(item.mobile_number || item.phone).includes(q);
      const emailMatch = item.email && item.email.toLowerCase().includes(q);
      const uuidMatch = item.device_uuid && item.device_uuid.toLowerCase().includes(q);
      const codeMatch = hotelCodeStr && hotelCodeStr.includes(q);

      if (!nameMatch && !ownerMatch && !phoneMatch && !emailMatch && !uuidMatch && !codeMatch) {
        return false;
      }
    }

    // 4. Date Filter
    if (dateFilter !== 'all' && item.registration_date) {
      const regDate = new Date(item.registration_date);
      const now = new Date();

      if (dateFilter === 'last_15_days') {
        const fifteenDaysAgo = new Date(now.setDate(now.getDate() - 15));
        if (regDate < fifteenDaysAgo) return false;
      } else if (dateFilter === 'last_month') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        if (regDate < thirtyDaysAgo) return false;
      } else if (dateFilter === 'current_month') {
        if (regDate.getMonth() !== now.getMonth() || regDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'last_3_months') {
        const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
        if (regDate < ninetyDaysAgo) return false;
      } else if (dateFilter === 'last_6_months') {
        const halfYearAgo = new Date(now.setDate(now.getDate() - 180));
        if (regDate < halfYearAgo) return false;
      } else if (dateFilter === 'this_year') {
        if (regDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'custom' && customFromDate && customToDate) {
        const from = new Date(customFromDate);
        const to = new Date(customToDate);
        to.setHours(23, 59, 59, 999);
        if (regDate < from || regDate > to) return false;
      } else if (dateFilter === 'specific' && specificDate) {
        const spec = new Date(specificDate);
        if (regDate.toDateString() !== spec.toDateString()) return false;
      }
    }

    return true;
  });

  // Pagination Math
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const mobileCount = combinedList.filter(i => i.platform === 'mobile').length;
  const desktopCount = combinedList.filter(i => i.platform === 'desktop').length;
  const activeCount = combinedList.filter(i => i.is_active).length;
  const revokedCount = combinedList.filter(i => !i.is_active).length;

  const bgBase = isDark ? '#0f172a' : '#f1f5f9';
  const bgCard = isDark ? '#1e293b' : '#ffffff';
  const bgInner = isDark ? '#0f172a' : '#f8fafc';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1';
  const textMain = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: '24px', padding: '32px 24px', width: '100%', maxWidth: '400px', color: textMain, boxShadow: isDark ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 20px 40px -12px rgba(0,0,0,0.1)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', border: 'none', color: textMain, padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}
            >
              {isDark ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: '#0ea5e9' }} />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '20px', backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', marginBottom: '16px' }}>
              <Shield size={36} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: textMain }}>Super Admin Portal</h1>
            <p style={{ fontSize: '13px', color: textMuted, marginTop: '6px' }}>BestBill Customer & License Tracking System</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : '#fff1f2', border: '1px solid #f43f5e', color: isDark ? '#f43f5e' : '#be123c', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Super Admin Email</label>
              <div style={{ position: 'relative', marginTop: '8px' }}>
                <Mail size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: '#64748b' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shubhampilane143@pilane.com"
                  style={{ width: '100%', backgroundColor: bgInner, border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '12px 12px 12px 44px', color: textMain, outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <div style={{ position: 'relative', marginTop: '8px' }}>
                <Lock size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: '#64748b' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ width: '100%', backgroundColor: bgInner, border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '12px 12px 12px 44px', color: textMain, outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{ marginTop: '10px', width: '100%', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}
            >
              Sign In to Super Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgBase, color: textMain, fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* MOBILE HEADER BAR */}
      <header style={{ backgroundColor: bgCard, borderBottom: `1px solid ${borderColor}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#0ea5e9', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '20px' }}>
            B
          </div>
          <div>
            <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.02em', display: 'block', color: textMain }}>BESTBILL SUPER ADMIN</span>
            <span style={{ fontSize: '10px', color: '#0ea5e9', fontWeight: 800, textTransform: 'uppercase' }}>Customer & Vendor Tracker</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', border: 'none', color: textMain, padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isDark ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#0ea5e9' }} />}
          </button>

          <button
            onClick={() => {
              setStatusToast('Refreshing data from Supabase...');
              fetchAllLicenses().then(() => setTimeout(() => setStatusToast(''), 3000));
            }}
            disabled={loading}
            title="Refresh Data"
            style={{ backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe', border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : '#7dd3fc'}`, color: isDark ? '#38bdf8' : '#0369a1', padding: '10px', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={18} style={{ animation: loading ? 'spinIcon 0.8s linear infinite' : 'none' }} />
          </button>

          <button
            onClick={handleLogout}
            title="Log Out"
            style={{ backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : '#ffe4e6', border: `1px solid ${isDark ? 'rgba(244, 63, 94, 0.3)' : '#fecdd3'}`, color: isDark ? '#f43f5e' : '#be123c', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* STATS OVERVIEW CARDS */}
      <div style={{ padding: '16px 20px 0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '14px' }}>
          <span style={{ fontSize: '11px', color: textMuted, fontWeight: 800, textTransform: 'uppercase' }}>Total Stores</span>
          <div style={{ fontSize: '22px', fontWeight: 900, color: textMain, marginTop: '4px' }}>{combinedList.length}</div>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '14px' }}>
          <span style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: 800, textTransform: 'uppercase' }}>📱 Mobile Apps</span>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0ea5e9', marginTop: '4px' }}>{mobileCount}</div>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '14px' }}>
          <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 800, textTransform: 'uppercase' }}>🖥️ Desktop Apps</span>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>{desktopCount}</div>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '14px' }}>
          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 800, textTransform: 'uppercase' }}>Active Licenses</span>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>{activeCount}</div>
        </div>
      </div>

      <main style={{ padding: '20px' }}>
        {statusToast && (
          <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, marginBottom: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
            ℹ️ {statusToast}
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div style={{ backgroundColor: bgCard, borderRadius: '20px', padding: '16px', border: `1px solid ${borderColor}`, marginBottom: '20px' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={18} style={{ position: 'absolute', top: '12px', left: '14px', color: textMuted }} />
            <input
              type="text"
              placeholder="Search hotel name, owner, phone, UUID, code..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '10px 14px 10px 44px', borderRadius: '12px', border: `1px solid ${borderColor}`, outline: 'none', fontSize: '13px', backgroundColor: bgInner, color: textMain }}
            />
          </div>

          {/* Platform Tabs & Filter Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            
            {/* Category Filter */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Platform</label>
              <select
                value={platformTab}
                onChange={(e) => { setPlatformTab(e.target.value); setCurrentPage(1); }}
                style={{ width: '100%', padding: '9px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: bgInner, color: textMain, fontSize: '12px', fontWeight: 700 }}
              >
                <option value="all">All Platforms ({combinedList.length})</option>
                <option value="mobile">Mobile Apps ({mobileCount})</option>
                <option value="desktop">Desktop Apps ({desktopCount})</option>
              </select>
            </div>

            {/* License Status Filter */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{ width: '100%', padding: '9px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: bgInner, color: textMain, fontSize: '12px', fontWeight: 700 }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only ({activeCount})</option>
                <option value="revoked">Revoked Only ({revokedCount})</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Registration Date</label>
              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                style={{ width: '100%', padding: '9px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: bgInner, color: textMain, fontSize: '12px', fontWeight: 700 }}
              >
                <option value="all">All Time</option>
                <option value="last_15_days">Last 15 Days</option>
                <option value="last_month">Last 30 Days</option>
                <option value="current_month">Current Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* CUSTOMERS LIST CARDS - 2 HOTELS PER ROW GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: textMuted, fontWeight: 700 }}>
              Loading registered customers from Supabase...
            </div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: textMuted, fontWeight: 700, backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderColor}` }}>
              No registered hotels found matching your search.
            </div>
          ) : (
            paginatedData.map((item) => {
              const matchedHotelRow = (hotelsData || []).find(h => 
                h.id === item.id || 
                (h.hotel_code && h.hotel_code === item.device_uuid) || 
                (h.hotel_name && item.hotel_name && h.hotel_name.toLowerCase().trim() === item.hotel_name.toLowerCase().trim())
              );
              const matchedSnapRow = (snapshotsData || []).find(s => s.hotel_code && s.hotel_code === item.device_uuid);
              const rawCode = matchedHotelRow?.hotel_code || item.hotel_code || matchedSnapRow?.hotel_code;
              const displayHotelCode = (rawCode && rawCode !== 'HOTEL_001' && !rawCode.startsWith('HOTEL_')) ? rawCode : (rawCode && rawCode.length === 5 ? rawCode : null);

              return (
                <div key={`${item.platform}-${item.id}`} style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)' }}>
                  
                  {/* Card Top Row: Hotel Name & Hotel Code Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: textMain }}>
                        {item.hotel_name || 'N/A'}
                      </div>
                      <div style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>
                        {item.address || 'No location address'}
                      </div>
                    </div>

                    {displayHotelCode ? (
                      <code style={{ fontSize: '12px', backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : '#e0f2fe', border: `1px solid ${isDark ? '#38bdf8' : '#0369a1'}`, color: isDark ? '#38bdf8' : '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 900, letterSpacing: '0.5px' }}>
                        🔑 {displayHotelCode}
                      </code>
                    ) : (
                      <span style={{ fontSize: '11px', color: textMuted, fontWeight: 700 }}>No Code</span>
                    )}
                  </div>

                  {/* Platform & Plan Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', backgroundColor: item.platform === 'mobile' ? (isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe') : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7'), color: item.platform === 'mobile' ? (isDark ? '#38bdf8' : '#0369a1') : (isDark ? '#f59e0b' : '#b45309') }}>
                      {item.platform === 'mobile' ? '📱 Mobile App' : '🖥️ Desktop App'}
                    </span>

                    <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', backgroundColor: getPlanBadgeStyle(item.plan).bg, color: getPlanBadgeStyle(item.plan).color }}>
                      {formatPlanLabel(item.plan)}
                    </span>
                  </div>

                  {/* Owner Contact Details */}
                  <div style={{ backgroundColor: bgInner, padding: '10px 12px', borderRadius: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', border: `1px solid ${borderColor}` }}>
                    <div style={{ fontWeight: 800, color: textMain, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} style={{ color: '#0ea5e9' }} />
                      <span>{item.owner_name && !item.owner_name.startsWith('HOTEL_') ? item.owner_name : 'Hotel Owner'}</span>
                    </div>
                    <div style={{ color: textMain, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} style={{ color: '#0ea5e9' }} />
                      <span>{item.mobile_number || item.phone || 'N/A'}</span>
                    </div>
                    <div style={{ color: textMuted, fontSize: '11px', wordBreak: 'break-all' }}>
                      ✉️ {item.email && !item.email.includes('@bestbill.com') ? item.email : 'N/A'}
                    </div>
                  </div>

                  {/* Device UUID & Dates */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: textMuted, borderTop: `1px solid ${borderColor}`, paddingTop: '8px' }}>
                    <div>
                      <span>Reg: </span>
                      <span style={{ fontWeight: 700, color: textMain }}>{item.registration_date ? new Date(item.registration_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span>Ping: </span>
                      <span style={{ fontWeight: 700, color: textMain }}>{item.last_ping_at ? new Date(item.last_ping_at).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>

                  {/* Action Buttons: ACTIVE/REVOKED Toggle & DELETE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleToggleStatus(item, item.platform)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: item.is_active ? (isDark ? '#166534' : '#dcfce7') : (isDark ? '#991b1b' : '#ffe4e6'),
                        color: item.is_active ? (isDark ? '#ffffff' : '#166534') : (isDark ? '#ffffff' : '#991b1b'),
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Power size={14} /> {item.is_active ? 'LICENSE ACTIVE' : 'LICENSE REVOKED'}
                    </button>

                    <button
                      onClick={() => setDeleteConfirmItem(item)}
                      title="Permanently Delete Record"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${isDark ? 'rgba(244, 63, 94, 0.3)' : '#fecdd3'}`,
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : '#ffe4e6',
                        color: isDark ? '#f43f5e' : '#be123c',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION BAR */}
        {totalItems > 0 && (
          <div style={{ backgroundColor: bgCard, borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: textMuted, border: `1px solid ${borderColor}` }}>
            <div>
              Page {currentPage} of {totalPages}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: currentPage === 1 ? bgInner : '#0ea5e9',
                  color: currentPage === 1 ? textMuted : '#ffffff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 800
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: currentPage === totalPages ? bgInner : '#0ea5e9',
                  color: currentPage === totalPages ? textMuted : '#ffffff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 800
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', color: textMain }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: textMain }}>Delete Customer</h3>
                <span style={{ fontSize: '12px', color: textMuted }}>Permanent Action</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: textMuted, lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to permanently delete <strong style={{ color: textMain }}>"{deleteConfirmItem.hotel_name || 'this hotel'}"</strong>? This will remove their record from Supabase.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmItem(null)}
                disabled={deleting}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${borderColor}`, backgroundColor: bgInner, color: textMain, fontWeight: 800, fontSize: '13px', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>

              <button
                onClick={executeDeleteRecord}
                disabled={deleting}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#f43f5e', color: '#ffffff', fontWeight: 900, fontSize: '13px', cursor: deleting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)' }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
