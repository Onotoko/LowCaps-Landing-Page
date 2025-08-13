'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWeb3 } from '@/hooks/useWeb3';
import { TEAM_MEMBERS, SERVICES } from '@/lib/constants/teammeber';

export default function LandingPage() {
  const {
    isConnected,
    address,
    isLoading,
    error,
    modalVisible,
    connect,
    disconnect,
    showModal,
    hideModal,
    justConnected
  } = useWeb3();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Generate stars for background
  useEffect(() => {
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
      // Clear existing stars
      starsContainer.innerHTML = '';

      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 4 + 's';
        star.style.animationDuration = (3 + Math.random() * 2) + 's';
        starsContainer.appendChild(star);
      }
    }
  }, []);

  // Show notifications based on Web3 state changes
  useEffect(() => {
    if (error) {
      showNotification(error, 'error');
    }
  }, [error]);

  // Handle success notification when wallet connects (only for active connections)
  useEffect(() => {
    if (isConnected && justConnected && !error) {
      showNotification('Wallet connected successfully!', 'success');
    }
  }, [isConnected, justConnected, error]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleWalletConnection = async () => {
    if (isConnected) {
      disconnect();
      showNotification('Wallet disconnected', 'info');
    } else {
      showModal();
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
      // The success notification will be handled by the useEffect above
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Animated Stars Background */}
      <div className="stars-container fixed w-full h-full top-0 left-0 z-0 overflow-hidden"></div>

      {/* Wallet Modal */}
      {modalVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              hideModal();
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '25px',
              width: '90%',
              maxWidth: '420px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Connect your Wallet</h2>
              <button
                onClick={hideModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}
              >
                ✕
              </button>
            </div>

            <div
              onClick={handleConnect}
              style={{
                background: '#f5f5f5',
                border: '2px solid transparent',
                borderRadius: '12px',
                padding: '15px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: '15px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px' }}>
                  <Image
                    src="https://images.sftcdn.net/images/t_app-icon-m/p/4880d747-59d4-4550-9e96-647571541b84/4155430577/starkey-wallet-the-official-wallet-for-supra-logo"
                    alt="StarKey Wallet"
                    width={32}
                    height={32}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <span style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>
                  {isLoading ? 'Connecting...' : 'StarKey'}
                </span>
              </div>
              <span style={{ color: '#d64665', fontSize: '20px' }}>→</span>
            </div>

            <div style={{
              marginTop: '15px',
              paddingTop: '15px',
              borderTop: '1px solid #e0e0e0',
              fontSize: '13px',
              color: '#666',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              By continuing you agree to SupraScan's{' '}
              <Link href="https://supra.com/privacy-policy/" target="_blank" style={{ color: '#d64665', textDecoration: 'none', fontWeight: '500' }}>
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link href="https://supra.com/terms-of-use/" target="_blank" style={{ color: '#d64665', textDecoration: 'none', fontWeight: '500' }}>
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header>
        <nav>
          <div className="logo-container">
            {/* Lowcaps Logo */}
            <Link href="/" className="logo">
              <div className="logo-icon">
                <Image src="/assets/icons/logo.png" alt="Lowcaps.io" width={32} height={32} />
              </div>
              <span>lowcaps.io</span>
            </Link>

            {/* Separator */}
            <div className="separator">×</div>

            {/* SUPRA Logo */}
            <Link href="https://supra.com" target="_blank" className="supra-logo">
              <div className="supra-icon">
                <Image src="/assets/icons/supra.png" alt="SUPRA" width={16} height={16} />
              </div>
              <span className="supra-text">SUPRA</span>
            </Link>
          </div>

          <div className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <li><Link href="#home">Home</Link></li>
            <li><Link href="#team">Team</Link></li>
            <li><Link href="#services">Services</Link></li>
            <li><Link href="/stats">Stats</Link></li>
            <li>
              <button
                onClick={handleWalletConnection}
                disabled={isLoading}
                className={`connect-nav-btn ${isConnected ? 'connected' : ''}`}
              >
                {isConnected ? (
                  <div className="w-4 h-4">
                    <Image
                      src="https://images.sftcdn.net/images/t_app-icon-m/p/4880d747-59d4-4550-9e96-647571541b84/4155430577/starkey-wallet-the-official-wallet-for-supra-logo"
                      alt="StarKey Wallet"
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  </div>
                ) : (
                  <div className="wallet-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z"
                      />
                    </svg>
                  </div>
                )}
                <span>
                  {isLoading
                    ? 'Connecting...'
                    : isConnected
                      ? `${address?.slice(0, 4)}...${address?.slice(-3)}`
                      : 'Connect'
                  }
                </span>
              </button>
            </li>
            <li><Link href="#contact" className="contact-nav-btn">Get Started</Link></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-badge">✨ ELITE BLOCKCHAIN DEVELOPERS</div>
          <h1>Build the Future of <span className="gradient-text">Web3</span></h1>
          <p className="hero-description">
            Five exceptional blockchain developers ready to transform your vision into revolutionary
            decentralized applications. From smart contracts to complete DeFi ecosystems.
          </p>
          <div className="hero-buttons">
            <Link href="#contact" className="btn-primary">Start Your Project</Link>
            <Link href="#services" className="btn-secondary">View Services</Link>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section" id="team">
        <div className="section-header">
          <div className="section-subtitle">Our Team</div>
          <h2 className="section-title">Meet Your <span className="gradient-text">Dream Team</span></h2>
          <p className="section-description">Experienced blockchain developers available for freelance work</p>
        </div>

        <div className="team-container">
          <div className="team-showcase">
            <div className="diamonds" style={{ top: '20px', left: '30px' }}>◆</div>
            <div className="diamonds" style={{ top: '40%', right: '20px', animationDelay: '2s' }}>◆</div>
            <div className="diamonds" style={{ bottom: '30px', left: '50%', animationDelay: '4s' }}>◆</div>

            <div className="team-intro">
              <h3>We are a team of experienced blockchain developers available for freelance work.</h3>
            </div>

            <div className="team-members">
              {TEAM_MEMBERS.map((member, index) => (
                <div key={index} className={`member-card ${isConnected ? 'web3-connected' : ''}`}>
                  <div className="member-avatar">
                    <Image
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      width={140}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                    {isConnected && (
                      <div className="blockchain-verified" style={{ display: 'flex' }}>✓</div>
                    )}
                  </div>
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.role}</div>
                  <div className="team-member-stats">
                    <span className="stat-badge">50+ Projects</span>
                    <span className="stat-badge">4.9⭐ Rating</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section" id="services">
        <div className="section-header">
          <div className="section-subtitle">What We Do</div>
          <h2 className="section-title">Our <span className="gradient-text">Services</span></h2>
        </div>

        <div className="services-grid">
          {SERVICES.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="contact">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start?</h2>
            <p className="cta-text">Let's discuss your blockchain project</p>

            <div className="cta-features">
              <div className="cta-feature">Available for projects of all sizes</div>
              <div className="cta-feature">Competitive rates</div>
              <div className="cta-feature">Fast delivery</div>
            </div>

            <div className="hero-buttons" style={{ marginTop: '40px' }}>
              <Link href="mailto:brett@lowcaps.io" className="btn-primary">Get In Touch</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <p>© 2025 lowcaps.io - Elite Blockchain Development Team</p>
        </div>
      </footer>
    </div>
  );
}