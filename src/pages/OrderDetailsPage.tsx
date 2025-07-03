import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, Calendar, CreditCard, MapPin, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRegion } from '../context/RegionContext';
import BreadcrumbNav from '../components/shared/BreadcrumbNav';
import { Order } from '../types/product';
import { useLanguage } from '../context/LanguageContext';

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatPrice } = useRegion();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusTimeline = (status: string) => {
    const statusDescriptions = {
      pending: "We've received your order and are preparing it for processing.",
      confirmed: "Your order has been confirmed and payment has been processed.",
      shipped: "Your order is on its way to you! Track your package for updates.",
      delivered: "Your order has been delivered. Enjoy your purchase!"
    };

    // Mock dates for timeline steps
    // In a real app, these would come from the database
    const mockDates = {
      pending: new Date(order?.created_at || ''),
      confirmed: order?.status === 'confirmed' || order?.status === 'shipped' || order?.status === 'delivered' 
        ? new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000) // +1 day
        : null,
      shipped: order?.status === 'shipped' || order?.status === 'delivered'
        ? new Date(new Date(order?.created_at || '').getTime() + 3 * 24 * 60 * 60 * 1000) // +3 days
        : null,
      delivered: order?.status === 'delivered'
        ? new Date(new Date(order?.created_at || '').getTime() + 5 * 24 * 60 * 60 * 1000) // +5 days
        : null
    };

    const steps = [
      { 
        name: 'Order Placed', 
        status: 'pending', 
        icon: Package,
        description: statusDescriptions.pending,
        date: mockDates.pending
      },
      { 
        name: 'Confirmed', 
        status: 'confirmed', 
        icon: CheckCircle,
        description: statusDescriptions.confirmed,
        date: mockDates.confirmed
      },
      { 
        name: 'Shipped', 
        status: 'shipped', 
        icon: Truck,
        description: statusDescriptions.shipped,
        date: mockDates.shipped
      },
      { 
        name: 'Delivered', 
        status: 'delivered', 
        icon: MapPin,
        description: statusDescriptions.delivered,
        date: mockDates.delivered
      }
    ];

    const statusIndex = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(status);
    const currentDate = new Date();

    return steps.map((step, index) => {
      const StepIcon = step.icon;
      const isCompleted = index <= statusIndex;
      const isCurrent = index === statusIndex;
      const isPending = index > statusIndex;
      
      // Calculate estimated date for future steps
      let estimatedDate = null;
      if (isPending && order) {
        const createdDate = new Date(order.created_at);
        // Add days based on step (simplified estimation)
        switch(index) {
          case 1: // confirmed: +1 day from order date
            estimatedDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 2: // shipped: +3 days from order date
            estimatedDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            break;
          case 3: // delivered: +5 days from order date
            estimatedDate = new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000);
            break;
        }
        
        // If estimated date is in the past but status hasn't changed, show "Expected soon"
        if (estimatedDate && estimatedDate < currentDate) {
          estimatedDate = null;
        }
      }
      
      const dateToShow = step.date || estimatedDate;

      return {
        ...step,
        isCompleted,
        isCurrent,
        isPending,
        dateToShow
      };
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return null;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md">
          {error || 'Order not found'}
        </div>
        <Link
          to="/profile/orders"
          className="mt-4 inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const timeline = getStatusTimeline(order.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <BreadcrumbNav 
        items={[
          { name: 'Home', href: '/' },
          { name: 'Profile', href: '/profile' },
          { name: 'Orders', href: '/profile/orders' },
          { name: `Order #${order.id.slice(0, 8)}` }
        ]} 
      />

      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Order Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold dark:text-white">Order #{order.id.slice(0, 8)}</h1>
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Order Timeline - Improved Version */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
            <h2 className="text-lg font-medium mb-6 text-gray-900 dark:text-white">Order Progress</h2>
            
            <div className="relative">
              {/* Timeline Track */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 transform -translate-x-1/2"></div>
              
              <div className="space-y-12">
                {timeline.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.name} className="relative flex flex-col md:flex-row items-center">
                      {/* Status Icon */}
                      <div className="flex h-9 items-center justify-center">
                        <div className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full ${
                          step.isCompleted
                            ? 'bg-primary-600 dark:bg-primary-500'
                            : step.isCurrent
                              ? 'bg-primary-100 dark:bg-primary-900/50 border-2 border-primary-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <StepIcon className={`w-5 h-5 ${
                            step.isCompleted 
                              ? 'text-white' 
                              : step.isCurrent
                                ? 'text-primary-700 dark:text-primary-400' 
                                : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        </div>
                      </div>
                      
                      {/* Timeline Content */}
                      <div className="mt-3 md:mt-0 md:ml-6 md:w-3/4 text-center md:text-left">
                        <div className={`font-medium ${
                          step.isCompleted 
                            ? 'text-primary-600 dark:text-primary-400' 
                            : step.isCurrent
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {step.name}
                        </div>
                        
                        <div className="mt-2 flex flex-col md:flex-row md:items-center text-sm">
                          {/* Status Date */}
                          {step.dateToShow && (
                            <div className={`flex items-center ${
                              step.isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                              {step.isCompleted ? (
                                <span>{formatDateTime(step.dateToShow)}</span>
                              ) : (
                                <span>Expected {formatDateTime(step.dateToShow) || 'soon'}</span>
                              )}
                            </div>
                          )}
                          
                          {/* Status Indicator */}
                          <div className="mt-1 md:mt-0 md:ml-3">
                            {step.isCompleted ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            ) : step.isCurrent ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                <Clock className="h-3 w-3 mr-1" />
                                In Progress
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium mb-4 dark:text-white">Order Items</h2>
            <div className="flow-root">
              <ul className="-my-6 divide-y divide-gray-200 dark:divide-gray-700">
                {order.items.map((item, index) => (
                  <li key={index} className="py-6 flex">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </h4>
                          <div className="mt-1 flex text-sm text-gray-500 dark:text-gray-400">
                            <p>Quantity: {item.quantity}</p>
                            {item.discount > 0 && (
                              <p className="ml-4">Discount: {item.discount}%</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          {item.discount > 0 && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-through">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium mb-4 dark:text-white">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="dark:text-white">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="dark:text-white">{formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="dark:text-white">{formatPrice(order.tax)}</span>
              </div>
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-lg font-bold">
                  <span className="dark:text-white">Total</span>
                  <span className="dark:text-white">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Payment */}
          <div className="p-6 grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium mb-4 dark:text-white">Shipping Information</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.shipping_address.fullName}
                </p>
                <p>{order.shipping_address.addressLine1}</p>
                {order.shipping_address.addressLine2 && (
                  <p>{order.shipping_address.addressLine2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.pincode}
                </p>
                <p className="mt-2">Phone: {order.shipping_address.phone}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4 dark:text-white">Payment Information</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
                    </p>
                    <p className="mt-2">Status: {order.status === 'pending' ? 'Pending' : 'Completed'}</p>
                    
                    {order.payment_method === 'bank' && (
                      <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          If you haven't completed your payment yet, please use the bank details 
                          provided during checkout and include your order number as reference.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Need help with your order?</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  If you have any questions about your order, please contact our customer support team at 
                  <a href="tel:+917594888505" className="ml-1 text-primary-600 dark:text-primary-400">
                    +91 759 488 8505
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between items-center">
          <Link
            to="/profile/orders"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            ← Back to Orders
          </Link>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
            onClick={() => window.print()}
          >
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;