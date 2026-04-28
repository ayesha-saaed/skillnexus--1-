import React from 'react';

export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Connector Nodes (Teal) */}
      <circle cx="50" cy="20" r="8" fill="#2DD4BF" />
      <circle cx="30" cy="35" r="8" fill="#2DD4BF" />
      <circle cx="70" cy="35" r="8" fill="#2DD4BF" />
      <path d="M50 20L30 35" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round"/>
      <path d="M50 20L70 35" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round"/>
      
      {/* Bridge (Blue) */}
      <path 
        d="M20 60C20 40 80 40 80 60H85V65H15V60H20Z" 
        fill="#3b82f6" 
      />
      <rect x="40" y="50" width="4" height="20" fill="#3b82f6" />
      <rect x="56" y="50" width="4" height="20" fill="#3b82f6" />
      <path d="M15 65V75" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"/>
      <path d="M35 65V85" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round"/>
      <path d="M65 65V85" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round"/>
      <path d="M85 65V75" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}
