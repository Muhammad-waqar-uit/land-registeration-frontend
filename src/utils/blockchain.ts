/** Base Sepolia block explorer - used for transaction links */
const BLOCK_EXPLORER_BASE = 'https://sepolia.basescan.org';

export function getBlockExplorerTxUrl(txHash: string | undefined | null): string | undefined {
  if (!txHash || typeof txHash !== 'string') return undefined;
  const trimmed = txHash.trim();
  if (!trimmed) return undefined;
  return `${BLOCK_EXPLORER_BASE}/tx/${trimmed}`;
}
