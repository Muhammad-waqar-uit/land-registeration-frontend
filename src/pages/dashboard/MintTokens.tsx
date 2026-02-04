import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { tokenAPI, authAPI } from '../../services/api';
import type { User } from '../../types';
import {
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { adminNavItems } from '../../constants/navigation';
import { getBlockExplorerTxUrl } from '../../utils/blockchain';

export default function MintTokens() {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  } | null>(null);

  // User selection state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [usersPage] = useState(1);
  const [usersLimit] = useState(50);
  const [userFieldTouched, setUserFieldTouched] = useState(false); // Track if user field has been interacted with

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark user field as touched when form is submitted
    setUserFieldTouched(true);
    
    // Validate before submitting
    if (!selectedUser || !toAddress || !amount || !isValidAddress(toAddress)) {
      return;
    }
    
    setLoading(true);
    setResult(null);

    try {
      const response = await tokenAPI.mintTokens(toAddress, parseFloat(amount));
      setResult(response);

      if (response.success) {
        // Clear form on success
        setToAddress('');
        setAmount('');
        setSelectedUser(null);
        setUserSearch('');
        setUserFieldTouched(false); // Reset touched state on success
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

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await authAPI.getAllUsers({
          page: usersPage,
          limit: usersLimit,
        });
        setUsers(response.data.filter(user => user.walletAddress)); // Only show users with wallet addresses
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [usersPage, usersLimit]);

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    if (!userSearch) return true;
    const searchLower = userSearch.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.walletAddress?.toLowerCase().includes(searchLower) ||
      false
    );
  });

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    if (user.walletAddress) {
      setToAddress(user.walletAddress);
    }
    setShowUserDropdown(false);
    setUserSearch('');
  };

  // Clear user selection
  const handleClearUser = () => {
    setSelectedUser(null);
    setToAddress('');
    setUserSearch('');
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
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
              {/* User Selection - MANDATORY */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-800">
                    Select User <span className="text-red-400">*</span>
                  </span>
                </label>
                <div className="relative">
                  {selectedUser ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-700 border border-gray-600 rounded-lg">
                      <div className="flex-1">
                        <div className="text-white font-medium">{selectedUser.name}</div>
                        <div className="text-gray-400 text-sm">{selectedUser.email}</div>
                        <div className="text-gray-500 text-xs font-mono mt-1">{selectedUser.walletAddress}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearUser}
                        className="btn btn-sm btn-ghost text-white"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users by name, email, or wallet address..."
                          className="input w-full pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                        />
                      </div>
                      {showUserDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowUserDropdown(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {usersLoading ? (
                              <div className="p-4 text-center text-gray-400">
                                <span className="loading loading-spinner loading-sm"></span>
                                <span className="ml-2">Loading users...</span>
                              </div>
                            ) : filteredUsers.length === 0 ? (
                              <div className="p-4 text-center text-gray-400">
                                {userSearch ? 'No users found' : 'No users available'}
                              </div>
                            ) : (
                              filteredUsers.map((user) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => handleUserSelect(user)}
                                  className="w-full text-left p-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition-colors"
                                >
                                  <div className="text-white font-medium">{user.name}</div>
                                  <div className="text-gray-400 text-sm">{user.email}</div>
                                  {user.walletAddress && (
                                    <div className="text-gray-500 text-xs font-mono mt-1">
                                      {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
                                    </div>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                {!selectedUser && userFieldTouched && (
                  <label className="label">
                    <span className="label-text-alt text-red-400">
                      User selection is required to mint tokens
                    </span>
                  </label>
                )}
                {!selectedUser && !userFieldTouched && (
                  <label className="label">
                    <span className="label-text-alt text-gray-400">
                      Select a user to automatically fill their wallet address
                    </span>
                  </label>
                )}
                {selectedUser && (
                  <label className="label">
                    <span className="label-text-alt text-green-400">
                      User selected - address will be filled automatically
                    </span>
                  </label>
                )}
              </div>

              {/* Recipient Address - Read-only from selected user */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-800">Recipient Address</span>
                </label>
                <input
                  type="text"
                  placeholder={selectedUser ? "Address will be filled automatically" : "Select a user first..."}
                  className={`input w-full font-mono bg-gray-700 border-gray-600 p-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                    toAddress && !isValidAddress(toAddress) ? 'border-red-500' : ''
                  } ${!selectedUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={toAddress}
                  readOnly
                  disabled={!selectedUser}
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
                    Wallet address from selected user (automatically filled)
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
                  disabled={loading || !selectedUser || !toAddress || !amount || !isValidAddress(toAddress)}
                >
                  {loading ? 'Minting Tokens...' : 'Mint Tokens'}
                </button>
                {!selectedUser && userFieldTouched && (
                  <label className="label">
                    <span className="label-text-alt text-red-400 mt-2">
                      Please select a user before minting tokens
                    </span>
                  </label>
                )}
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
                          {result.transactionHash && getBlockExplorerTxUrl(result.transactionHash) ? (
                            <a
                              href={getBlockExplorerTxUrl(result.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-300 hover:text-green-200 link underline"
                            >
                              {result.transactionHash}
                            </a>
                          ) : (
                            result.transactionHash
                          )}
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
