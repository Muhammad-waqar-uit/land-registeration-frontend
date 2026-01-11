import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { installmentAPI } from '../../services/api';
import type { Installment } from '../../types';
import { CalendarIcon, CurrencyDollarIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const Installments: React.FC = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstallments();
  }, []);

  useEffect(() => {
    filterInstallments(activeFilter);
  }, [installments, activeFilter]);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const data = await installmentAPI.getAll();
      const installmentsArray = Array.isArray(data) ? data : [];
      setInstallments(installmentsArray);
      setError('');
    } catch (err: any) {
      console.error('Error fetching installments:', err);
      setError(err.response?.data?.message || 'Failed to load installments');
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInstallments = (filter: string) => {
    if (filter === 'all') {
      setFilteredInstallments(installments);
    } else {
      setFilteredInstallments(
        installments.filter((inst) => inst.status === filter)
      );
    }
  };

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
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Installments</h1>
          <p className="text-gray-600 mt-1">Manage payment installments</p>
        </div>
        <Link to="/dashboard/builder/installments/create" className="btn btn-primary">
          <CurrencyDollarIcon className="h-5 w-5 mr-2" />
          Create Installments
        </Link>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <ExclamationCircleIcon className="h-6 w-6" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tabs tabs-boxed mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab gap-2 ${activeFilter === tab.key ? 'tab-active' : ''}`}
            onClick={() => handleFilterChange(tab.key)}
          >
            {tab.label}
            <span className="badge badge-sm">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Installments Grid */}
      {filteredInstallments.length === 0 ? (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No installments found</h3>
          <p className="text-gray-500 mb-4">
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
              className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow ${
                isOverdue(installment) ? 'border-2 border-error' : ''
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
                  <div className="text-sm text-gray-600 mb-2">
                    <p className="font-semibold">{installment.land.title}</p>
                    <p>{installment.land.location}</p>
                  </div>
                )}

                {/* Buyer Info */}
                {installment.buyer && (
                  <div className="text-sm mb-3">
                    <p className="text-gray-500">Buyer:</p>
                    <p className="font-medium">{installment.buyer.name}</p>
                    <p className="text-xs text-gray-500">{installment.buyer.email}</p>
                  </div>
                )}

                {/* Payment Window */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Window Start: {formatDate(installment.paymentWindowStart)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
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
        <div className="stats stats-vertical lg:stats-horizontal shadow mt-8 w-full">
          <div className="stat">
            <div className="stat-title">Total Installments</div>
            <div className="stat-value text-primary">{filteredInstallments.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Amount</div>
            <div className="stat-value text-secondary">
              {formatCurrency(
                filteredInstallments.reduce((sum, inst) => sum + inst.amount, 0)
              )}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Paid Amount</div>
            <div className="stat-value text-success">
              {formatCurrency(
                filteredInstallments
                  .filter((inst) => inst.status === 'paid' || inst.status === 'completed')
                  .reduce((sum, inst) => sum + inst.amount, 0)
              )}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Pending Amount</div>
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
  );
};

export default Installments;
