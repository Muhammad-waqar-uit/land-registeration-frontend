import { useState, useEffect } from 'react';
import { tokenAPI } from '../services/api';

interface TokenBalanceProps {
  walletAddress: string;
}

export default function TokenBalance({ walletAddress }: TokenBalanceProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await tokenAPI.getBalance(walletAddress);

        if (response.success && response.data) {
          // Convert from wei to tokens (divide by 10^18)
          const balanceInWei = response.data.balance || '0';
          const decimals = response.data.decimals || 18;
          const balanceInTokens = parseFloat(balanceInWei) / Math.pow(10, decimals);
          setBalance(balanceInTokens.toString());
        } else {
          setBalance('0');
        }
      } catch (err: unknown) {
        console.error('Failed to fetch token balance:', err);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    
    return () => clearInterval(interval);
  }, [walletAddress]);

  if (!walletAddress) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-white text-sm">Loading...</span>
      </div>
    );
  }

  // Format balance to show up to 4 decimal places, removing trailing zeros
  const formattedBalance = balance 
    ? parseFloat(balance).toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 4 
      })
    : '0';

  return (
    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg" title={`${balance} tokens`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-white text-sm font-semibold">
        {formattedBalance}
      </span>
      <span className="text-white/70 text-xs">
        Tokens
      </span>
    </div>
  );
}
