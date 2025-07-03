import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { 
  Package, ShoppingBag, Users, DollarSign, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Download, RefreshCw, Calendar,
  Eye, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalRevenue: number;
  totalCustomers: number;
  lowStockProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'product' | 'customer';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    revenueGrowth: 0,
    orderGrowth: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh setup
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not properly configured');
      }
      
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Fetch orders and products data in parallel
      const [ordersResult, productsResult, usersResult] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('users').select('id, email, created_at')
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (usersResult.error) throw usersResult.error;

      const orders = ordersResult.data || [];
      const products = productsResult.data || [];
      const users = usersResult.data || [];

      // Calculate stats
      const pendingOrders = orders.filter(order => order.status === 'pending');
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
      const lowStockProducts = products.filter(product => product.stock <= 10);

      // Calculate growth (mock data for demo)
      const revenueGrowth = Math.random() * 20 - 10; // Random growth between -10% and +10%
      const orderGrowth = Math.random() * 30 - 15;

      setStats({
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        totalProducts: products.length,
        totalRevenue,
        totalCustomers: users.length,
        lowStockProducts: lowStockProducts.length,
        revenueGrowth,
        orderGrowth
      });

      // Recent orders
      const recent = orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentOrders(recent);

      // Generate recent activity
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'order',
          message: `New order #${recent[0]?.id?.slice(0, 8)} received`,
          timestamp: '2 minutes ago',
          status: 'success'
        },
        {
          id: '2',
          type: 'product',
          message: `${lowStockProducts.length} products running low on stock`,
          timestamp: '15 minutes ago',
          status: 'warning'
        },
        {
          id: '3',
          type: 'customer',
          message: 'New customer registration',
          timestamp: '1 hour ago',
          status: 'success'
        }
      ];
      setRecentActivity(activities);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportData = () => {
    // Mock export functionality
    const data = {
      stats,
      recentOrders,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    changeType, 
    color,
    onClick 
  }: {
    title: string;
    value: string | number;
    icon: any;
    change?: number;
    changeType?: 'increase' | 'decrease';
    color: string;
    onClick?: () => void;
  }) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {changeType === 'increase' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-700 dark:text-red-400 mt-2">{error}</p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400">
            If you're seeing authentication errors, please try:
          </p>
          <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
            <li>Running the admin setup script: <code className="bg-red-100 dark:bg-red-800 px-1 py-0.5 rounded">npm run setup-admins</code></li>
            <li>Logging out and logging back in to refresh your session</li>
          </ul>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={exportData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={Package}
          change={stats.orderGrowth}
          changeType={stats.orderGrowth > 0 ? 'increase' : 'decrease'}
          color="bg-blue-500"
          onClick={() => window.location.href = '/admin/orders'}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Clock}
          color="bg-yellow-500"
          onClick={() => window.location.href = '/admin/orders?status=pending'}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          change={stats.revenueGrowth}
          changeType={stats.revenueGrowth > 0 ? 'increase' : 'decrease'}
          color="bg-green-500"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={ShoppingBag}
          color="bg-purple-500"
          onClick={() => window.location.href = '/admin/products'}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          color="bg-indigo-500"
          onClick={() => window.location.href = '/admin/customers'}
        />
        <StatCard
          title="Low Stock Products"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          color="bg-red-500"
          onClick={() => window.location.href = '/admin/products?filter=low-stock'}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(stats.totalRevenue / (stats.totalOrders || 1))}
          icon={TrendingUp}
          color="bg-teal-500"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
              <button 
                onClick={() => window.location.href = '/admin/orders'}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium flex items-center"
              >
                View all
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(order.total)}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        order.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : order.status === 'delivered'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent orders</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' 
                      ? 'bg-green-400' 
                      : activity.status === 'warning'
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {activity.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {activity.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {activity.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/admin/products'}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ShoppingBag className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Add Product</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Add new products to inventory</p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/orders'}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Package className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Manage Orders</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Process pending orders</p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/customers'}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">View Customers</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage customer database</p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/analytics'}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Analytics</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">View detailed reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;