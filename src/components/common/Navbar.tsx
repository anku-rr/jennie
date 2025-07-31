"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  currentPage?: string;
  showBackToHome?: boolean;
  onSignInClick?: () => void;
  buttonText?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage = "", 
  showBackToHome = false,
  onSignInClick,
  buttonText
}) => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleButtonClick = () => {
    if (onSignInClick) {
      onSignInClick();
    } else {
      handleNavigation('/session');
    }
  };

  const navItems = [
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
    { name: "About", path: "/about" },
    { name: "Try Now", path: "/session" }
  ];

  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (showBackToHome) return "Back to Home";
    return "Start Session";
  };

  return (
    <nav className="flex items-center justify-between p-6 text-white">
      <button 
        onClick={() => handleNavigation('/')}
        className="text-2xl font-bold hover:text-blue-200 transition-colors"
      >
        Jennie
      </button>
      
      <div className="hidden md:flex space-x-8">
        {navItems.map((item) => (
          <a
            key={item.name}
            href={item.path}
            className={`transition-colors ${
              currentPage === item.path 
                ? "text-blue-200 font-semibold" 
                : "hover:text-blue-200"
            }`}
          >
            {item.name}
          </a>
        ))}
      </div>
      
      <button 
        onClick={handleButtonClick}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          showBackToHome 
            ? "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
            : "bg-white text-blue-700 hover:bg-blue-50"
        }`}
      >
        {getButtonText()}
      </button>
    </nav>
  );
};