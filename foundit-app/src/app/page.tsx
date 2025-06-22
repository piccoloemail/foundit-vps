'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import UserDropdown from '@/components/UserDropdown';
import AuthModal from '@/components/AuthModal';
import NewMemoryModal from '@/components/NewMemoryModal';
import EditMemoryModal from '@/components/EditMemoryModal';
import MemoryList from '@/components/MemoryList';
import SearchFilters from '@/components/SearchFilters';
import { useAuth } from '@/hooks/useAuth';
import { useMemories } from '@/hooks/useMemories';
import { useSearch } from '@/hooks/useSearch';
import { Memory } from '@/lib/supabase';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewMemoryModal, setShowNewMemoryModal] = useState(false);
  const [showEditMemoryModal, setShowEditMemoryModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  
  // View and pagination state
  const [isListView, setIsListView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 items per page
  const { user, loading } = useAuth();
  const { memories, loading: memoriesLoading } = useMemories();
  
  // Search and filtering
  const {
    filters,
    filteredMemories,
    searchContexts,
    updateFilter,
    clearFilters,
    executeSearch,
    isSearching,
    lastSearchMode,
    availableTypes,
    availableCategories,
    availableTags,
    hasActiveFilters,
    resultsCount,
    totalCount,
  } = useSearch(memories);

  // Theme toggle handler for UserDropdown
  const handleThemeToggle = () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
  };

  const handleEditMemory = (memory: Memory) => {
    setEditingMemory(memory);
    setShowEditMemoryModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditMemoryModal(false);
    setEditingMemory(null);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredMemories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMemories = filteredMemories.slice(startIndex, endIndex);

  // Reset to page 1 when search results change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredMemories.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="empty-icon">🧠</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">🧠</div>
            <div>
              <div className="logo-title">FoundIt.at</div>
              <div className="logo-subtitle">Universal Memory System</div>
            </div>
          </div>
        </div>
        <div className="header-right">
          <ThemeToggle />
          {user ? (
            <UserDropdown onThemeToggle={handleThemeToggle} />
          ) : (
            <button className="icon-button" onClick={() => setShowAuthModal(true)} title="Sign In">
              🔐
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {user && (
          <>
            <div className="content-header">
              <h1>Save → Search → Find</h1>
              <p className="content-subtitle">Organize and find all your information intelligently</p>
              <button 
                className="new-memory-button"
                onClick={() => setShowNewMemoryModal(true)}
                style={{ 
                  marginTop: '1.5rem',
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                  position: 'relative',
                  zIndex: 2
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                }}
              >
                ✨ Create New Memory
              </button>
            </div>

            {/* Search and Filters */}
            <SearchFilters
              filters={filters}
              onUpdateFilter={updateFilter}
              onClearFilters={clearFilters}
              onExecuteSearch={executeSearch}
              isSearching={isSearching}
              availableTypes={availableTypes}
              availableCategories={availableCategories.filter((cat): cat is string => Boolean(cat))}
              availableTags={availableTags}
              hasActiveFilters={!!hasActiveFilters}
            />

            {/* Search Results Summary with View Toggle */}
            {totalCount > 0 && (
              <div className="search-results-summary">
                <div className="results-info">
                  <span>
                    Showing <span className="results-count">{startIndex + 1}-{Math.min(endIndex, resultsCount)}</span> of <span className="results-count">{resultsCount}</span> memories
                  </span>
                  {lastSearchMode && filters.query && (
                    <span className="search-mode-indicator">
                      {lastSearchMode === 'semantic' ? '🧠 AI Search' : '⚡ Literal Search'}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {/* Spacer for left side */}
                  <div style={{ flex: 1 }}></div>
                  
                  {/* Top Pagination - Centered */}
                  {totalPages > 1 && (
                    <div className="pagination pagination-top">
                      <button 
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="pagination-button pagination-button-small"
                      >
                        ⏮ First
                      </button>
                      
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-button pagination-button-small"
                      >
                        ← Prev
                      </button>
                      
                      <div className="pagination-info pagination-info-small">
                        {currentPage} of {totalPages}
                      </div>
                      
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="pagination-button pagination-button-small"
                      >
                        Next →
                      </button>
                      
                      <button 
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="pagination-button pagination-button-small"
                      >
                        Last ⏭
                      </button>
                    </div>
                  )}

                  {/* Right side controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
                    {/* Modern View Toggle */}
                    <div className="view-toggle-container">
                      <span className="view-toggle-label">View:</span>
                      <div className="view-toggle-buttons">
                        <button
                          className={`view-toggle-button ${!isListView ? 'active' : ''}`}
                          onClick={() => setIsListView(false)}
                          title="Grid View"
                        >
                          <span className="view-toggle-icon">⊞</span>
                        </button>
                        <button
                          className={`view-toggle-button ${isListView ? 'active' : ''}`}
                          onClick={() => setIsListView(true)}
                          title="List View"
                        >
                          <span className="view-toggle-icon">☰</span>
                        </button>
                      </div>
                    </div>
                    
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="clear-filters-button">
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Memory List or Welcome State */}
        {user ? (
          <>
            <MemoryList 
              memories={currentMemories} 
              loading={memoriesLoading} 
              onEditMemory={handleEditMemory}
              isSearchResult={!!hasActiveFilters || !!filters.query}
              searchQuery={filters.query}
              searchContexts={searchContexts}
              isListView={isListView}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  ⏮ First
                </button>
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  ← Previous
                </button>
                
                <div className="pagination-info">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next →
                </button>
                
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Last ⏭
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
              <div className="hero-content">
                <div className="hero-badge">
                  <span className="badge-icon">🧠</span>
                  <span className="badge-text">Your Digital Memory System</span>
                </div>
                
                <h1 className="hero-title">
                  Never lose a great
                  <span className="hero-highlight"> discovery </span>
                  again
                </h1>
                
                <p className="hero-subtitle">
                  Save, organize, and instantly find anything you discover on the web. 
                  From YouTube tutorials to important documents - all in one intelligent system.
                </p>
                
                <div className="hero-actions">
                  <button 
                    className="cta-primary"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Start Organizing Free
                    <span className="cta-arrow">→</span>
                  </button>
                  <button className="cta-secondary">
                    <span className="demo-icon">▶️</span>
                    Watch Demo
                  </button>
                </div>
                
                <div className="hero-stats">
                  <div className="stat-item">
                    <span className="stat-number">10K+</span>
                    <span className="stat-label">Memories Saved</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">500+</span>
                    <span className="stat-label">Hours of Content</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">100%</span>
                    <span className="stat-label">Free to Start</span>
                  </div>
                </div>
              </div>
              
              <div className="hero-visual">
                <div className="app-mockup">
                  <div className="mockup-header">
                    <div className="mockup-dots">
                      <span></span><span></span><span></span>
                    </div>
                    <span className="mockup-title">FoundIt.at</span>
                  </div>
                  <div className="mockup-content">
                    <div className="mockup-search">
                      <span className="search-icon">🔍</span>
                      <span className="search-text">Find that React tutorial...</span>
                    </div>
                    <div className="mockup-results">
                      <div className="result-item">
                        <span className="result-icon">📺</span>
                        <div className="result-content">
                          <div className="result-title">React Hooks Tutorial</div>
                          <div className="result-meta">🧠 AI Summary • 15 tools mentioned</div>
                        </div>
                      </div>
                      <div className="result-item">
                        <span className="result-icon">📄</span>
                        <div className="result-content">
                          <div className="result-title">React Documentation</div>
                          <div className="result-meta">Official docs • Components guide</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
              <div className="section-header">
                <h2 className="section-title">Everything you need to stay organized</h2>
                <p className="section-subtitle">
                  Powerful features designed to make your digital life effortless
                </p>
              </div>
              
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📺</div>
                  <h3 className="feature-title">Smart YouTube Integration</h3>
                  <p className="feature-description">
                    Automatically extract transcripts, generate AI summaries, and identify tools & concepts mentioned in videos.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">Auto Transcripts</span>
                    <span className="feature-tag">AI Summaries</span>
                  </div>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">🧠</div>
                  <h3 className="feature-title">AI-Powered Search</h3>
                  <p className="feature-description">
                    Find anything using natural language. Search by meaning, not just keywords. "Find videos about React hooks" actually works.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">Semantic Search</span>
                    <span className="feature-tag">Smart Results</span>
                  </div>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">📁</div>
                  <h3 className="feature-title">Universal File Storage</h3>
                  <p className="feature-description">
                    Drag & drop anything - documents, images, videos. Paste screenshots directly. Everything organized automatically.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">Drag & Drop</span>
                    <span className="feature-tag">Auto Organize</span>
                  </div>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">🏷️</div>
                  <h3 className="feature-title">Smart Categorization</h3>
                  <p className="feature-description">
                    Intelligent filtering separates videos from documents. Tags and categories help you find exactly what you need.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">Auto Tags</span>
                    <span className="feature-tag">Smart Filters</span>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section">
              <div className="section-header">
                <h2 className="section-title">How it works</h2>
                <p className="section-subtitle">Three simple steps to organize your digital life</p>
              </div>
              
              <div className="steps-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3 className="step-title">Save Anything</h3>
                    <p className="step-description">
                      Paste URLs, drag files, or save screenshots. Works with YouTube, websites, documents, and more.
                    </p>
                  </div>
                  <div className="step-visual">
                    <div className="visual-icon">📥</div>
                  </div>
                </div>
                
                <div className="step-connector"></div>
                
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3 className="step-title">AI Organizes</h3>
                    <p className="step-description">
                      Our AI automatically categorizes, tags, and extracts key information from your content.
                    </p>
                  </div>
                  <div className="step-visual">
                    <div className="visual-icon">🤖</div>
                  </div>
                </div>
                
                <div className="step-connector"></div>
                
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3 className="step-title">Find Instantly</h3>
                    <p className="step-description">
                      Search using natural language. Find that tutorial, document, or idea you saved months ago.
                    </p>
                  </div>
                  <div className="step-visual">
                    <div className="visual-icon">⚡</div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
              <div className="cta-content">
                <h2 className="cta-title">Ready to organize your digital life?</h2>
                <p className="cta-subtitle">
                  Join thousands of users who never lose important information again.
                </p>
                <button 
                  className="cta-primary large"
                  onClick={() => setShowAuthModal(true)}
                >
                  Start Your Free Account
                  <span className="cta-arrow">→</span>
                </button>
                <p className="cta-note">No credit card required • Free forever plan</p>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      <NewMemoryModal 
        isOpen={showNewMemoryModal} 
        onClose={() => setShowNewMemoryModal(false)} 
      />
      
      <EditMemoryModal 
        isOpen={showEditMemoryModal} 
        onClose={handleCloseEditModal}
        memory={editingMemory}
      />
    </div>
  );
}