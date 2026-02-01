import { useEffect, useState, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { buyerProgressAPI, projectAPI } from '../../services/api';
import type { BuyerProgressItem, BuyerProgressStats, Project } from '../../types';
import { builderNavItems } from '../../constants/navigation';

export default function SellerBuyerProgress() {
  const location = useLocation();
  const [buyerProgress, setBuyerProgress] = useState<BuyerProgressItem[]>([]);
  const [stats, setStats] = useState<BuyerProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'reserved' | 'paying' | 'completed' | undefined>(undefined);
  const [projectFilter, _setProjectFilter] = useState<string | undefined>(undefined);
  const [_projects, setProjects] = useState<Project[]>([]);

  // Determine navigation items based on current route
  const isBuilderRoute = location.pathname.startsWith('/dashboard/builder');
  const navItems = isBuilderRoute ? builderNavItems : [
    { name: 'Overview', path: '/dashboard/seller', icon: HomeIcon },
    { name: 'My Lands', path: '/dashboard/seller/lands', icon: DocumentTextIcon },
    { name: 'Buyer Progress', path: '/dashboard/seller/buyers', icon: UserGroupIcon },
    { name: 'Payments', path: '/dashboard/seller/payments', icon: CreditCardIcon },
  ];

  // Load projects for filter dropdown
  useEffect(() => {
    projectAPI.getAll({ status: 'approved' }).then(setProjects).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching buyer progress with filters:', { statusFilter, projectFilter });
      const response = await buyerProgressAPI.getProgress({
        status: statusFilter,
        projectId: projectFilter,
      });
      console.log('✅ Buyer progress response received:', {
        dataCount: response.data?.length || 0,
        hasStats: !!response.stats,
        hasByStatus: !!response.stats?.byStatus,
        hasByProject: !!response.stats?.byProject,
        totalBuyers: response.stats?.totalBuyers,
      });
      setBuyerProgress(response.data || []);
      setStats(response.stats || null);
    } catch (error) {
      console.error('❌ Failed to fetch buyer progress:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      console.error('Error details:', errorMessage || 'Unknown error');
      setBuyerProgress([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, projectFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reserved':
        return 'bg-yellow-500';
      case 'paying':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Buyer Progress Tracking</h1>
            <p className="text-gray-400 mt-1">Track payment progress for all your property buyers</p>
          </div>
          <Link to={isBuilderRoute ? "/dashboard/builder" : "/dashboard/seller"} className="btn btn-ghost text-white border-white">
            Back to Dashboard
          </Link>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
                <div className="stat-title text-gray-300">Total Buyers</div>
                <div className="stat-value text-blue-400">{stats.totalBuyers}</div>
              </div>
              <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
                <div className="stat-title text-gray-300">Reserved</div>
                <div className="stat-value text-yellow-400">{stats.reserved}</div>
                {stats.byStatus?.reserved && (
                  <div className="stat-desc text-yellow-300">PKR {stats.byStatus.reserved.revenue.toLocaleString()}</div>
                )}
              </div>
              <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
                <div className="stat-title text-gray-300">In Progress</div>
                <div className="stat-value text-blue-400">{stats.inProgress}</div>
                {stats.byStatus?.paying && (
                  <div className="stat-desc text-blue-300">PKR {stats.byStatus.paying.revenue.toLocaleString()}</div>
                )}
              </div>
              <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
                <div className="stat-title text-gray-300">Completed</div>
                <div className="stat-value text-green-400">{stats.completed}</div>
                {stats.byStatus?.completed && (
                  <div className="stat-desc text-green-300">PKR {stats.byStatus.completed.revenue.toLocaleString()}</div>
                )}
              </div>
              <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
                <div className="stat-title text-gray-300">Total Revenue</div>
                <div className="stat-value text-green-400">PKR {stats.totalRevenue.toLocaleString()}</div>
              </div>
              <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
                <div className="stat-title text-gray-300">Pending Revenue</div>
                <div className="stat-value text-orange-400">PKR {stats.pendingRevenue.toLocaleString()}</div>
              </div>
            </div>

            {/* Per-Project Stats */}
            {stats.byProject && Object.keys(stats.byProject).length > 0 && (
              <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
                <div className="card-body">
                  <h2 className="card-title text-white mb-4">Progress by Project</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(stats.byProject).map(([projectId, projectStats]) => (
                      <div key={projectId} className="bg-gray-700/50 rounded-lg p-4">
                        <h3 className="font-bold text-white mb-2">{projectStats.projectName}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Total Buyers:</span>
                            <span className="text-white font-semibold">{projectStats.totalBuyers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Reserved:</span>
                            <span className="text-yellow-400">{projectStats.reserved}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">In Progress:</span>
                            <span className="text-blue-400">{projectStats.inProgress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Completed:</span>
                            <span className="text-green-400">{projectStats.completed}</span>
                          </div>
                          <div className="divider my-2"></div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Revenue:</span>
                            <span className="text-green-400 font-semibold">PKR {projectStats.totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Pending:</span>
                            <span className="text-orange-400 font-semibold">PKR {projectStats.pendingRevenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter Tabs */}
          <div className="tabs tabs-boxed bg-gray-800/90 border border-gray-700 flex-1">
            <a
              className={`tab text-white ${statusFilter === undefined ? 'tab-active bg-purple-600' : 'hover:bg-gray-700'}`}
              onClick={() => setStatusFilter(undefined)}
            >
              All ({stats?.totalBuyers || 0})
            </a>
            <a
              className={`tab text-white ${statusFilter === 'reserved' ? 'tab-active bg-yellow-600' : 'hover:bg-gray-700'}`}
              onClick={() => setStatusFilter('reserved')}
            >
              Reserved ({stats?.reserved || 0})
            </a>
            <a
              className={`tab text-white ${statusFilter === 'paying' ? 'tab-active bg-blue-600' : 'hover:bg-gray-700'}`}
              onClick={() => setStatusFilter('paying')}
            >
              In Progress ({stats?.inProgress || 0})
            </a>
            <a
              className={`tab text-white ${statusFilter === 'completed' ? 'tab-active bg-green-600' : 'hover:bg-gray-700'}`}
              onClick={() => setStatusFilter('completed')}
            >
              Completed ({stats?.completed || 0})
            </a>
          </div>

          {/* Project Filter */}
          
        </div>

        {/* Buyer Progress Cards */}
        {buyerProgress.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body text-center py-12">
              <UserGroupIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Buyers Yet</h3>
              <p className="text-gray-400">
                When buyers reserve or make payments on your properties, they'll appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {buyerProgress.map((progress) => {
              // Calculate progress percentage
              const progressPercentage = progress.landPrice > 0
                ? (progress.totalPaid / progress.landPrice) * 100
                : 0;

              return (
                <div
                  key={`${progress.buyerId}_${progress.landId}`}
                  className="card bg-gray-800/90 shadow-xl border border-gray-700 hover:shadow-2xl transition-shadow"
                >
                  <div className="card-body">
                    {/* Header with Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{progress.landTitle}</h3>
                        <p className="text-gray-400 text-sm mt-1">{progress.landLocation}</p>
                        {progress.projectName && (
                          <p className="text-blue-400 text-xs mt-1">
                            📁 {progress.projectName}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getStatusColor(progress.status)}`}
                      >
                        {progress.status === 'reserved'
                          ? 'Reserved'
                          : progress.status === 'paying'
                          ? 'In Progress'
                          : 'Completed'}
                      </span>
                    </div>

                    {/* Buyer Information */}
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{progress.buyerName}</p>
                          <p className="text-sm text-gray-300">{progress.buyerEmail}</p>
                          {progress.buyerPhone && (
                            <p className="text-sm text-gray-300">{progress.buyerPhone}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          Payment Progress
                        </span>
                        <span className="text-lg font-bold text-white">
                          {progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getStatusColor(progress.status)}`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>PKR {progress.totalPaid.toLocaleString()} paid</span>
                        <span>PKR {progress.remainingBalance.toLocaleString()} remaining</span>
                      </div>
                    </div>

                    {/* Payment Statistics */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">
                          PKR {progress.totalPaid.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">Total Paid</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-400">
                          PKR {progress.remainingBalance.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">Remaining</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                          PKR {progress.landPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">Total Price</p>
                      </div>
                    </div>

                    {/* Payment Counts */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                      <div>
                        <span className="text-sm text-gray-400">Verified Payments: </span>
                        <span className="font-semibold text-green-400">
                          {progress.verifiedPayments}
                        </span>
                      </div>
                      {progress.pendingPayments > 0 && (
                        <div>
                          <span className="text-sm text-gray-400">Pending: </span>
                          <span className="font-semibold text-yellow-400">
                            {progress.pendingPayments}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Last Payment Info */}
                    {progress.lastPaymentDate && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-1">Last Payment</p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white">
                            PKR {progress.lastPaymentAmount?.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(progress.lastPaymentDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Agreement Status */}
                    {progress.agreementStatus && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-1">Agreement Status</p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            progress.agreementStatus === 'signed' || progress.agreementStatus === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : progress.agreementStatus === 'draft'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {progress.agreementStatus.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="card-actions justify-end mt-4">
                      {progress.agreementId && (
                        <Link
                          to={`/dashboard/${isBuilderRoute ? 'builder' : 'seller'}/agreements/${progress.agreementId}`}
                          className="btn btn-sm btn-ghost text-white border-white"
                        >
                          View Agreement
                        </Link>
                      )}
                      <Link
                        to={`/lands/${progress.landId}`}
                        className="btn btn-sm btn-primary"
                      >
                        View Property
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
