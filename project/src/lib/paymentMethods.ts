import { Coins, Landmark, Smartphone, type LucideIcon } from 'lucide-react';

export interface PaymentMethod {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  network: string;
  qrImage: string;
  address?: string;
  note: string;
}

const MOBILE_QR = '/assets/images/payment/bank-payment.jpg';
const CRYPTO_QR = '/assets/images/payment/usdt-payment_copy.jpg';
const TRC20_QR = '/assets/images/payment/126868.jpg';
const EVM_ADDRESS = '0x4f04b73A3284d6923A5A5A90b93406Ae3CEd9A3A';

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'gcash',
    label: 'GCash',
    icon: Smartphone,
    color: '#2979ff',
    network: 'GCash Mobile',
    qrImage: MOBILE_QR,
    address: 'CARZIQO',
    note: 'Scan the QR code or send to this GCash number',
  },
  {
    id: 'paymaya',
    label: 'PayMaya',
    icon: Smartphone,
    color: '#16a35a',
    network: 'PayMaya Mobile',
    qrImage: MOBILE_QR,
    address: 'CARZIQO',
    note: 'Scan the QR code or send to this PayMaya number',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    icon: Landmark,
    color: '#0f7142',
    network: 'Local Bank Transfer',
    qrImage: MOBILE_QR,
    note: 'Scan the QR code to pay by bank transfer',
  },
  {
    id: 'usdt_trc20',
    label: 'USDT TRC20',
    icon: Coins,
    color: '#ef9100',
    network: 'Tron Network (TRC20)',
    qrImage: TRC20_QR,
    address: 'TMSayBDiUSdKLcAXmvH26et2CFTQkEjkEd',
    note: 'USDT on TRC20 only',
  },
  {
    id: 'usdt_bep20',
    label: 'USDT BEP20',
    icon: Coins,
    color: '#f0b90b',
    network: 'BSC Network (BEP20)',
    qrImage: CRYPTO_QR,
    address: EVM_ADDRESS,
    note: 'USDT on BEP20 only',
  },
  {
    id: 'usdt_erc20',
    label: 'USDT ERC20',
    icon: Coins,
    color: '#26a17b',
    network: 'Ethereum Network (ERC20)',
    qrImage: CRYPTO_QR,
    address: EVM_ADDRESS,
    note: 'USDT on ERC20 only',
  },
  {
    id: 'eth_bep20',
    label: 'ETH BEP20',
    icon: Coins,
    color: '#627eea',
    network: 'BSC Network (BEP20)',
    qrImage: CRYPTO_QR,
    address: EVM_ADDRESS,
    note: 'Ethereum on BEP20',
  },
  {
    id: 'worldcoin',
    label: 'WorldCoin WLD',
    icon: Coins,
    color: '#323643',
    network: 'World Chain',
    qrImage: CRYPTO_QR,
    address: EVM_ADDRESS,
    note: 'WLD token',
  },
  {
    id: 'bnb',
    label: 'BNB',
    icon: Coins,
    color: '#f0b90b',
    network: 'BSC Network (BEP20)',
    qrImage: CRYPTO_QR,
    address: EVM_ADDRESS,
    note: 'BNB on BEP20',
  },
  {
    id: 'opbnb',
    label: 'opBNB',
    icon: Coins,
    color: '#0ea5a4',
    network: 'opBNB Network',
    qrImage: CRYPTO_QR,
    address: EVM_ADDRESS,
    note: 'opBNB token',
  },
];
