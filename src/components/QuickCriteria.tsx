'use client';

import { useState } from 'react';
import { CRITERIA_CATEGORIES } from '@/data/criteria';

interface QuickCriteriaProps {
  commend: string[];
  recommend: string[];
  challenge: string[];
  onCommendChange: (items: string[]) => void;
  onRecommendChange: (items: string[]) => void;
  onChallengeChange: (items: string[]) => void;
}

export default function QuickCriteria({
  commend,
  recommend,
  challenge,
  onCommendChange,
  onRecommendChange,
  onChallengeChange,
}: QuickCriteriaProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    Object.keys(CRITERIA_CATEGORIES)[0]
  );

  const allSelected = [...commend, ...recommend, ...challenge];
  
  // We keep all items visible in the list now, but mark them as selected
  // This allows users to easily toggle them off from the list itself without finding them in the summary
  const availableCriteria = Object.entries(CRITERIA_CATEGORIES).map(([category, items]) => ({
    category,
    items,
  }));

  const handleToggle = (item: string, target: 'commend' | 'recommend' | 'challenge') => {
    // Check if currently selected in the target list
    const isCurrentlySelected = 
      (target === 'commend' && commend.includes(item)) ||
      (target === 'recommend' && recommend.includes(item)) ||
      (target === 'challenge' && challenge.includes(item));

    // Remove from all lists first (clean slate or toggle off)
    if (commend.includes(item)) onCommendChange(commend.filter((i) => i !== item));
    if (recommend.includes(item)) onRecommendChange(recommend.filter((i) => i !== item));
    if (challenge.includes(item)) onChallengeChange(challenge.filter((i) => i !== item));

    // If it wasn't selected in the target list, add it (toggle on)
    // But if it was already selected in THIS target list, we just removed it above (toggle off behavior)
    if (!isCurrentlySelected) {
      if (target === 'commend') onCommendChange([...commend.filter((i) => i !== item), item]);
      if (target === 'recommend') onRecommendChange([...recommend.filter((i) => i !== item), item]);
      if (target === 'challenge') onChallengeChange([...challenge.filter((i) => i !== item), item]);
    }
  };

  const getSelectionState = (item: string) => {
    if (commend.includes(item)) return 'commend';
    if (recommend.includes(item)) return 'recommend';
    if (challenge.includes(item)) return 'challenge';
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-lg text-gray-800">Evaluation Criteria</h3>
          <p className="text-sm text-gray-500 mt-1">Select items to categorize your feedback</p>
        </div>

        <div className="divide-y divide-gray-100">
          {availableCriteria.map(({ category, items }) => (
            <div key={category} className="bg-white">
              <button
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                className="w-full px-4 py-5 flex justify-between items-center hover:bg-gray-50 transition text-left active:bg-gray-100"
              >
                <span className="font-semibold text-gray-800 text-lg">{category}</span>
                <span className={`text-2xl text-gray-400 transition-transform ${expandedCategory === category ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {expandedCategory === category && (
                <div className="px-4 pb-6 space-y-6 bg-gray-50/50">
                  {items.map((item) => {
                    const status = getSelectionState(item);
                    return (
                      <div key={item} className="bg-white p-4 rounded-xl border shadow-sm">
                        <p className="text-gray-800 font-medium text-lg mb-3">{item}</p>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(item, 'commend')}
                            className={`py-3 px-2 rounded-lg text-sm font-bold transition-all border-2 ${
                              status === 'commend'
                                ? 'bg-green-100 border-green-500 text-green-800 shadow-inner'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                            }`}
                          >
                            {status === 'commend' ? '✓ Commend' : 'Commend'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleToggle(item, 'recommend')}
                            className={`py-3 px-2 rounded-lg text-sm font-bold transition-all border-2 ${
                              status === 'recommend'
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-800 shadow-inner'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-yellow-300'
                            }`}
                          >
                            {status === 'recommend' ? '✓ Rec...' : 'Recommend'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleToggle(item, 'challenge')}
                            className={`py-3 px-2 rounded-lg text-sm font-bold transition-all border-2 ${
                              status === 'challenge'
                                ? 'bg-blue-100 border-blue-500 text-blue-800 shadow-inner'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                          >
                            {status === 'challenge' ? '✓ Chall...' : 'Challenge'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section (Read-only view of what's selected) */}
      {(commend.length > 0 || recommend.length > 0 || challenge.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
          <h3 className="font-bold text-gray-800">Summary</h3>
          
          {commend.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Commendations</span>
              <div className="flex flex-wrap gap-2">
                {commend.map(item => (
                  <span key={item} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {recommend.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-yellow-600 uppercase tracking-wide">Recommendations</span>
              <div className="flex flex-wrap gap-2">
                {recommend.map(item => (
                  <span key={item} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {challenge.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Challenges</span>
              <div className="flex flex-wrap gap-2">
                {challenge.map(item => (
                  <span key={item} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
