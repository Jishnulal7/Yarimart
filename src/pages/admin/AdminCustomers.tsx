import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Mail, Phone, MapPin } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
  };
  order_count?: number;
  total_spent?: number;
}

const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Get current user's session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error("No active session");
      }

      // Use direct database queries instead of Edge Function
      // First get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      // For each user, get their order data
      const usersWithOrderData = await Promise.all(
        (users || []).map(async (user) => {
          // Get order count and total spent for this user
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total')
            .eq('user_id', user.id);
          
          if (ordersError) {
            console.error('Error fetching orders for user:', user.id, ordersError);
            return {
              ...user,
              order_count: 0,
              total_spent: 0
            };
          }
          
          const orderCount = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0;
          
          return {
            ...user,
            order_count: orderCount,
            total_spent: totalSpent
          };
        })
      );
      
      setCustomers(usersWithOrderData || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    fetchCustomerOrders(customer.id);
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
      day: 'numeric',
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const searchString = searchQuery.toLowerCase();
    return (
      customer.email.toLowerCase().includes(searchString) ||
      customer.user_metadata?.full_name?.toLowerCase().includes(searchString) ||
      customer.user_metadata?.phone?.toLowerCase().includes(searchString) ||
      customer.user_metadata?.city?.toLowerCase().includes(searchString) ||
      customer.user_metadata?.state?.toLowerCase().includes(searchString)
    );
  });

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Orders
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Spent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="animate-pulse flex justify-center">
                      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {(customer.user_metadata?.full_name?.charAt(0) || customer.email.charAt(0)).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.user_metadata?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.user_metadata?.phone ? (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Phone className="h-4 w-4 mr-1" />
                          {customer.user_metadata.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Not provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {customer.order_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(customer.total_spent || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => viewCustomerDetails(customer)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Customer Details Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Customer Details
                    </h3>
                    
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Personal Information</h4>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedCustomer.user_metadata?.full_name || 'Name not provided'}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <Mail className="h-4 w-4 mr-1" />
                            {selectedCustomer.email}
                          </div>
                          {selectedCustomer.user_metadata?.phone && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <Phone className="h-4 w-4 mr-1" />
                              {selectedCustomer.user_metadata.phone}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Address</h4>
                          {selectedCustomer.user_metadata?.addressLine1 ? (
                            <div>
                              <div className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="h-4 w-4 mr-1 mt-0.5" />
                                <div>
                                  <p>{selectedCustomer.user_metadata.addressLine1}</p>
                                  {selectedCustomer.user_metadata.city && selectedCustomer.user_metadata.state && (
                                    <p>
                                      {selectedCustomer.user_metadata.city}, {selectedCustomer.user_metadata.state}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No address provided</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Account Summary</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Orders</div>
                            <div className="text-lg font-medium text-gray-900 dark:text-white">{selectedCustomer.order_count}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Spent</div>
                            <div className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(selectedCustomer.total_spent || 0)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Order History</h4>
                        {loadingOrders ? (
                          <div className="animate-pulse space-y-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
                            ))}
                          </div>
                        ) : customerOrders.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {customerOrders.map(order => (
                              <div key={order.id} className="py-3 flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">Order #{order.id.slice(0, 8)}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.created_at)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : 
                                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : 
                                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' : 
                                          'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'}`}
                                  >
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No orders found for this customer</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;