// app/landing/page.tsx

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  ShoppingCart,
  Users,
  TrendingUp,
  Shield,
  Smartphone,
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  BarChart3,
  CreditCard,
  Package,
  Clock,
  Lock,
  Cloud,
  Wifi,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: ShoppingCart,
      title: 'Smart POS System',
      description: 'Lightning-fast checkout with split payments, discounts, and real-time inventory updates.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Package,
      title: 'Inventory Control',
      description: 'Track every item in real-time. Low stock alerts, movement history, and bulk operations.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Role-based permissions, performance tracking, and secure PIN authentication for staff.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: CreditCard,
      title: 'Credit & Payments',
      description: 'Manage customer credit, track payments, and support MTN MoMo, Orange Money, and cash.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: BarChart3,
      title: 'Advanced Reports',
      description: 'Daily sales, profit margins, employee performance, and inventory analytics at your fingertips.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Wifi,
      title: 'Works Offline',
      description: 'Keep selling even without internet. Auto-syncs when connection returns. Never miss a sale.',
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  const stats = [
    { label: 'Active Shops', value: '500+', icon: ShoppingCart },
    { label: 'Transactions/Day', value: '15K+', icon: TrendingUp },
    { label: 'Theft Prevented', value: '$50K+', icon: Shield },
    { label: 'Uptime', value: '99.9%', icon: Zap },
  ];

  const testimonials = [
    {
      name: 'Martha Johnson',
      shop: 'Martha\'s Mini Market',
      location: 'Paynesville',
      text: 'Before LibMerchant, I was losing money every week to theft and poor tracking. Now I know exactly what\'s happening in my shop, even when I\'m not there.',
      rating: 5,
    },
    {
      name: 'David Kollie',
      shop: 'D&K General Store',
      location: 'Sinkor',
      text: 'The credit tracking feature alone has saved me thousands. My customers love the organized system, and I never lose track of who owes what.',
      rating: 5,
    },
    {
      name: 'Princess Williams',
      shop: 'Princess Boutique',
      location: 'Red Light',
      text: 'Setting up was so easy! The pre-loaded products meant I was up and running in minutes, not hours. My employees adapted instantly.',
      rating: 5,
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '1,500',
      period: 'LRD/month',
      description: 'Perfect for small shops getting started',
      features: [
        'Up to 3 employees',
        'Up to 500 products',
        'All core features',
        'Mobile & desktop access',
        'MTN & Orange Money',
        'Email support',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '3,000',
      period: 'LRD/month',
      description: 'For growing businesses',
      features: [
        'Unlimited employees',
        'Unlimited products',
        'Advanced analytics',
        'Priority support',
        'Custom training',
        'API access',
      ],
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200/50'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  LIB-Merchant
                </span>
                <p className="text-xs text-gray-500 font-medium">Manage Smart. Grow Fast.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 font-semibold transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm px-4 py-2">
                  Get Started
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 mb-8 shadow-lg border border-gray-200/50 animate-fade-in-up">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">
                Trusted by 500+ Liberian Businesses
              </span>
              <div className="flex -space-x-2">
                {['👨🏿‍💼', '👩🏾‍💼', '👨🏾‍💼', '👩🏿‍💼'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white flex items-center justify-center text-sm"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight animate-fade-in-up animation-delay-200">
              <span className="bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                Stop Losing Money to
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Theft & Chaos
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto animate-fade-in-up animation-delay-400">
              The enterprise-grade inventory and sales management system built for{' '}
              <span className="font-bold text-gray-900">Liberian retail shops</span>.
              Gain complete control, track employee accountability, and maximize profits.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up animation-delay-600">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg px-8 py-6 shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 w-full sm:w-auto"
                >
                  Start 30-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowVideoModal(true)}
                className="text-lg px-8 py-6 border-2 border-gray-300 hover:border-emerald-600 hover:bg-emerald-50 transition-all w-full sm:w-auto"
              >
                Watch Demo
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 animate-fade-in-up animation-delay-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">Setup in 10 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="w-8 h-8 text-emerald-200 mx-auto mb-3" />
                <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-emerald-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App UI Showcase Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50 to-transparent opacity-50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Animated UI Mockup - Desktop Version */}
            <div className="relative order-2 lg:order-1">
              <div className="relative group">
                {/* Animated glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse-slow"></div>
                
                {/* Laptop mockup container */}
                <div className="relative">
                  {/* Screen */}
                  <div className="relative bg-gray-900 rounded-t-2xl shadow-2xl overflow-hidden border-8 border-gray-800 border-b-0">
                    {/* Screen bezel */}
                    <div className="relative w-full aspect-[4/3] bg-white overflow-hidden">
                      {/* OPTION 1: Auto-playing video (Recommended for best effect) */}
                      {/* Uncomment this when you have your app demo video */}
                      {/*
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        <source src="/videos/app-demo.mp4" type="video/mp4" />
                        <source src="/videos/app-demo.webm" type="video/webm" />
                      </video>
                      */}

                      {/* OPTION 2: Static screenshot with subtle animation */}
                      {/* This placeholder - replace with your actual screenshot or video */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 p-8">
                        <div className="text-center text-white space-y-4 max-w-md">
                          <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm animate-float">
                            <BarChart3 className="w-10 h-10" />
                          </div>
                          <div>
                            <p className="text-xl font-bold mb-2">Desktop App Demo</p>
                            <p className="text-sm text-blue-100 mb-4">
                              Record your app screen or use a screenshot
                            </p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left space-y-2 text-xs">
                            <p className="font-semibold text-emerald-100">Option 1: Video (Recommended)</p>
                            <p className="font-mono text-emerald-200">
                              /videos/app-demo.mp4
                            </p>
                            <p className="font-semibold text-emerald-100 mt-3">Option 2: Screenshot</p>
                            <p className="font-mono text-emerald-200">
                              /images/app-dashboard.png
                            </p>
                            <p className="text-emerald-200 mt-2">
                              Recommended: 1920x1200 or 1600x1000
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* OPTION 3: Static image - uncomment when you have the screenshot */}
                      {/*
                      <img
                        src="/images/app-dashboard.png"
                        alt="LibMerchant Dashboard Interface"
                        className="w-full h-full object-cover"
                      />
                      */}
                    </div>
                  </div>

                  {/* Laptop base */}
                  <div className="relative">
                    {/* Keyboard/base */}
                    <div className="h-3 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-2xl shadow-xl"></div>
                    {/* Bottom stand */}
                    <div className="mx-auto w-48 h-1.5 bg-gradient-to-b from-gray-600 to-gray-700 rounded-b-lg shadow-lg"></div>
                  </div>
                </div>

                {/* Floating UI elements for visual interest - Hidden on mobile to avoid clutter */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-2xl p-4 animate-float hidden lg:block border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Today's Sales</p>
                      <p className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        15,000 LRD
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-4 animate-float animation-delay-2000 hidden lg:block border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Low Stock Alert</p>
                      <p className="text-xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        3 Items
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animated badge */}
                <div className="absolute top-1/3 -right-6 -translate-y-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full px-4 py-2 shadow-xl hidden xl:block animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">Live Demo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-2 mb-6 font-semibold text-sm">
                <Zap className="w-4 h-4" />
                See It In Action
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Powerful Yet
                <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Simple to Use
                </span>
              </h2>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Designed specifically for Liberian shop owners. No technical knowledge required. 
                Start selling in minutes, not hours.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: Clock,
                    title: 'Setup in 10 Minutes',
                    description: 'Pre-loaded with common Liberian products. Just add your prices and start.',
                  },
                  {
                    icon: Smartphone,
                    title: 'Works on Any Device',
                    description: 'Mobile-first design. Use on Android, iPhone, tablet, or computer.',
                  },
                  {
                    icon: Wifi,
                    title: 'Offline Mode',
                    description: 'No internet? No problem. Sales sync automatically when back online.',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => setShowVideoModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Watch Full Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for Liberian retail shops
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}
                ></div>

                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:40px_40px]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 font-semibold text-sm text-white">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              Trusted by Shop Owners
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Real Results from Real Businesses
            </h2>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Join hundreds of successful shops across Liberia seeing measurable results
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Quote mark decoration */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg rotate-12 group-hover:rotate-0 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                {/* Star rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial text */}
                <p className="text-white/90 leading-relaxed mb-6 text-base">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {testimonial.name}
                    </div>
                    <div className="text-emerald-200 text-xs truncate">
                      {testimonial.shop}
                    </div>
                    <div className="text-emerald-300/70 text-xs">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-12 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-black text-white mb-2">500+</div>
                <div className="text-emerald-200 text-sm font-medium">Active Shops</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white mb-2">4.9/5</div>
                <div className="text-emerald-200 text-sm font-medium">Customer Rating</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white mb-2">15K+</div>
                <div className="text-emerald-200 text-sm font-medium">Daily Transactions</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white mb-2">99.9%</div>
                <div className="text-emerald-200 text-sm font-medium">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl p-10 shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular
                    ? 'border-emerald-600 ring-4 ring-emerald-100'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 font-medium">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register">
                  <Button
                    size="lg"
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600 mt-12">
            All plans include 30-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:40px_40px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-emerald-100 mb-10 leading-relaxed">
            Join 500+ successful shops using LibMerchant. Start your free trial today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-2xl w-full sm:w-auto font-bold"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-6 border-2 border-white text-white hover:bg-white/10 w-full sm:w-auto"
            >
              Schedule Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100 mt-8">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span>Secure & encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              <span>Cloud-based</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              <span>Mobile-first</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Video player - Replace VIDEO_URL with your demo video URL */}
            <div className="w-full h-full flex items-center justify-center">
              {/* Placeholder - Replace with actual video */}
              <div className="text-center text-white">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold mb-2">Demo Video Coming Soon</p>
                <p className="text-sm text-gray-400">
                  Replace this placeholder with your video URL in the code
                </p>
              </div>

              {/* Uncomment and add your video URL when ready:
              <iframe
                className="w-full h-full"
                src="YOUR_VIDEO_URL_HERE"
                title="LibMerchant Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              */}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">LIB-Merchant</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Enterprise-grade inventory and sales management for Liberian businesses.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-white transition-colors">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/training" className="hover:text-white transition-colors">
                    Training
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              &copy; 2024 LIB-Merchant. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-gray-400">SSL Encrypted & Secure</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
        }

        .bg-grid-white\\/10 {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}