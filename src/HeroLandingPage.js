import React, { useState, useEffect } from 'react';
import './HeroLandingPage.css'; // Import isolated styles
import { 
  Camera, Calendar, Clock, Shield, Users, Monitor, BookOpen, 
  Laptop, ChevronRight, Star, CheckCircle, Play, ArrowRight,
  MapPin, Zap, Heart, Award, Smartphone, Lock, Eye, MousePointerClick,
  GraduationCap
} from 'lucide-react';

const HeroLandingPage = ({ onGetStarted, onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate feature showcase
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const features = [
    {
      icon: <Calendar className="hero-icon" />,
      title: "Smart Booking",
      description: "Reserve study rooms, labs, and equipment in seconds with our intelligent scheduling system.",
      image: "/api/placeholder/600/400",
      stats: "5,000+ bookings monthly"
    },
    {
      icon: <Shield className="hero-icon" />,
      title: "Secure Access",
      description: "Skip the cards and passwords. Your face is your key to all university resources.",
      image: "/api/placeholder/600/400", 
      stats: "99.9% uptime"
    },
    {
      icon: <Zap className="hero-icon" />,
      title: "Instant Check-in",
      description: "Walk up and get recognized instantly. No queues, no hassle, just seamless access.",
      image: "/api/placeholder/600/400",
      stats: "< 5 seconds recognition"
    }
  ];

  const resources = [
    { icon: <Monitor className="hero-icon-sm" />, name: "Study Rooms", count: "25+ spaces", color: "hero-blue" },
    { icon: <Laptop className="hero-icon-sm" />, name: "Computer Labs", count: "200+ stations", color: "hero-purple" },
    { icon: <BookOpen className="hero-icon-sm" />, name: "Library Resources", count: "Unlimited access", color: "hero-green" },
    { icon: <Users className="hero-icon-sm" />, name: "Meeting Spaces", count: "15+ rooms", color: "hero-orange" }
  ];

  const testimonials = [
    { name: "Jane Doe", role: "Computer Science", quote: "Game-changer for my study schedule!", rating: 5 },
    { name: "Marcus Frank", role: "Engineering", quote: "No more waiting for lab access. Love it!", rating: 5 },
    { name: "Sarah Miller", role: "Business", quote: "So much easier than the old booking system.", rating: 5 }
  ];

  const trustIndicators = [
    { icon: <Lock className="hero-icon-xs" />, text: "Your biometric data is encrypted and never shared" },
    { icon: <Eye className="hero-icon-xs" />, text: "Process locally - images never leave your device" },
    { icon: <Shield className="hero-icon-xs" />, text: "GDPR compliant with full data control" }
  ];

  return (
    <div className="hero-landing-container">
      {/* Animated Background Elements */}
      <div className="hero-bg-elements">
        <div className="hero-bg-circle hero-bg-circle-1"></div>
        <div className="hero-bg-circle hero-bg-circle-2"></div>
        <div className="hero-bg-circle hero-bg-circle-3"></div>
      </div>

      {/* Navigation Header */}
      <nav className="hero-nav">
        <div className="hero-nav-content">
          <div className="hero-logo">
            <div className="hero-logo-icon">
              <GraduationCap className="hero-icon-sm" />
            </div>
            <span className="hero-logo-text">
              Resource System Management
            </span>
          </div>
          
          <div className="hero-nav-actions">
            <button
              onClick={onLogin}
              className="hero-nav-label"
            >
              Already have an account?
            </button>
            <button
              onClick={onLogin}
              className="hero-btn-signin"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-main">
        <div className="hero-content-wrapper">
          <div className="hero-grid">
            {/* Left Column - Content */}
            <div className={`hero-content ${isVisible ? 'hero-visible' : ''}`}>
              <div className="hero-content-inner">
                
                <h1 className="hero-title">
                  Your Campus
                  <span className="hero-title-accent"> Resources</span>
                  <br />
                  Made Simple
                </h1>
                
                <p className="hero-description">
                  Book study rooms, labs, and equipment instantly with secure facial recognition. 
                  No cards, no remembering passwords, no worries.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-number">5K+</div>
                  <div className="hero-stat-label">Active Students</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">100+</div>
                  <div className="hero-stat-label">Resources Available</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">99.9%</div>
                  <div className="hero-stat-label">Uptime</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="hero-cta">
                <button
                  onClick={onGetStarted}
                  className="hero-btn-primary"
                >
                  Get Started For Free Here
                  <MousePointerClick className="hero-icon-xs" />
                </button>
            
              </div>

              {/* Trust Badges */}
              <div className="hero-trust">
                <div className="hero-trust-item">
                  <Shield className="hero-trust-icon hero-green" />
                  <span className="hero-trust-text">GDPR Compliant</span>
                </div>
                <div className="hero-trust-item">
                  <Award className="hero-trust-icon hero-blue" />
                  <span className="hero-trust-text">ISO Certified</span>
                </div>
                <div className="hero-trust-item">
                  <Heart className="hero-trust-icon hero-red" />
                  <span className="hero-trust-text">Student Approved</span>
                </div>
              </div>
            </div>

            {/* Right Column - Interactive Feature Showcase */}
            <div className={`hero-showcase ${isVisible ? 'hero-visible-delayed' : ''}`}>
              <div className="hero-feature-card">
                {/* Feature Tabs */}
                <div className="hero-feature-tabs">
                  {features.map((feature, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`hero-feature-tab ${currentSlide === index ? 'hero-active' : ''}`}
                    >
                      {feature.title}
                    </button>
                  ))}
                </div>

                {/* Feature Content */}
                <div className="hero-feature-content">
                  <div className="hero-feature-demo">
                    <div className={`hero-feature-icon ${
                      currentSlide === 0 ? 'hero-blue' :
                      currentSlide === 1 ? 'hero-green' :
                      'hero-purple'
                    }`}>
                      {features[currentSlide].icon}
                    </div>
                    <h3 className="hero-feature-title">
                      {features[currentSlide].title}
                    </h3>
                    <p className="hero-feature-desc">
                      {features[currentSlide].description}
                    </p>
                    <div className="hero-feature-stat">
                      {features[currentSlide].stats}
                    </div>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="hero-feature-indicators">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={`hero-indicator ${currentSlide === index ? 'hero-active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Resources Section */}
      <section className="hero-section hero-section-bg-white">
        <div className="hero-section-content">
          <div className="hero-section-header">
            <h2 className="hero-section-title">
              Everything You Need to Succeed
            </h2>
            <p className="hero-section-subtitle">
              Access hundreds of campus resources just using your face. From study spaces to high-tech labs.
            </p>
          </div>

          <div className="hero-resource-grid">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="hero-resource-card"
              >
                <div className={`hero-resource-icon ${resource.color}`}>
                  {resource.icon}
                </div>
                <h3 className="hero-resource-title">{resource.name}</h3>
                <p className="hero-resource-count">{resource.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="hero-section hero-section-bg-gradient">
        <div className="hero-section-content">
          <div className="hero-privacy-grid">
            <div>
              <h2 className="hero-section-title">
                Your Privacy is Our Priority
              </h2>
              <p className="hero-section-subtitle">
                Advanced facial recognition that works locally on your device. 
                Your biometric data never leaves your browser.
              </p>
              
              <div className="hero-privacy-list">
                {trustIndicators.map((indicator, index) => (
                  <div key={index} className="hero-privacy-item">
                    <div className="hero-privacy-item-icon">
                      {indicator.icon}
                    </div>
                    <span className="hero-privacy-item-text">{indicator.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="hero-privacy-demo">
              <div className="hero-privacy-demo-header">
                <Camera className="hero-privacy-demo-icon" />
                <span className="hero-privacy-demo-title">Secure Authentication</span>
              </div>
              <div className="hero-privacy-demo-list">
                <div className="hero-privacy-demo-item">
                  <CheckCircle className="hero-privacy-demo-item-icon" />
                  <span className="hero-privacy-demo-item-text">Face detection active</span>
                </div>
                <div className="hero-privacy-demo-item">
                  <CheckCircle className="hero-privacy-demo-item-icon" />
                  <span className="hero-privacy-demo-item-text">Local processing verified</span>
                </div>
                <div className="hero-privacy-demo-item">
                  <CheckCircle className="hero-privacy-demo-item-icon" />
                  <span className="hero-privacy-demo-item-text">Encryption enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="hero-section hero-section-bg-gray">
        <div className="hero-section-content">
          <div className="hero-section-header">
            <h2 className="hero-section-title">
              Loved by Students Everywhere
            </h2>
            <div className="hero-rating">
              <div className="hero-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="hero-star" />
                ))}
              </div>
              <span className="hero-rating-score">4.9/5</span>
              <span className="hero-rating-count">from 2,000+ reviews</span>
            </div>
          </div>

          <div className="hero-testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="hero-testimonial-card">
                <div className="hero-testimonial-stars">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="hero-testimonial-star" />
                  ))}
                </div>
                <p className="hero-testimonial-quote">"{testimonial.quote}"</p>
                <div>
                  <div className="hero-testimonial-author">{testimonial.name}</div>
                  <div className="hero-testimonial-role">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="hero-section hero-section-bg-gradient">
        <div className="hero-section-content">
          <div className="hero-final-cta">
            <h2 className="hero-final-title">
              Ready to Transform Your Campus Experience?
            </h2>
            <p className="hero-final-subtitle">
              Join thousands of students who've already discovered the future of campus resource management.
            </p>
            
            <div className="hero-final-cta-buttons">
              <button
                onClick={onGetStarted}
                className="hero-btn-white"
              >
                <Camera className="hero-icon-xs" />
                Start with Face Recognition
              </button>
              
              <button
                onClick={onLogin}
                className="hero-btn-outline"
              >
                <Smartphone className="hero-icon-xs" />
                I Already Have an Account
              </button>
            </div>
            
            <p className="hero-final-note">
              Free to use • No setup required • Works on any device with a camera
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroLandingPage;