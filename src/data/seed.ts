import { PlatformSettings, Referral, Transaction, User } from '../types';

const HOUR = 1000 * 60 * 60;

export const SITE_NAME = 'Prisma Play';

export const defaultSettings: PlatformSettings = {
  houseMargin: 0.18,
  randomness: 0.45,
  forcedDigit: null,
  minStake: 10,
  usdtAddress: 'TVvMrooDma21L1FcQfFUtFJG1wFCwz9niX',
  pointsPerUsdt: 100,
  minRechargeUsdt: 10,
  maintenance: false
};

export const seedUsers: User[] = [
{
  id: 'u-1001',
  name: 'Demo Player',
  email: 'demo@prismaplay.io',
  emailVerified: true,
  phone: '9876543210',
  password: 'demo1234',
  balance: 1280,
  bonus: 145,
  promoCode: '171116',
  createdAt: Date.now() - HOUR * 240
},
{
  id: 'u-1002',
  name: 'Aarav K.',
  email: 'aarav@prismaplay.io',
  emailVerified: true,
  password: 'aarav1234',
  balance: 640,
  bonus: 20,
  promoCode: '284510',
  invitedBy: '171116',
  createdAt: Date.now() - HOUR * 96
},
{
  id: 'u-1003',
  name: 'Meera S.',
  email: 'meera@prismaplay.io',
  emailVerified: true,
  password: 'meera1234',
  balance: 2110,
  bonus: 310,
  promoCode: '392044',
  invitedBy: '171116',
  createdAt: Date.now() - HOUR * 60
}];


export const seedReferrals: Referral[] = [
{ id: 'r-1', name: 'Aarav K.', level: 1, joinedAt: Date.now() - HOUR * 96, contribution: 86 },
{ id: 'r-2', name: 'Meera S.', level: 1, joinedAt: Date.now() - HOUR * 60, contribution: 142 },
{ id: 'r-3', name: 'Rohit D.', level: 1, joinedAt: Date.now() - HOUR * 30, contribution: 41 },
{ id: 'r-4', name: 'Naomi P.', level: 2, joinedAt: Date.now() - HOUR * 22, contribution: 18 },
{ id: 'r-5', name: 'Kabir J.', level: 2, joinedAt: Date.now() - HOUR * 9, contribution: 27 }];


export const seedTransactions: Transaction[] = [
{
  id: 'tx-9001',
  userId: 'u-1001',
  userName: 'Demo Player',
  type: 'recharge',
  amount: 500,
  status: 'completed',
  method: '50 USDT (TRC20)',
  reference: '0x8fa3c47b19de5510cbb42f7a91d21c',
  createdAt: Date.now() - HOUR * 26
},
{
  id: 'tx-9002',
  userId: 'u-1001',
  userName: 'Demo Player',
  type: 'withdrawal',
  amount: 200,
  status: 'pending',
  method: 'USDT (TRC20) TVvMro…9niX',
  createdAt: Date.now() - HOUR * 4
},
{
  id: 'tx-9003',
  userId: 'u-1002',
  userName: 'Aarav K.',
  type: 'recharge',
  amount: 120,
  status: 'pending',
  method: '12 USDT (TRC20)',
  reference: '0x71bb90ac4413e0f2ba7761d54a09',
  createdAt: Date.now() - HOUR * 2
},
{
  id: 'tx-9004',
  userId: 'u-1003',
  userName: 'Meera S.',
  type: 'withdrawal',
  amount: 900,
  status: 'pending',
  method: 'USDT (TRC20) TQm4Ls…7bH2',
  createdAt: Date.now() - HOUR * 1
},
{
  id: 'tx-9005',
  userId: 'u-1003',
  userName: 'Meera S.',
  type: 'commission',
  amount: 64,
  status: 'completed',
  method: 'Referral level 1',
  createdAt: Date.now() - HOUR * 12
}];


export const adminCredentials = {
  username: 'admin',
  password: 'admin1234'
};