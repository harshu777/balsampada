'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  BookOpenIcon,
  BanknotesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface PendingPayment {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  class: {
    _id: string;
    title: string;
    price: number;
  };
  enrollmentDate: string;
  payment: {
    status: string;
    amount: number;
    paidAmount: number;
    paymentMethod?: string;
    paymentDate?: string;
  };
  status: string;
}

export default function TeacherPaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [approvalModal, setApprovalModal] = useState({ show: false, action: '' as 'approve' | 'deny' | '' });
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enrollments/payments/pending');
      setPendingPayments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = (payment: PendingPayment, action: 'approve' | 'deny') => {
    setSelectedPayment(payment);
    setPaymentDetails({
      amount: payment.class.price,
      paymentMethod: 'cash',
      transactionId: '',
      notes: ''
    });
    setApprovalModal({ show: true, action });
  };

  const submitPaymentUpdate = async () => {
    if (!selectedPayment) return;

    const status = approvalModal.action === 'approve' ? 'paid' : 'pending';
    
    try {
      await api.put(`/enrollments/${selectedPayment._id}/payment`, {
        status,
        amount: paymentDetails.amount,
        paymentMethod: paymentDetails.paymentMethod,
        transactionId: paymentDetails.transactionId,
        notes: paymentDetails.notes
      });

      toast.success(
        approvalModal.action === 'approve' 
          ? 'Payment approved successfully' 
          : 'Payment denied'
      );

      // Refresh the list
      fetchPendingPayments();
      
      // Close modal
      setApprovalModal({ show: false, action: '' });
      setSelectedPayment(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'partial': return 'text-orange-600';
      case 'refunded': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="mt-2 text-gray-600">
            Approve or deny student payments for your classes
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPayments.length}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{pendingPayments.reduce((sum, p) => sum + p.class.price, 0)}
                </p>
              </div>
              <CurrencyRupeeIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students Waiting</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(pendingPayments.map(p => p.student._id)).size}
                </p>
              </div>
              <UserIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Pending Payments Table */}
        {pendingPayments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pending payments
            </h3>
            <p className="text-gray-600">
              All student payments have been processed
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.student.email}
                        </div>
                        {payment.student.phone && (
                          <div className="text-sm text-gray-500">
                            {payment.student.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.class.title}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{payment.class.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(payment.enrollmentDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${getStatusColor(payment.payment.status)}`}>
                        {payment.payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePaymentAction(payment, 'approve')}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handlePaymentAction(payment, 'deny')}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Approval Modal */}
        {approvalModal.show && selectedPayment && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalModal.action === 'approve' ? 'Approve Payment' : 'Deny Payment'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Student</p>
                  <p className="font-medium">{selectedPayment.student.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="font-medium">{selectedPayment.class.title}</p>
                </div>
                
                {approvalModal.action === 'approve' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount Received (₹)
                      </label>
                      <input
                        type="number"
                        value={paymentDetails.amount}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentDetails.paymentMethod}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.transactionId}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                        placeholder="For UPI/Bank Transfer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={paymentDetails.notes}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                    placeholder={approvalModal.action === 'deny' ? 'Reason for denial' : 'Additional notes'}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setApprovalModal({ show: false, action: '' });
                    setSelectedPayment(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPaymentUpdate}
                  className={`px-4 py-2 text-white rounded-md ${
                    approvalModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalModal.action === 'approve' ? 'Approve Payment' : 'Deny Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}