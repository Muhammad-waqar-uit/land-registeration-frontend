import { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { tokenAPI } from '../../services/api';
import { CurrencyDollarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function MintTokens() {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await tokenAPI.mintTokens(toAddress, parseFloat(amount));
      setResult(response);

      if (response.success) {
        // Clear form on success
        setToAddress('');
        setAmount('');
      }
    } catch (error: unknown) {
      console.error('Mint tokens error:', error);
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      setResult({
        success: false,
        error: err.response?.data?.error || err.response?.data?.message || 'Failed to mint tokens. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Validate Ethereum address format
  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard/admin', icon: CurrencyDollarIcon },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Mint Tokens</h1>
          <p className="text-gray-300">
            Mint new ERC20 tokens to any wallet address. Admin access required.
          </p>
        </div>

        {/* Mint Form */}
        <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4 text-white">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
              Mint New Tokens
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipient Address */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-800">Recipient Address</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className={`input w-full font-mono bg-gray-700 border-gray-600 p-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500  ${
                    toAddress && !isValidAddress(toAddress) ? 'border-red-500' : ''
                  }`}
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  required
                />
                {toAddress && !isValidAddress(toAddress) && (
                  <label className="label">
                    <span className="label-text-alt text-red-400">
                      Invalid Ethereum address format. Must start with 0x followed by 40 hexadecimal characters.
                    </span>
                  </label>
                )}
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    Enter the wallet address that will receive the tokens
                  </span>
                </label>
              </div>

              {/* Amount */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-800">Amount</span>
                </label>
                <input
                  type="number"
                  placeholder="1000"
                  className="input w-full bg-gray-700 p-2 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.000001"
                  step="0.000001"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    Number of tokens to mint (minimum: 0.000001)
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="form-control mt-6">
                <button
                  type="submit"
                  className={`btn bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 ${loading ? 'loading opacity-75' : ''}`}
                  disabled={loading || !toAddress || !amount || !isValidAddress(toAddress)}
                >
                  {loading ? 'Minting Tokens...' : 'Mint Tokens'}
                </button>
              </div>
            </form>

            {/* Result Messages */}
            {result && (
              <div className="mt-6">
                {result.success ? (
                  <div className="alert bg-green-600/20 border border-green-500 text-green-100">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                    <div className="flex-1">
                      <h3 className="font-bold text-green-300">Tokens Minted Successfully!</h3>
                      <div className="text-sm mt-2">
                        <p className="font-semibold text-green-200">Transaction Hash:</p>
                        <p className="font-mono break-all text-xs mt-1 text-green-100">
                          {result.transactionHash}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert bg-red-600/20 border border-red-500 text-red-100">
                    <XCircleIcon className="h-6 w-6 text-red-400" />
                    <div>
                      <h3 className="font-bold text-red-300">Minting Failed</h3>
                      <p className="text-sm text-red-200">{result.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="card bg-gray-800/90 shadow-xl mt-6 border border-gray-700">
          <div className="card-body">
            <h3 className="card-title text-lg text-blue-400">Important Notes</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
              <li>Only admin users can mint tokens</li>
              <li>All addresses must be valid Ethereum addresses (0x followed by 40 hex characters)</li>
              <li>The amount represents the number of tokens in standard units (not wei)</li>
              <li>Minting creates new tokens and adds them to the specified address</li>
              <li>Each mint operation is recorded on the blockchain</li>
              <li>Wait for blockchain confirmation before considering the operation complete</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
