import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  ArrowLeftIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { paymentAPI, landAPI, agreementAPI, installmentAPI, tokenAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Agreement, Installment } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

export default function BuyerCreatePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  
  // Get pre-filled values from URL params
  const installmentId = searchParams.get('installmentId');
  const landIdParam = searchParams.get('landId');
  const agreementIdParam = searchParams.get('agreementId');
  const amountParam = searchParams.get('amount');

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [land, setLand] = useState<Land | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [installment, setInstallment] = useState<Installment | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<{
    totalPaid: number;
    remainingBalance: number;
    totalAmount: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    landId: landIdParam || '',
    agreementId: agreementIdParam || '',
    installmentId: installmentId || '',
    amount: amountParam || '',
    paymentMode: 'bank' as 'bank' | 'points',
    transactionHash: '',
    dueDate: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [pointsBalance, setPointsBalance] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch points balance when user selects Pay with Points
  useEffect(() => {
    if (formData.paymentMode !== 'points' || !user?.walletAddress) {
      setPointsBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await tokenAPI.getBalance(user.walletAddress);
        if (cancelled || !res.success || res.balance == null) {
          if (!cancelled) setPointsBalance('0');
          return;
        }
        const rawStr = String(res.balance).trim();
        const human = rawStr === '' ? '0' : (Number(BigInt(rawStr) / (10n ** 18n))).toString();
        if (!cancelled) setPointsBalance(human);
      } catch {
        if (!cancelled) setPointsBalance('0');
      }
    })();
    return () => { cancelled = true; };
  }, [formData.paymentMode, user?.walletAddress]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Load land if landId provided
      if (formData.landId) {
        try {
          const landData = await landAPI.getById(formData.landId);
          setLand(landData);
        } catch (err) {
          console.error('Failed to load land:', err);
        }
      }

      // Load agreement if agreementId provided
      if (formData.agreementId) {
        try {
          const agreementData = await agreementAPI.getById(formData.agreementId);
          setAgreement(agreementData);
          
          // Load payment summary
          if (formData.landId) {
            try {
              const summary = await paymentAPI.getInstallmentSummary(formData.landId);
              setPaymentSummary(summary);
            } catch (err) {
              console.error('Failed to load payment summary:', err);
            }
          }
        } catch (err) {
          console.error('Failed to load agreement:', err);
        }
      }

      // Load installment if installmentId provided
      if (formData.installmentId) {
        try {
          const installments = await installmentAPI.getAll({ 
            buyerId: user?.id,
            agreementId: formData.agreementId,
          });
          const foundInstallment = installments.find((inst: Installment) => inst.id === formData.installmentId);
          if (foundInstallment) {
            setInstallment(foundInstallment);
            if (!formData.amount) {
              setFormData((prev) => ({
                ...prev,
                amount: foundInstallment.amount.toString(),
                dueDate: new Date(foundInstallment.paymentWindowEnd).toISOString().split('T')[0],
              }));
            }
          }
        } catch (err) {
          console.error('Failed to load installment:', err);
        }
      }
    } catch (error: unknown) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.landId) {
      setError('Property ID is required');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (formData.paymentMode === 'bank' && !proofFile) {
      setError('Payment proof is required for bank transfers');
      return;
    }

    if (formData.paymentMode === 'points') {
      const amountNum = parseFloat(formData.amount);
      const balanceNum = pointsBalance != null ? parseFloat(pointsBalance) : null;
      if (balanceNum != null && balanceNum < amountNum) {
        setError('Insufficient points balance');
        return;
      }
      if (!user?.walletAddress) {
        setError('Wallet address is required for points payment');
        return;
      }
    }

    try {
      setLoading(true);

      const paymentFormData = new FormData();
      paymentFormData.append('landId', formData.landId);
      
      if (formData.agreementId) {
        paymentFormData.append('agreementId', formData.agreementId);
      }
      
      if (formData.installmentId) {
        paymentFormData.append('installmentId', formData.installmentId);
      }
      
      paymentFormData.append('amount', formData.amount);
      paymentFormData.append('paymentMode', formData.paymentMode);
      
      if (formData.dueDate) {
        paymentFormData.append('dueDate', formData.dueDate);
      }
      
      if (formData.paymentMode === 'bank' && proofFile) {
        paymentFormData.append('proof', proofFile);
      }

      await paymentAPI.create(paymentFormData);
      
      setSuccess(
        formData.paymentMode === 'points'
          ? 'Payment confirmed! Points have been transferred.'
          : 'Payment submitted. Waiting for builder verification.'
      );
      setTimeout(() => {
        navigate('/dashboard/buyer/payments');
      }, 2000);
    } catch (err: unknown) {
      console.error('Failed to create payment:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout navItems={buyerNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={buyerNavItems}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm mb-4 text-white border-white flex flex-row w-30"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Create Payment</h1>
          <p className="text-gray-400 mt-1">Submit a payment for your property purchase</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span className="text-white">{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <span className="text-white">{success}</span>
          </div>
        )}

        {/* Property/Agreement Info */}
        {(land || agreement || installment) && (
          <div className="card bg-blue-950 shadow-2xl border border-blue-800 mb-6">
            <div className="card-body">
              <h3 className="card-title text-blue-100 font-medium">Payment Details</h3>
              {land && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-300">Property</p>
                    <p className="text-white font-semibold">{land.title}</p>
                    <p className="text-sm text-blue-200">{land.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-300">Listed Price</p>
                    <p className="text-white">PKR {typeof land.price === 'string' ? parseFloat(land.price).toLocaleString() : land.price?.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {agreement && (
                <div className="mt-4">
                  <p className="text-sm text-blue-300">Agreement</p>
                  <p className="text-white">
                    {agreement.agreementType.replace('_', ' ').toUpperCase()} - {agreement.status}
                  </p>
                  {agreement.terms?.totalAmount && (
                    <p className="text-sm text-blue-200">
                      Total Amount: PKR {agreement.terms.totalAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {installment && (
                <div className="mt-4">
                  <p className="text-sm text-blue-300">Installment</p>
                  <p className="text-white">
                    Amount: PKR {installment.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-200">
                    Payment Window: {new Date(installment.paymentWindowStart).toLocaleDateString()} - {new Date(installment.paymentWindowEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
              {paymentSummary && (
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-300">Total Paid</p>
                    <p className="text-white font-semibold">PKR {paymentSummary.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-300">Remaining Balance</p>
                    <p className="text-white font-semibold">PKR {paymentSummary.remainingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-300">Total Amount</p>
                    <p className="text-white font-semibold">PKR {paymentSummary.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="card bg-gray-800/90 shadow-xl border border-gray-700 ">
          <div className="card-body">
            <h2 className="card-title text-white mb-4">Payment Information</h2>

            {/* Property ID */}
            <div className="form-control mb-4 bg-transparent">
              <label className="label">
                <span className="label-text text-white font-medium">Property ID <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                value={formData.landId}
                onChange={(e) => setFormData({ ...formData, landId: e.target.value })}
                className="input input-bordered bg-gray-700 text-white border-gray-600"
                required
                disabled={!!landIdParam}
              />
             
            </div>

            {/* Agreement ID (Optional) */}
            {formData.agreementId && (
              <div className="form-control mb-4 bg-transparent">
                <label className="label">
                  <span className="label-text text-white font-medium">Agreement ID</span>
                </label>
                <input
                  type="text"
                  value={formData.agreementId}
                  className="input input-bordered bg-gray-700 text-white border-gray-600"
                  disabled
                />
               
              </div>
            )}

            {/* Installment ID (Optional) */}
            {formData.installmentId && (
              <div className="form-control mb-4 bg-transparent">
                <label className="label">
                  <span className="label-text text-white font-medium">Installment ID</span>
                </label>
                <input
                  type="text"
                  value={formData.installmentId}
                  className="input input-bordered bg-gray-700 text-white border-gray-600"
                  disabled
                />
               
              </div>
            )}

            {/* Amount */}
            <div className="form-control mb-4 bg-transparent">
              <label className="label">
                <span className="label-text text-white font-medium">Payment Amount (PKR) <span className="text-red-400">*</span></span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input input-bordered bg-gray-700 text-white border-gray-600 p-2"
                required
                disabled={!!amountParam}
              />
              {paymentSummary && (
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    Remaining balance: PKR {paymentSummary.remainingBalance.toLocaleString()}
                  </span>
                </label>
              )}
            </div>

            {/* Payment Mode */}
            <div className="form-control mb-4 bg-transparent">
              <label className="label">
                <span className="label-text text-white font-medium">Payment Mode <span className="text-red-400">*</span></span>
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as 'bank' | 'points' })}
                className="select select-bordered bg-gray-700 text-white border-gray-600 p-2"
                required
              >
                <option value="bank">Bank Transfer</option>
                <option value="points">Pay with Points</option>
              </select>
            </div>

            {/* Bank Payment - Proof File */}
            {formData.paymentMode === 'bank' && (
              <div className="form-control mb-4 bg-transparent">
                <label className="label">
                  <span className="label-text text-white font-medium">
                    Payment Proof (PDF/Image) <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="file-input file-input-bordered bg-gray-700 text-white border-gray-600 w-full"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    Upload bank transfer receipt or proof of payment
                  </span>
                </label>
              </div>
            )}

            {/* Points Payment - balance and info */}
            {formData.paymentMode === 'points' && (
              <div className="form-control mb-4 bg-transparent">
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-600">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <BanknotesIcon className="h-5 w-5 text-primary" />
                    Your points balance
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    PKR {pointsBalance != null ? parseFloat(pointsBalance).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : '…'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Points will be deducted from your balance and transferred to the property owner. No proof upload needed.
                  </p>
                  {pointsBalance != null && formData.amount && parseFloat(pointsBalance) < parseFloat(formData.amount) && (
                    <p className="text-sm text-error mt-2">Insufficient balance for this amount.</p>
                  )}
                </div>
              </div>
            )}

            {/* Due Date (Optional) */}
            <div className="form-control mb-4 bg-transparent">
              <label className="label">
                <span className="label-text text-white font-medium">Due Date <span className='text-red-500 pr-2'>*</span></span>
              </label>
              <input
                type="date"
                required  
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input p-2 input-bordered bg-gray-700 text-white border-gray-600"
              />
              <label className="label">
                <span className="label-text-alt text-gray-400 pl-2">
                  Payment due date
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost text-white border-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex flex-row "
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <CreditCardIcon className="w-5 h-5 mr-2" />
                    Submit Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
