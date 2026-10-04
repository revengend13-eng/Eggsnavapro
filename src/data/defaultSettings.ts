import { SystemSettings } from '../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  id: 'global_config',
  appName: 'EGGS NAVA PRO',
  websiteName: 'EGGS NAVA PRO',
  logoUrl: '',
  faviconUrl: '',
  supportEmail: 'support@eggsnavapro.com',
  whatsappNumber: '+923001234567',
  currency: 'PKR',
  maintenanceMode: false,
  registrationEnabled: true,
  userWithdrawalEnabled: true,
  easypaisaNumber: '03450000000',
  easypaisaTitle: 'EGGS NAVA REWARDS (PVT)',
  jazzcashNumber: '03000000000',
  jazzcashTitle: 'EGGS NAVA REWARDS (PVT)',
  depositInstructions: '1. Open your Easypaisa or JazzCash Mobile App.\n2. Transfer the exact PKR amount to the official account shown above.\n3. Copy the 11-digit or 12-digit Transaction ID (TID) from your SMS or app receipt.\n4. Enter the sender mobile number, exact amount, and Transaction ID in this form.\n5. Our automated auditing team verifies transactions and credits your wallet ledger promptly.',
  withdrawalInstructions: '1. Select your preferred withdrawal channel (Easypaisa or JazzCash).\n2. Enter the recipient mobile account number and exact registered account title.\n3. Minimum withdrawal is 500 PKR. Standard 5% platform processing fee applies.\n4. Withdrawal requests are audited and disbursed within working hours.',
  minDeposit: 500,
  maxDeposit: 100000,
  minWithdrawal: 500,
  maxWithdrawal: 50000,
  withdrawalFeePercent: 5,
  depositEnabled: true,
  withdrawalEnabled: true,
  referralCommissionTier1: 5, // 5%
  referralCommissionTier2: 2, // 2%
  referralCommissionTier3: 1, // 1%
  referralEnabled: true,
  disclaimerText: 'DISCLAIMER & COMPLIANCE: EGGS NAVA PRO operates purely as a digital poultry farming simulation and gamified reward entertainment platform. Digital hens, coops, and egg harvest values represent virtual game mechanics. No guaranteed profit, fixed investment returns, doubling of funds, or risk-free earnings are promised or implied. Always participate responsibly within entertainment limits.'
};
