import React, { useState } from 'react';
import BadgeItem, { BadgeData } from './BadgeItem';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Award, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface BadgeCollectionProps {
  badges: BadgeData[];
  title?: string;
  showProgress?: boolean;
  maxVisible?: number;
  showFilters?: boolean;
}

const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  badges,
  title = 'Badges',
  showProgress = false,
  maxVisible = 3,
  showFilters = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Filter badges
  const filteredBadges = badges.filter((badge) => {
    if (filter !== 'all' && badge.category !== filter) return false;
    if (tierFilter !== 'all' && badge.tier !== tierFilter) return false;
    return true;
  });

  // Sort badges: unlocked first, then by tier (diamond to bronze), then by name
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    // Unlocked badges first
    if (a.locked && !b.locked) return 1;
    if (!a.locked && b.locked) return -1;

    // Sort by tier
    const tierOrder = { diamond: 0, platinum: 1, gold: 2, silver: 3, bronze: 4 };
    if (tierOrder[a.tier as keyof typeof tierOrder] !== tierOrder[b.tier as keyof typeof tierOrder]) {
      return tierOrder[a.tier as keyof typeof tierOrder] - tierOrder[b.tier as keyof typeof tierOrder];
    }

    // Sort by name
    return a.name.localeCompare(b.name);
  });

  // Determine how many badges to show
  const visibleBadges = expanded ? sortedBadges : sortedBadges.slice(0, maxVisible);
  const hasMoreBadges = sortedBadges.length > maxVisible;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Award className="h-5 w-5 text-purple-400 mr-2" />
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          {showFilters && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  className="bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 appearance-none pr-8 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="achievement">Achievements</option>
                  <option value="participation">Participation</option>
                  <option value="special">Special</option>
                  <option value="milestone">Milestones</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  className="bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 appearance-none pr-8 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                >
                  <option value="all">All Tiers</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visibleBadges.length === 0 ? (
          <div className="text-center py-6">
            <Award className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No badges found with the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleBadges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} showProgress={showProgress} />
            ))}
          </div>
        )}

        {hasMoreBadges && (
          <div className="mt-4 text-center">
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              rightIcon={expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            >
              {expanded ? 'Show Less' : `Show All (${sortedBadges.length})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgeCollection;
