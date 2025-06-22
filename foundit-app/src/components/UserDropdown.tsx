'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface UserDropdownProps {
  onThemeToggle?: () => void;
}

export default function UserDropdown({ onThemeToggle }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setShowLogoutConfirm(false);
    setIsOpen(false);
    await signOut();
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  if (!user) return null;

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      {/* User Button */}
      <button 
        className="icon-button user-button" 
        onClick={() => setIsOpen(!isOpen)}
        title="User menu"
      >
        👤
        <span className={`dropdown-indicator ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="user-info">
              <span className="user-icon">👤</span>
              <div className="user-details">
                <span className="user-email">{user.email}</span>
                <span className="user-role">Free Plan</span>
              </div>
            </div>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-items">
            <button className="dropdown-item" onClick={() => setIsOpen(false)}>
              <span className="item-icon">⚙️</span>
              <span className="item-text">Settings</span>
              <span className="item-badge">Soon</span>
            </button>
            
            <button className="dropdown-item" onClick={() => setIsOpen(false)}>
              <span className="item-icon">📊</span>
              <span className="item-text">Stats</span>
              <span className="item-badge">Soon</span>
            </button>
            
            {onThemeToggle && (
              <button className="dropdown-item" onClick={() => {
                onThemeToggle();
                setIsOpen(false);
              }}>
                <span className="item-icon">🎨</span>
                <span className="item-text">Toggle Theme</span>
              </button>
            )}
            
            <button className="dropdown-item" onClick={() => setIsOpen(false)}>
              <span className="item-icon">ℹ️</span>
              <span className="item-text">About</span>
              <span className="item-badge">Soon</span>
            </button>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-items">
            <button className="dropdown-item logout-item" onClick={handleLogoutClick}>
              <span className="item-icon">🚪</span>
              <span className="item-text">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal-header">
              <h3>Confirm Sign Out</h3>
            </div>
            <div className="logout-modal-content">
              <p>Are you sure you want to sign out?</p>
            </div>
            <div className="logout-modal-actions">
              <button className="cancel-button" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="confirm-button" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}