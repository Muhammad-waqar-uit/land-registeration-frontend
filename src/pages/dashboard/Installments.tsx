import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { installmentAPI } from '../../services/api';
import type { Installment } from '../../types';
import { CalendarIcon, CurrencyDollarIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { builderNavItems } from '../../constants/navigation';

const Installments: React.FC = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const navigate = useNavigate();

  const fetchInstallments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await installmentAPI.getAll();
      const installmentsArray = Array.isArray(data) ? data : [];
      setInstallments(installmentsArray);
      setError('');
    } catch (err: unknown) {
      console.error('Error fetching installments:', err);
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load installments');
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterInstallments = useCallback((filter: string) => {
    if (filter === 'all') {
      setFilteredInstallments(installments);
    } else {
      setFilteredInstallments(
        installments.filter((inst) => inst.status === filter)
      );
    }
  }, [installments]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  useEffect(() => {
    filterInstallments(activeFilter);
  }, [filterInstallments, activeFilter]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'badge-warning', icon: ClockIcon, text: 'Pending' },
      paid: { color: 'badge-success', icon: CheckCircleIcon, text: 'Paid' },
      overdue: { color: 'badge-error', icon: ExclamationCircleIcon, text: 'Overdue' },
      completed: { color: 'badge-info', icon: CheckCircleIcon, text: 'Completed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`badge ${config.color} gap-1`}>
        <Icon className="h-4 w-4" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const isOverdue = (installment: Installment) => {
    if (installment.status === 'paid' || installment.status === 'completed') return false;
    return new Date(installment.paymentWindowEnd) < new Date();
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: installments.length },
    { key: 'pending', label: 'Pending', count: installments.filter(i => i.status === 'pending').length },
    { key: 'paid', label: 'Paid', count: installments.filter(i => i.status === 'paid').length },
    { key: 'overdue', label: 'Overdue', count: installments.filter(i => i.status === 'overdue').length },
    { key: 'completed', label: 'Completed', count: installments.filter(i => i.status === 'completed').length },
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Installments Management</h1>
            <p className="text-gray-400 mt-1">Create and manage payment installments for buyers</p>
          </div>
          <Link to="/dashboard/builder/installments/create" className="btn btn-primary flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            Create Installments
          </Link>
        </div>

      {error && (
        <div className="alert alert-error mb-6">
          <ExclamationCircleIcon className="h-6 w-6" />
          <span className="text-white">{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${
              activeFilter === tab.key
                ? 'bg-primary border-primary text-white'
                : 'bg-gray-800/90 border-gray-700 text-white hover:bg-gray-700/90'
            }`}
          >
            {tab.label}
            <span className="badge badge-sm bg-gray-700 border-gray-600">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Installments Grid */}
      {filteredInstallments.length === 0 ? (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No installments found</h3>
          <p className="text-gray-400 mb-4">
            {activeFilter === 'all'
              ? 'Create installments from signed agreements to start tracking payments.'
              : `No ${activeFilter} installments at the moment.`}
          </p>
          {activeFilter === 'all' && (
            <Link to="/dashboard/builder/installments/create" className="btn btn-primary">
              Create First Installment
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstallments.map((installment) => (
            <div
              key={installment.id}
              className={`card bg-gray-800/90 shadow-xl hover:shadow-2xl transition-shadow border ${
                isOverdue(installment) ? 'border-error border-2' : 'border-gray-700'
              }`}
            >
              <div className="card-body">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-2">
                  {getStatusBadge(installment.status)}
                  {isOverdue(installment) && (
                    <span className="badge badge-error badge-sm">
                      <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                      Overdue
                    </span>
                  )}
                </div>

                {/* Amount */}
                <h2 className="card-title text-2xl text-primary">
                  {formatCurrency(installment.amount)}
                </h2>

                {/* Property Info */}
                {installment.land && (
                  <div className="text-sm text-gray-300 mb-2">
                    <p className="font-semibold text-white">{installment.land.title}</p>
                    <p>{installment.land.location}</p>
                  </div>
                )}

                {/* Buyer Info */}
                {installment.buyer && (
                  <div className="text-sm mb-3">
                    <p className="text-gray-400">Buyer:</p>
                    <p className="font-medium text-white">{installment.buyer.name}</p>
                    <p className="text-xs text-gray-400">{installment.buyer.email}</p>
                  </div>
                )}

                {/* Payment Window */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Window Start: {formatDate(installment.paymentWindowStart)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Window End: {formatDate(installment.paymentWindowEnd)}</span>
                  </div>
                  {installment.paymentDate && (
                    <div className="flex items-center text-sm text-success">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      <span>Paid on: {formatDate(installment.paymentDate)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="card-actions justify-end">
                  {installment.agreement && (
                    <Link
                      to={`/dashboard/builder/agreements/${installment.agreementId}`}
                      className="btn btn-sm btn-ghost"
                    >
                      View Agreement
                    </Link>
                  )}
                  <button
                    onClick={() => navigate(`/dashboard/installments/${installment.id}`)}
                    className="btn btn-sm btn-primary"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredInstallments.length > 0 && (
        <div className="stats stats-vertical lg:stats-horizontal shadow mt-8 w-full bg-gray-800/90 border border-gray-700">
          <div className="stat">
            <div className="stat-title text-gray-400">Total Installments</div>
            <div className="stat-value text-primary">{filteredInstallments.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-gray-400">Total Amount</div>
            <div className="stat-value text-secondary">
              {formatCurrency(
                filteredInstallments.reduce((sum, inst) => sum + inst.amount, 0)
              )}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title text-gray-400">Paid Amount</div>
            <div className="stat-value text-success">
              {formatCurrency(
                filteredInstallments
                  .filter((inst) => inst.status === 'paid' || inst.status === 'completed')
                  .reduce((sum, inst) => sum + inst.amount, 0)
              )}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title text-gray-400">Pending Amount</div>
            <div className="stat-value text-warning">
              {formatCurrency(
                filteredInstallments
                  .filter((inst) => inst.status === 'pending' || inst.status === 'overdue')
                  .reduce((sum, inst) => sum + inst.amount, 0)
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default Installments;
