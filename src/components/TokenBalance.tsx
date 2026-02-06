import { useState, useEffect } from 'react';
import { tokenAPI } from '../services/api';

interface TokenBalanceProps {
  walletAddress: string;
}

export default function TokenBalance({ walletAddress }: TokenBalanceProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const response = await tokenAPI.getBalance(walletAddress);
        if (response.success && response.balance != null) {
          // Token uses 18 decimals on-chain; convert raw to human (divide by 10^18)
          const rawStr = String(response.balance).trim();
          const divisor = 10n ** 18n;
          const human =
            rawStr === '' ? '0' : (Number(BigInt(rawStr) / divisor)).toString();
          setBalance(human);
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

  // Format balance (shows — when API is disabled / not fetched)
  const formattedBalance = balance
    ? parseFloat(balance).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      })
    : '—';

  return (
    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg" title={balance != null ? `${balance} tokens` : 'Balance not loaded'}>
      <span className="text-white text-sm font-semibold">
        PKR {formattedBalance}
      </span>
      
    </div>
  );
}
