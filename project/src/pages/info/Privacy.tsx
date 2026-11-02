import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { SectionCard } from '@/components/UI';

export default function Privacy() {
  return (
    <AppLayout>
      <PageHeader title="Privacy Policy" backPath="/home" />
      <div className="px-4 py-4">
        <SectionCard title="Information We Collect">
          <p className="text-sm text-[#9babc6] leading-relaxed">
            Carziqo collects information you provide during registration, including your email address,
            phone number, and referral code. We also collect transaction data related to your wallet,
            vehicle rentals, and earnings.
          </p>
        </SectionCard>

        <SectionCard title="How We Use Your Information">
          <ul className="text-sm text-[#9babc6] space-y-2 list-disc pl-4">
            <li>To create and manage your account</li>
            <li>To process wallet recharges and withdrawals</li>
            <li>To track your vehicle rentals and daily earnings</li>
            <li>To manage the referral and team program</li>
            <li>To send notifications about your account activity</li>
            <li>To provide customer support</li>
          </ul>
        </SectionCard>

        <SectionCard title="Data Security">
          <p className="text-sm text-[#9babc6] leading-relaxed">
            We use industry-standard encryption and security measures to protect your data. Your withdrawal
            password is encrypted and never shared. All transactions are secured through our payment partners.
          </p>
        </SectionCard>

        <SectionCard title="Data Retention">
          <p className="text-sm text-[#9babc6] leading-relaxed">
            We retain your account data for as long as your account is active. You may request deletion of
            your account and associated data at any time by contacting customer service.
          </p>
        </SectionCard>

        <SectionCard title="Your Rights">
          <ul className="text-sm text-[#9babc6] space-y-2 list-disc pl-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request data deletion</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent for data processing</li>
          </ul>
        </SectionCard>

        <div className="card text-center text-xs text-[#9babc6] mt-4">
          <p>Last updated: January 2026</p>
          <p>Carziqo Technologies © 2026</p>
        </div>
      </div>
    </AppLayout>
  );
}
