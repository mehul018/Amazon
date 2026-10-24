import React from 'react';

const DashboardStats = ({ stats, loading, error }) => {
  if (loading) return <div>Loading dashboard stats...</div>; //[cite: 2]
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>; //[cite: 2]

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      {/* Total Records Card */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', flex: 1 }}>
        <h3>Total Records</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalRecords || 0}</p>
      </div>

      {/* Active Records Card */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', flex: 1 }}>
        <h3>Active Records</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>{stats?.activeRecords || 0}</p>
      </div>

      {/* Records Added Today Card */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', flex: 1 }}>
        <h3>Records Added Today</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'blue' }}>{stats?.todayRecords || 0}</p>
      </div>
    </div>
  );
};

export default DashboardStats;
