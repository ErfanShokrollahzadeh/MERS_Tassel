'use client';

import { useState, useEffect } from 'react';
import { recordVisit } from '@/lib/api';

export default function VisitorStats() {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Record visit when component mounts (once per session ideally, but we'll just fire it here)
    const initAnalytics = async () => {
      try {
        const data = await recordVisit(window.location.pathname);
        if (mounted && data) {
          setStats(data);
          
          // Small delay before showing to allow animation to trigger nicely
          setTimeout(() => {
            if (mounted) setIsVisible(true);
          }, 300);
        }
      } catch (err) {
        console.error("Analytics error:", err);
      }
    };

    initAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  if (!stats) return null;

  return (
    <div className={`visitor-stats-container mt-5 mb-5 ${isVisible ? 'visible' : ''}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="stats-glass-card text-center p-4 p-md-5">
              <h3 className="mb-4 text-gradient">Trusted by Accessories Lovers</h3>
              <p className="text-muted mb-5">Join thousands of customers who love our handcrafted pieces.</p>
              
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="stat-item">
                    <div className="stat-icon pulse-animation mb-3">🛍️</div>
                    <h2 className="stat-number mb-1">{stats.display_daily.toLocaleString()}</h2>
                    <p className="stat-label mb-0">Visits Today</p>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="stat-item highlight">
                    <div className="stat-icon float-animation mb-3">🌟</div>
                    <h2 className="stat-number mb-1 text-primary">{stats.display_monthly.toLocaleString()}</h2>
                    <p className="stat-label mb-0">Monthly Visitors</p>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="stat-item">
                    <div className="stat-icon mb-3">💖</div>
                    <h2 className="stat-number mb-1">{stats.display_total.toLocaleString()}</h2>
                    <p className="stat-label mb-0">Total Pageviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .visitor-stats-container {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .visitor-stats-container.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .stats-glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          box-shadow: 0 15px 35px rgba(183, 110, 121, 0.1);
        }
        
        .stat-item {
          padding: 1.5rem;
          border-radius: 16px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: rgba(255, 255, 255, 0.5);
        }
        
        .stat-item:hover {
          transform: translateY(-5px);
          background: #fff;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        
        .stat-item.highlight {
          background: rgba(248, 232, 238, 0.7);
          border: 1px solid rgba(183, 110, 121, 0.2);
        }
        
        .stat-item.highlight:hover {
          background: #f8e8ee;
        }
        
        .stat-icon {
          font-size: 2.5rem;
          display: inline-block;
        }
        
        .stat-number {
          font-family: var(--font-playfair);
          font-weight: 700;
          color: var(--color-plum);
          font-size: 2.5rem;
        }
        
        .text-primary {
          color: var(--color-rose) !important;
        }
        
        .stat-label {
          font-weight: 500;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.85rem;
        }
        
        .text-gradient {
          background: linear-gradient(135deg, var(--color-plum), var(--color-rose));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
