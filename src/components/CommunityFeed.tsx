import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/firebase';

export const CommunityFeed: React.FC = () => {
  const { user, login } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Join the Community</h2>
        <p className="text-gray-500 mb-8 max-w-md">Discover, remix, and share tracks. Sign in to access the community feed.</p>
        <button onClick={login} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-colors">
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Community Feed</h2>
          <p className="text-gray-500 mt-2">Discover what others are creating on Lunara</p>
        </div>
        <div className="flex gap-4">
          <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100">
            <option>Trending</option>
            <option>Recent</option>
            <option>Top Rated</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-12 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Community feeds coming soon!</h3>
        <p className="text-gray-500 max-w-sm mx-auto">We are actively building the community feature. Soon you'll be able to publish and remix your tracks.</p>
      </div>
    </div>
  );
};
