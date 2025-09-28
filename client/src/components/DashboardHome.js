import React from 'react';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

const DashboardHome = ({ stats, activity, formatTime, getActivityIcon, getActivityIconClass }) => {
  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Total Users</h3>
            <Users className="stat-icon" />
          </div>
          <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="stat-change">
            <TrendingUp className="w-3 h-3" />
            +12% from last month
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <h3 className="stat-title">Total Orders</h3>
            <ShoppingCart className="stat-icon" />
          </div>
          <div className="stat-value">{stats.totalOrders.toLocaleString()}</div>
          <div className="stat-change">
            <TrendingUp className="w-3 h-3" />
            +8% from last month
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <h3 className="stat-title">Total Revenue</h3>
            <DollarSign className="stat-icon" />
          </div>
          <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-change">
            <TrendingUp className="w-3 h-3" />
            +15% from last month
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="activity-feed">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>
        
        <div className="space-y-4">
          {activity.map((item) => (
            <div key={item.id} className="activity-item">
              <div className={getActivityIconClass(item.severity)}>
                {getActivityIcon(item.type)}
              </div>
              <div className="activity-content">
                <p className="activity-message">{item.message}</p>
                <p className="activity-time">{formatTime(item.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;


