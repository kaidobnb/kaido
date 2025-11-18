import React from 'react';
import ReferralRewards from '../../components/profile/ReferralRewards';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

const ReferralRewardsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRewardsUpdated = () => {
    // Refresh the page or update any parent components if needed
    console.log('Rewards updated');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="tertiary"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/referrals')}
          className="mr-4"
        >
          Back to Referrals
        </Button>
        <h1 className="text-3xl font-bold text-white">Referral Rewards</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <ReferralRewards onRewardsUpdated={handleRewardsUpdated} />
      </div>
    </div>
  );
};

export default ReferralRewardsPage;
