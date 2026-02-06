import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { tokenRequestsAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { NavItem } from '../../constants/navigation';
import { CurrencyDollarIcon, ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface RequestPointsProps {
  navItems: NavItem[];
  backPath: string;
  backLabel: string;
}

export default function RequestPoints({ navItems, backPath, backLabel }: RequestPointsProps) {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUploadScreenshot = async () => {
    if (!screenshotFile) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await tokenRequestsAPI.uploadScreenshot(screenshotFile);
      setScreenshotUrl(url);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num < 0.01) {
      setError('Amount must be at least 0.01');
      return;
    }
    if (!user?.walletAddress) {
      setError('Wallet address is required. Please set it in your profile.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await tokenRequestsAPI.create({
        amount: num,
        notes: notes.trim() || undefined,
        screenshotUrl: screenshotUrl || undefined,
      });
      setSuccess(true);
      setAmount('');
      setNotes('');
      setScreenshotFile(null);
      setScreenshotUrl(null);
      setTimeout(() => navigate(backPath.replace('/request-points', '') + '/points-requests'), 1500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-2xl mx-auto">
        <Link to={backPath} className="btn btn-ghost btn-sm text-white gap-2 mb-4 flex flex-row items-center border-black">
          <ArrowLeftIcon className="h-4 w-4" />
          {backLabel}
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Request Points</h1>
        <p className="text-gray-400 mb-6">
          Request points (PKR) for your wallet. Admin will review and award points on approval.
        </p>

        {success && (
          <div className="alert alert-success mb-6">
            Request submitted. Redirecting to My Points Requests…
          </div>
        )}

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="alert alert-error text-white">
                  {error}
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-black">Amount (min 0.01)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered bg-base-200 text-white p-2 w-full"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-black">Notes (optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered bg-base-200 text-white p-2 w-full"
                  placeholder="Reason for request..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-black">Screenshot / proof (optional)</span>
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="file"
                    className="file-input file-input-bordered file-input-sm bg-base-200 text-white max-w-xs"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setScreenshotFile(f || null);
                      if (!f) setScreenshotUrl(null);
                    }}
                  />
                  {screenshotFile && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary gap-1 flex flex-row items-center border-black"
                      onClick={handleUploadScreenshot}
                      disabled={uploading}
                    >
                      <PhotoIcon className="h-4 w-4" />
                      {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                  )}
                  {screenshotUrl && (
                    <span className="text-sm text-success">Uploaded</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary text-white"
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Submit Request'}
                </button>
                <Link to={backPath} className="btn btn-ghost text-white">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
