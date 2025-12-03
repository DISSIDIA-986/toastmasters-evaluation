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
  const availableCriteria = Object.entries(CRITERIA_CATEGORIES).map(([category, items]) => ({
    category,
    items: items.filter((item) => !allSelected.includes(item)),
  }));

  const handleAddTo = (item: string, target: 'commend' | 'recommend' | 'challenge') => {
    // Remove from other lists first
    if (commend.includes(item)) onCommendChange(commend.filter((i) => i !== item));
    if (recommend.includes(item)) onRecommendChange(recommend.filter((i) => i !== item));
    if (challenge.includes(item)) onChallengeChange(challenge.filter((i) => i !== item));

    // Add to target
    if (target === 'commend') onCommendChange([...commend.filter((i) => i !== item), item]);
    if (target === 'recommend') onRecommendChange([...recommend.filter((i) => i !== item), item]);
    if (target === 'challenge') onChallengeChange([...challenge.filter((i) => i !== item), item]);
  };

  const handleRemove = (item: string) => {
    onCommendChange(commend.filter((i) => i !== item));
    onRecommendChange(recommend.filter((i) => i !== item));
    onChallengeChange(challenge.filter((i) => i !== item));
  };

  return (
    <div className="space-y-4">
      {/* Criteria Pool */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-800">Available Criteria</h3>
          <p className="text-xs text-gray-500">Tap buttons to add to Commend / Recommend / Challenge</p>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {availableCriteria.map(({ category, items }) => (
            <div key={category} className="border-b last:border-b-0">
              <button
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition text-left"
              >
                <span className="font-medium text-gray-700 text-sm">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{items.length} left</span>
                  <span className="text-gray-400">{expandedCategory === category ? '−' : '+'}</span>
                </div>
              </button>

              {expandedCategory === category && items.length > 0 && (
                <div className="px-3 pb-3 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span className="text-gray-700 flex-1 mr-2">{item}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddTo(item, 'commend')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                        >
                          C
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddTo(item, 'recommend')}
                          className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition"
                        >
                          R
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddTo(item, 'challenge')}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                        >
                          Ch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expandedCategory === category && items.length === 0 && (
                <p className="px-4 pb-3 text-xs text-gray-400 italic">All items assigned</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Commend Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-3 bg-green-500 text-white">
          <h3 className="font-semibold">✅ Commend - What you did well</h3>
        </div>
        <div className="p-3">
          {commend.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No items selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {commend.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="hover:text-green-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommend Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-3 bg-yellow-500 text-white">
          <h3 className="font-semibold">💡 Recommend - What you can improve</h3>
        </div>
        <div className="p-3">
          {recommend.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No items selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recommend.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="hover:text-yellow-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Challenge Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-3 bg-blue-500 text-white">
          <h3 className="font-semibold">🎯 Challenge - What I challenge you to try</h3>
        </div>
        <div className="p-3">
          {challenge.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No items selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {challenge.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="hover:text-blue-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
