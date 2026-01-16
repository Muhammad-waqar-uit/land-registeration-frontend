import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { installmentAPI, agreementAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Installment, Agreement } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

export default function BuyerInstallments() {
  const { user } = useAppSelector((state) => state.auth);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue' | 'completed'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get buyer's installments - try my-installments endpoint first, fallback to getAll with buyerId
      let installmentsData;
      try {
        installmentsData = await installmentAPI.getMyInstallments();
      } catch {
        // Fallback to getAll with buyerId filter
        installmentsData = await installmentAPI.getAll({ buyerId: user?.id });
      }
      const installmentsArray = Array.isArray(installmentsData) ? installmentsData : [];
      
      // Filter by status
      let filtered = installmentsArray;
      if (filter !== 'all') {
        filtered = installmentsArray.filter((inst) => {
          if (filter === 'overdue') {
            return inst.status === 'overdue' || (inst.status === 'pending' && new Date(inst.paymentWindowEnd) < new Date());
          }
          return inst.status === filter;
        });
      }
      
      setInstallments(filtered);
      
      // Get signed agreements to show which ones can have installments created
      const agreementsData = await agreementAPI.getAll({ buyerId: user?.id, status: 'signed' });
      setAgreements(Array.isArray(agreementsData) ? agreementsData : []);
    } catch (error: unknown) {
      console.error('Failed to load installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <div className="badge badge-success gap-1"><CheckCircleIcon className="w-4 h-4" />Paid</div>;
      case 'pending':
        return <div className="badge badge-warning gap-1"><ClockIcon className="w-4 h-4" />Pending</div>;
      case 'overdue':
        return <div className="badge badge-error gap-1"><ExclamationCircleIcon className="w-4 h-4" />Overdue</div>;
      default:
        return <div className="badge badge-ghost">{status}</div>;
    }
  };

  const isOverdue = (installment: Installment) => {
    if (installment.status === 'paid' || installment.status === 'completed') return false;
    return new Date(installment.paymentWindowEnd) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canPay = (installment: Installment) => {
    const now = new Date();
    const windowStart = new Date(installment.paymentWindowStart);
    const windowEnd = new Date(installment.paymentWindowEnd);
    return (
      (installment.status === 'pending' || installment.status === 'overdue') &&
      now >= windowStart
    );
  };

  if (loading) {
    return (
      <DashboardLayout navItems={buyerNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  const stats = {
    total: installments.length,
    pending: installments.filter((i) => i.status === 'pending').length,
    paid: installments.filter((i) => i.status === 'paid' || i.status === 'completed').length,
    overdue: installments.filter((i) => isOverdue(i)).length,
    totalAmount: installments.reduce((sum, i) => sum + i.amount, 0),
    paidAmount: installments
      .filter((i) => i.status === 'paid' || i.status === 'completed')
      .reduce((sum, i) => sum + i.amount, 0),
    remainingAmount: installments
      .filter((i) => i.status === 'pending' || i.status === 'overdue')
      .reduce((sum, i) => sum + i.amount, 0),
  };

  return (
    <DashboardLayout navItems={buyerNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">My Installments</h1>
            <p className="text-gray-400 mt-1">View and pay your property installments</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Total Installments</div>
            <div className="stat-value text-blue-400">{stats.total}</div>
          </div>
          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Paid</div>
            <div className="stat-value text-green-400">{stats.paid}</div>
          </div>
          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Pending</div>
            <div className="stat-value text-yellow-400">{stats.pending}</div>
          </div>
          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Remaining</div>
            <div className="stat-value text-primary">PKR {stats.remainingAmount.toLocaleString()}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="tabs tabs-boxed bg-gray-800/90 border border-gray-700">
          <a
            className={`tab text-white ${filter === 'all' ? 'tab-active bg-purple-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </a>
          <a
            className={`tab text-white ${filter === 'pending' ? 'tab-active bg-yellow-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('pending')}
          >
            <ClockIcon className="w-4 h-4 mr-2" />
            Pending ({stats.pending})
          </a>
          <a
            className={`tab text-white ${filter === 'paid' ? 'tab-active bg-green-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('paid')}
          >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Paid ({stats.paid})
          </a>
          <a
            className={`tab text-white ${filter === 'overdue' ? 'tab-active bg-red-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('overdue')}
          >
            <ExclamationCircleIcon className="w-4 h-4 mr-2" />
            Overdue ({stats.overdue})
          </a>
        </div>

        {/* Installments List */}
        {installments.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body items-center text-center">
              <CurrencyDollarIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="card-title text-white">No installments found</h2>
              <p className="text-gray-400">
                {agreements.length > 0
                  ? 'Installments will appear here once the builder creates them from your signed agreements.'
                  : 'You need to have a signed agreement first. Installments will be created by the builder.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {installments.map((installment) => (
              <div
                key={installment.id}
                className={`card bg-gray-800/90 shadow-xl border ${
                  isOverdue(installment) ? 'border-error border-2' : 'border-gray-700'
                }`}
              >
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="card-title text-white">
                        {installment.land?.title || 'Property Installment'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {installment.land?.location || 'Location not available'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(installment.status)}
                      {isOverdue(installment) && (
                        <div className="badge badge-error badge-sm">
                          <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                          Overdue
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Amount</p>
                      <p className="text-white text-xl font-bold">
                        PKR {installment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Payment Window</p>
                      <div className="flex items-center gap-2 text-white">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm">
                          {formatDate(installment.paymentWindowStart)} - {formatDate(installment.paymentWindowEnd)}
                        </span>
                      </div>
                    </div>
                    {installment.paymentDate && (
                      <div>
                        <p className="text-sm text-gray-400">Paid On</p>
                        <p className="text-success">
                          {formatDate(installment.paymentDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="card-actions justify-end mt-4">
                    {installment.agreementId && (
                      <Link
                        to={`/dashboard/buyer/agreements/${installment.agreementId}`}
                        className="btn btn-ghost btn-sm text-white border-white"
                      >
                        View Agreement
                      </Link>
                    )}
                    {canPay(installment) && (
                      <Link
                        to={`/dashboard/buyer/payments/create?installmentId=${installment.id}&landId=${installment.landId}&agreementId=${installment.agreementId}&amount=${installment.amount}`}
                        className="btn btn-primary btn-sm"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Pay Now
                      </Link>
                    )}
                    {installment.status === 'paid' && (
                      <div className="badge badge-success badge-lg">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Paid
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
