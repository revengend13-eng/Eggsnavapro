export type UserRole = 'USER' | 'ADMIN' | 'OWNER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminPermissions {
  canApproveDeposits: boolean;
  canProcessWithdrawals: boolean;
  canManageUsers: boolean;
  canViewTransactions: boolean;
  canViewReferrals: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  referralCode: string;
  referredBy?: string;
  adminPermissions?: AdminPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  availableEggs: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalEggRewards: number;
  totalReferralRewards: number;
  updatedAt: string;
}

export interface HenPlan {
  id: string;
  planNumber: number;
  name: string;
  henQuantity: number;
  price: number;
  cycleDays: number;
  dailyEggs: number;
  eggValuePkr: number;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  henType: string;
  description: string;
  terms: string;
  henColor: string;
  eggColor: string;
  henImage?: string;
  eggImage?: string;
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserPlanStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export interface UserPlan {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  planId: string;
  planName: string;
  purchasePrice: number;
  cycleDays: number;
  dailyEggs: number;
  eggValuePkr: number;
  eggsCollectedTotal: number;
  lastCollectedAt: string;
  startDate: string;
  endDate: string;
  status: UserPlanStatus;
  henType: string;
  henColor: string;
  eggColor: string;
  henImage?: string;
  eggImage?: string;
  henQuantity?: number;
  depositId?: string;
  createdAt?: string;
  activatedAt?: string;
  deactivatedAt?: string;
  updatedAt?: string;
}

export type TransactionType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'PLAN_PURCHASE' 
  | 'REWARD' 
  | 'REFERRAL_REWARD' 
  | 'ADJUSTMENT' 
  | 'REFUND' 
  | 'EGG_SALE';

export type TransactionDirection = 'CREDIT' | 'DEBIT';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  direction: TransactionDirection;
  status: TransactionStatus;
  referenceId: string;
  description: string;
  adminNote?: string;
  createdAt: string;
}

export type PaymentMethod = 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER';
export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  method: PaymentMethod;
  senderAccount: string;
  transactionId: string;
  proofUrl?: string;
  notes?: string;
  status: DepositStatus;
  approvedBy?: string;
  rejectionReason?: string;
  planId?: string;
  planName?: string;
  userPlanId?: string;
  createdAt: string;
  reviewedAt?: string;
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: PaymentMethod;
  accountNumber: string;
  accountTitle: string;
  status: WithdrawalStatus;
  adminNote?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeEmail: string;
  refereeUsername: string;
  level: number;
  totalCommissionEarned: number;
  status: 'ACTIVE';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  id: string;
  appName: string;
  websiteName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail: string;
  whatsappNumber: string;
  currency: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  userWithdrawalEnabled: boolean;
  easypaisaNumber: string;
  easypaisaTitle: string;
  jazzcashNumber: string;
  jazzcashTitle: string;
  depositInstructions: string;
  withdrawalInstructions: string;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFeePercent: number;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  referralCommissionTier1: number;
  referralCommissionTier2: number;
  referralCommissionTier3: number;
  referralEnabled: boolean;
  disclaimerText: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}
