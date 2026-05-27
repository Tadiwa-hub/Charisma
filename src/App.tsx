import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Car, 
  ChevronRight, 
  Star, 
  Camera, 
  Menu, 
  X
} from 'lucide-react';

import AvailabilityCalendar from './AvailabilityCalendar';
import { fetchAvailability, createBooking } from './api';
import type { AvailabilityEntry } from './types';

const AdminApp = lazy(() => import('./AdminApp'));

// --- Image Imports ---
import heroBg from './assets/hero-bg.jpg';
import m2 from './assets/makeup-2.jpg';
import m3 from './assets/makeup-3.jpg';
import m4 from './assets/makeup-4.jpg';
import m5 from './assets/makeup-5.jpg';
import m6 from './assets/makeup-6.jpg';
import m7 from './assets/makeup-7.jpg';
import m8 from './assets/makeup-8.jpg';
import m9 from './assets/makeup-9.jpg';
import m10 from './assets/makeup-10.jpg';
import m11 from './assets/makeup-11.jpg';
import m12 from './assets/makeup-12.jpg';
import m13 from './assets/makeup-13.jpg';
import m14 from './assets/makeup-14.jpg';

// --- Official WhatsApp SVG ---
const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// --- Types ---
interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  displayPrice?: string;
  icon?: string;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  description?: string;
}

// --- Data ---
const SERVICES: Service[] = [
  { id: 'm-artist', name: 'Makeup by Studio Artist', price: 35, category: 'SERVICES', description: 'Professional in-house artists personally trained by Charisma', image: m2, displayPrice: 'Contact for pricing', icon: '💄' },
  { id: 'studio-artists-combo', name: 'Studio Artists Combo', price: 60, category: 'SERVICES', description: 'Hair installation and makeup combo package', image: m3, displayPrice: 'From $60', icon: '✨' },
  { id: 'brow-service', name: 'Brow Service', price: 100, category: 'SERVICES', description: 'Semi-permanent eyebrows lasting 2+ years', image: m4, displayPrice: '$100', icon: '👁️' },
  { id: 'manicure-pedicure', name: 'Manicure & Pedicure', price: 15, category: 'SERVICES', description: 'Full treatment from scrubbing to painting hands and toes', image: m5, displayPrice: 'From $15', icon: '💅' },
  { id: 'makeup-classes', name: 'Makeup Classes', price: 150, category: 'SERVICES', description: 'Learn tips and tricks from the professionals', image: m6, displayPrice: 'From $150', icon: '🎓' },
];

const ADDONS: Addon[] = [
  { id: 'a-brow', name: 'Brow Services', price: 100 },
  { id: 'a-nails', name: 'Nails', price: 15 },
  { id: 'a-tutorial', name: 'Makeup Tutorial', price: 150, description: 'Learn the techniques yourself' },
];

const GALLERY = [m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14];

const TESTIMONIALS = [
  { name: "Nyasha M.", rating: 5, text: "The most professional service in Harare. My makeup lasted all night!" },
  { name: "Tariro G.", rating: 5, text: "Absolutely loved my look. The studio vibe is so luxury." },
  { name: "Sandra R.", rating: 5, text: "House call was punctual and the result was stunning. Highly recommend." },
];

export default function App() {
  const isAdminRoute = typeof window !== 'undefined' && (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
  if (isAdminRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#1A1A1A] font-inter">
          <div className="text-2xl font-garamond tracking-widest text-[#C9A96E] animate-pulse">CHARISMA ADMIN</div>
          <div className="text-xs text-[#6B6B6B] mt-2 uppercase tracking-[0.2em]">Loading admin portal…</div>
        </div>
      }>
        <AdminApp />
      </Suspense>
    );
  }

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<'studio' | 'house_call'>('studio');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    eventType: '',
    notes: ''
  });
  const [availabilityEntries, setAvailabilityEntries] = useState<AvailabilityEntry[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // --- Mobile Menu Overlay State ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Navbar Show/Hide Scroll State ---
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [navbarVisible, setNavbarVisible] = useState(true);

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      // Show navbar if scrolling up or if near top
      setNavbarVisible(prevScrollPos > currentScrollPos || currentScrollPos < 30);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  useEffect(() => {
    const loadAvailability = async () => {
      const from = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const to = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
      const cacheKey = `availability:${from.toISOString().slice(0, 10)}:${to.toISOString().slice(0, 10)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const payload = JSON.parse(cached) as { timestamp: number; entries: AvailabilityEntry[] };
          if (Date.now() - payload.timestamp < 5 * 60 * 1000) {
            setAvailabilityEntries(payload.entries);
            return;
          }
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      setAvailabilityLoading(true);
      try {
        const entries = await fetchAvailability(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
        setAvailabilityEntries(entries);
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), entries }));
        setAvailabilityError('');
      } catch (error) {
        console.error(error);
        setAvailabilityError('Unable to load availability. Dates will default to open or Sunday availability.');
      } finally {
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();
  }, [calendarMonth]);

  // --- Calculations ---
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const travelFee = location === 'house_call' ? 50 : 0;
  
  // Custom total calculation
  const subtotal = (selectedService?.id === 'm-artist' ? 35 : (selectedService?.price || 0)) + addonsTotal;
  const total = subtotal + travelFee;

  const availabilityMap = useMemo(() => {
    return availabilityEntries.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.date] = entry.status;
      return acc;
    }, {});
  }, [availabilityEntries]);

  const selectedDateStatus = formData.date
    ? (availabilityMap[formData.date] as 'open' | 'fully_booked' | 'appointment_only') || (new Date(formData.date).getDay() === 0 ? 'appointment_only' : 'open')
    : 'open';

  // --- Handlers ---
  const toggleAddon = (addon: Addon) => {
    if (selectedAddons.find(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const formatDateToSlashes = (dateStr: string): string => {
    if (!dateStr) return '';
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || selectedDateStatus === 'fully_booked') return;

    const formattedDate = formatDateToSlashes(formData.date);
    const message = `Hello Charisma Beauty Studio! I'd like to book ${selectedService?.name} on ${formattedDate}. Name: ${formData.name}. Phone: ${formData.phone}. Special requests: ${formData.notes || 'None'}. I will send proof of $10 deposit payment.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/263777554619?text=${encodedMessage}`;

    setSubmittingBooking(true);
    setBookingError('');

    try {
      await createBooking({
        client_name: formData.name,
        client_phone: formData.phone,
        service_requested: selectedService?.name || '',
        preferred_date: formData.date,
        status: 'pending',
        deposit_paid: false,
        notes: formData.notes,
      });
    } catch (error) {
      console.error(error);
      setBookingError('Unable to save booking to the database. The booking will still proceed on WhatsApp.');
    } finally {
      setSubmittingBooking(false);
      window.location.assign(whatsappUrl);
    }
  };

  const handleQuickInquiry = () => {
    const message = "Hello Charisma! I'm interested in booking a session. Could you please provide more information?";
    window.open(`https://wa.me/263777554619?text=${encodeURIComponent(message)}`, '_blank');
  };

  const isFormValid = !!(selectedService && 
                     policyAccepted && 
                     formData.name && 
                     formData.phone &&
                     formData.date && 
                     formData.time && 
                     formData.eventType);

  // --- Loading screen ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center overflow-hidden z-[100] transition-opacity duration-500">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-garamond text-[#C9A96E] tracking-[0.3em] uppercase animate-pulse">
            Charisma
          </h1>
          <p className="text-[11px] font-inter text-[#6B6B6B] uppercase tracking-[0.4em] -mt-1 font-semibold">
            Beauty Studio
          </p>
          <div className="w-16 h-[1px] bg-[#C9A96E]/40 mx-auto mt-4 overflow-hidden relative">
            <div className="w-8 h-full bg-[#C9A96E] absolute top-0 left-0 animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] font-inter selection:bg-[#E8D5C4] selection:text-[#1A1A1A] antialiased">
      
      {/* --- Floating WhatsApp Button --- */}
      <button 
        onClick={handleQuickInquiry}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all rose-gold-glow group flex items-center justify-center"
        aria-label="WhatsApp Inquiry"
      >
        <WhatsAppIcon size={26} />
        <span className="absolute right-full mr-4 bg-[#1A1A1A] text-white text-[10px] font-semibold uppercase tracking-widest py-2 px-4 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-luxury">
          Quick Inquiry
        </span>
      </button>

      {/* --- Top Navbar --- */}
      <nav className={`fixed top-0 left-0 w-full h-[64px] glass-effect z-40 px-6 md:px-12 flex justify-between items-center transition-all duration-300 ${
        navbarVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div>
          <a href="#home" className="flex items-center gap-1">
            <span className="text-22px font-garamond font-bold text-[#C9A96E] tracking-widest uppercase">Charisma</span>
          </a>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-inter font-medium uppercase tracking-[0.2em] text-[#6B6B6B]">
          <a href="#services" className="hover:text-[#C9A96E] transition-colors">Services</a>
          <a href="#gallery" className="hover:text-[#C9A96E] transition-colors">Gallery</a>
          <a 
            href="#book" 
            className="px-5 py-2 border border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-white transition-all active-press uppercase tracking-widest text-[11px] rounded-sm font-semibold"
          >
            Book Now
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 text-[#1A1A1A] hover:text-[#C9A96E] transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* --- Mobile Full-Screen White Overlay Menu --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col p-6 animate-fade-in">
          <div className="flex justify-between items-center h-[64px] border-b border-[#F0EBEB]">
            <span className="text-22px font-garamond font-bold text-[#C9A96E] tracking-widest uppercase">Charisma</span>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-[#1A1A1A] hover:text-[#C9A96E]"
              aria-label="Close Menu"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center gap-10 text-center">
            <a 
              href="#services" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-garamond font-bold tracking-wider text-[#1A1A1A] hover:text-[#C9A96E] transition-colors"
            >
              Services
            </a>
            <a 
              href="#gallery" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-garamond font-bold tracking-wider text-[#1A1A1A] hover:text-[#C9A96E] transition-colors"
            >
              Gallery
            </a>
            <a 
              href="#book" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-10 py-4 bg-[#C9A96E] text-white rounded-md tracking-[0.2em] font-semibold text-sm uppercase shadow-md active-press"
            >
              Book Now
            </a>
          </div>

          <div className="text-center py-6 border-t border-[#F0EBEB]">
            <p className="text-[11px] uppercase tracking-widest text-[#AAAAAA]">Avondale, Harare</p>
          </div>
        </div>
      )}

      {/* --- Main Content Container --- */}
      <main className="relative z-10 pt-[64px]">
        
        {/* HERO SECTION */}
        <section id="home" className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white px-6 md:px-12 py-12 md:py-24">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Left side (text) */}
            <div className="space-y-6 text-center md:text-left max-w-xl mx-auto md:mx-0">
              <span className="text-[11px] font-inter font-bold tracking-[0.3em] text-[#C9A96E] uppercase block">
                BEAUTY STUDIO — AVONDALE, HARARE
              </span>
              
              <h2 className="text-4xl md:text-64px font-garamond font-light leading-tight text-[#1A1A1A]">
                Where Beauty <br />
                Becomes Art
              </h2>
              
              <p className="text-sm md:text-base font-inter text-[#6B6B6B] leading-relaxed font-light">
                Professional beauty services tailored to bring out your best self. Every detail crafted to perfection.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <a 
                  href="#book" 
                  className="px-8 py-4 bg-[#C9A96E] text-white font-inter font-semibold tracking-widest uppercase rounded-[8px] hover:bg-[#B8935A] transition-all shadow-luxury active-press text-center text-xs"
                >
                  Book Appointment
                </a>
                <a 
                  href="#services" 
                  className="px-8 py-4 border border-[#C9A96E] text-[#C9A96E] font-inter font-semibold tracking-widest uppercase rounded-[8px] hover:bg-[#FDF9F7] transition-all active-press text-center text-xs"
                >
                  View Services
                </a>
              </div>
            </div>

            {/* Right side (image) */}
            <div className="w-full flex justify-center px-4">
              <div className="relative w-full max-w-md md:max-w-lg aspect-[4/5] rounded-[20px] overflow-hidden shadow-luxury">
                <img 
                  src={heroBg} 
                  alt="Luxury Beauty Salon Studio" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
          </div>
        </section>

        {/* LOCATION TOGGLE */}
        <section className="max-w-md mx-auto px-6 py-6 text-center">
          <div className="bg-[#FDF9F7] p-1.5 rounded-full flex gap-1 border border-[#F0EBEB] shadow-sm">
            <button 
              onClick={() => setLocation('studio')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all active-press ${
                location === 'studio' 
                  ? 'bg-[#C9A96E] text-white shadow-md font-semibold' 
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A] font-medium'
              }`}
            >
              <MapPin size={16} />
              <span className="text-[11px] uppercase tracking-widest">Studio Session</span>
            </button>
            <button 
              onClick={() => setLocation('house_call')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all active-press ${
                location === 'house_call' 
                  ? 'bg-[#C9A96E] text-white shadow-md font-semibold' 
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A] font-medium'
              }`}
            >
              <Car size={16} />
              <span className="text-[11px] uppercase tracking-widest">House Call</span>
            </button>
          </div>

          {location === 'house_call' && (
            <div className="mt-4 p-4 rounded-xl border border-[#E8D5C4] bg-[#FDF9F7] text-left animate-fade-in flex items-start gap-3">
              <Sparkles className="text-[#C9A96E] shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                <span className="font-bold text-[#1A1A1A]">House Call Selected</span> — A premium mobile styling service at your home. An additional travel fee from <span className="text-[#C9A96E] font-bold">$50</span> applies depending on your location.
              </p>
            </div>
          )}
        </section>

        {/* SERVICES SECTION */}
        <section id="services" className="bg-[#FDF9F7] py-20 px-6 md:px-12">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <span className="text-[11px] font-inter font-bold tracking-[0.35em] text-[#C9A96E] uppercase block">
                WHAT WE OFFER
              </span>
              <h3 className="text-3xl md:text-42px font-garamond font-bold tracking-tight text-[#1A1A1A]">
                Our Services
              </h3>
              <div className="w-12 h-[1px] bg-[#C9A96E] mx-auto mt-4" />
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {SERVICES.map((service) => {
                const isSelected = selectedService?.id === service.id;
                
                return (
                  <div 
                    key={service.id}
                    className={`bg-white rounded-2xl p-6 shadow-luxury flex flex-col justify-between transition-all duration-300 border ${
                      isSelected ? 'border-[#C9A96E]' : 'border-[#F0EBEB] hover:border-[#C9A96E]/40'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Image & Icon Header */}
                      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#FDF9F7] mb-2">
                        {service.image && (
                          <img 
                            src={service.image} 
                            alt={service.name} 
                            className="w-full h-full object-cover" 
                          />
                        )}
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-2 rounded-full text-lg shadow-sm">
                          {service.icon}
                        </span>
                      </div>
                      
                      {/* Name & Desc */}
                      <div>
                        <h4 className="text-lg font-garamond font-bold text-[#1A1A1A]">{service.name}</h4>
                        <p className="text-xs font-inter text-[#6B6B6B] leading-relaxed mt-1">{service.description}</p>
                      </div>
                    </div>

                    {/* Price and Action button */}
                    <div className="pt-6 border-t border-[#F0EBEB] flex items-center justify-between mt-6">
                      <div>
                        <span className="text-[10px] text-[#AAAAAA] uppercase tracking-widest block">Price</span>
                        <span className="text-lg font-bold text-[#C9A96E] font-inter">
                          {service.displayPrice}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedService(service);
                          // Auto scroll to form
                          document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`text-xs uppercase tracking-widest font-semibold flex items-center gap-1 active-press ${
                          isSelected ? 'text-[#AAAAAA] cursor-default' : 'text-[#C9A96E] hover:text-[#B8935A]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Book Now'}
                        {!isSelected && <ChevronRight size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        </section>

        {/* DYNAMIC ESTIMATED PRICE CALCULATOR */}
        <section className="bg-white py-12 px-6 md:px-12 border-b border-[#F0EBEB]">
          <div className="max-w-lg mx-auto bg-[#FDF9F7] rounded-2xl p-6 border border-[#F0EBEB] shadow-luxury space-y-6">
            <div className="text-center pb-2 border-b border-[#F0EBEB]">
              <span className="text-[10px] font-inter font-bold tracking-[0.3em] text-[#C9A96E] uppercase block">
                ESTIMATED BILL
              </span>
              <h4 className="text-lg font-garamond font-bold text-[#1A1A1A] mt-1">Pricing Overview</h4>
            </div>

            <div className="space-y-3 text-xs text-[#6B6B6B]">
              
              {/* Selected Service */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#1A1A1A]">
                  Service: {selectedService ? selectedService.name : 'None selected'}
                </span>
                <span className="font-semibold text-[#1A1A1A]">
                  {selectedService ? (selectedService.id === 'm-artist' ? 'Contact for price' : `$${selectedService.price}`) : '$0'}
                </span>
              </div>

              {/* Addons if chosen */}
              <div className="flex justify-between items-center gap-2">
                <div className="flex flex-col">
                  <span className="font-medium text-[#1A1A1A]">Add-ons</span>
                  {selectedAddons.length > 0 && (
                    <span className="text-[10px] text-[#AAAAAA] leading-tight">
                      ({selectedAddons.map(a => a.name).join(', ')})
                    </span>
                  )}
                </div>
                <span className="font-semibold text-[#1A1A1A]">${addonsTotal}</span>
              </div>

              {/* Addons checkbox toggling list */}
              <div className="py-2 border-y border-[#F0EBEB] space-y-2">
                <p className="text-[10px] text-[#AAAAAA] uppercase tracking-wider font-semibold">Enhance Your Booking</p>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {ADDONS.map((addon) => {
                    const isAddonSelected = selectedAddons.some(a => a.id === addon.id);
                    return (
                      <button 
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                          isAddonSelected 
                            ? 'border-[#C9A96E] bg-white text-[#1A1A1A]' 
                            : 'border-[#F0EBEB] bg-white/40 text-[#6B6B6B] hover:border-[#C9A96E]/30'
                        }`}
                      >
                        <span className="text-xs font-medium">{addon.name}</span>
                        <span className="text-xs font-bold text-[#C9A96E]">+${addon.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Travel option */}
              <div className="flex justify-between items-center">
                <span>Location fee ({location === 'studio' ? 'Studio Session' : 'House Call'})</span>
                <span className="font-semibold text-[#1A1A1A]">+${travelFee}</span>
              </div>

              {/* Divider */}
              <div className="h-[1px] w-full bg-[#F0EBEB] my-2" />

              {/* Total estimation */}
              <div className="flex justify-between items-center">
                <span className="text-base font-garamond font-bold text-[#1A1A1A]">Estimated Total</span>
                <span className="text-xl font-bold text-[#C9A96E] font-inter">
                  {selectedService?.id === 'm-artist' ? 'Contact for final price' : `$${total}`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* BOOKING DEPOSIT SECTION */}
        <section className="bg-white py-16 px-6 md:px-12 border-b border-[#F0EBEB]">
          <div className="max-w-2xl mx-auto bg-white border border-[#F0EBEB] border-l-4 border-l-[#C9A96E] p-8 rounded-2xl shadow-luxury space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-inter font-bold tracking-[0.2em] text-[#C9A96E] uppercase block">
                IMPORTANT DETAILS
              </span>
              <h3 className="text-2xl font-garamond font-bold text-[#1A1A1A]">
                Secure Your Appointment
              </h3>
            </div>
            
            <p className="text-sm font-inter text-[#6B6B6B] leading-relaxed">
              A non-refundable deposit of <span className="text-[#C9A96E] font-bold">$10</span> is required to confirm your booking. This secures your timing slot and is fully deducted from your final payment on the day of styling.
            </p>

            {/* Info boxes for pay channels */}
            <div className="bg-[#FDF9F7] border border-[#F0EBEB] p-5 rounded-xl space-y-3">
              <p className="text-xs uppercase tracking-widest text-[#6B6B6B] font-semibold flex items-center gap-2">
                <span>📱</span> Payment Channels (EcoCash USD / InnBucks)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 font-inter">
                <div className="bg-white p-3 rounded-lg border border-[#F0EBEB]">
                  <span className="text-[10px] text-[#AAAAAA] uppercase block font-semibold">Mobile Number</span>
                  <span className="text-sm font-bold text-[#1a1a1a]">+263 777 554 619</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#F0EBEB]">
                  <span className="text-[10px] text-[#AAAAAA] uppercase block font-semibold">Account Holder</span>
                  <span className="text-sm font-bold text-[#1a1a1a]">Tessa Masawi</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-inter italic text-[#AAAAAA] mt-2">
              Note: "Send proof of payment with your WhatsApp booking confirmation."
            </p>
          </div>
        </section>

        {/* ABOUT / STUDIO SECTION */}
        <section className="bg-[#FDF9F7] py-20 px-6 md:px-12 border-b border-[#F0EBEB]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Left Image */}
            <div className="w-full flex justify-center">
              <div className="relative w-full max-w-md aspect-[4/3] rounded-[16px] overflow-hidden shadow-luxury border border-[#F0EBEB]">
                <img 
                  src={m3} 
                  alt="Beautiful Charisma Makeup Studio" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right text details */}
            <div className="space-y-6 max-w-xl mx-auto md:mx-0">
              <span className="text-[11px] font-inter font-bold tracking-[0.3em] text-[#C9A96E] uppercase block">
                ABOUT THE STUDIO
              </span>
              <h3 className="text-3xl font-garamond font-bold text-[#1A1A1A]">
                Beauty Crafted With Passion
              </h3>
              <p className="text-sm font-inter text-[#6B6B6B] leading-relaxed">
                Charisma Beauty Studio is an exclusive aesthetic environment dedicated to premium styling. Our professional in-house artists are personally trained by Charisma herself to ensure the signature elite standards are matched on every appointment.
              </p>

              {/* Hours box */}
              <div className="bg-white border border-[#F0EBEB] p-5 rounded-2xl shadow-sm space-y-4">
                <p className="text-xs uppercase tracking-widest text-[#AAAAAA] font-bold border-b border-[#F0EBEB] pb-2">
                  🕗 STUDIO DETAILS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#6B6B6B] font-inter">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🕗</span>
                    <span>Mon - Sat: 8:30 - 17:30</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span>Sunday: Appointment Only</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <span className="text-lg">📍</span>
                    <span>33 Lanark, Avondale, Harare</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* BOOKING FORM SECTION */}
        <section id="book" className="bg-white py-20 px-6 md:px-12 border-b border-[#F0EBEB]">
          <div className="max-w-[560px] mx-auto bg-white border border-[#F0EBEB] rounded-2xl p-8 shadow-luxury space-y-8">
            
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-garamond font-bold text-[#1A1A1A]">
                Book Your Appointment
              </h3>
              <div className="w-12 h-[1px] bg-[#C9A96E] mx-auto mt-2" />
            </div>

            <form onSubmit={handleBooking} className="space-y-6">
              
              {/* Full name */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-inter font-semibold text-[#1A1A1A]">
                  Full name
                </label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your name"
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-4 h-[50px] font-inter text-[15px] text-[#1A1A1A] placeholder-[#AAAAAA] focus:border-[#C9A96E] outline-none transition-all"
                />
              </div>

              {/* Phone number */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-inter font-semibold text-[#1A1A1A]">
                  Phone number
                </label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter your mobile number"
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-4 h-[50px] font-inter text-[15px] text-[#1A1A1A] placeholder-[#AAAAAA] focus:border-[#C9A96E] outline-none transition-all"
                />
              </div>

              {/* Service Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-inter font-semibold text-[#1A1A1A]">
                  Service
                </label>
                <select 
                  required
                  value={selectedService?.id || ''}
                  onChange={(e) => {
                    const serv = SERVICES.find(s => s.id === e.target.value);
                    if (serv) setSelectedService(serv);
                  }}
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-4 h-[50px] font-inter text-[15px] text-[#1A1A1A] focus:border-[#C9A96E] outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>Choose a beauty service</option>
                  {SERVICES.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.displayPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type Select dropdown */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-inter font-semibold text-[#1A1A1A]">
                  Event Type
                </label>
                <select 
                  required
                  value={formData.eventType}
                  onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-4 h-[50px] font-inter text-[15px] text-[#1A1A1A] focus:border-[#C9A96E] outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>Select event type</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Photo Session">Photo Session</option>
                  <option value="Gala / Formal">Gala / Formal</option>
                  <option value="Casual / Soft Glam">Casual / Soft Glam</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Availability Calendar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-inter font-semibold text-[#1A1A1A]">
                    Preferred Date
                  </label>
                  <span className="text-[11px] text-[#AAAAAA]">Choose from slot calendar</span>
                </div>
                
                <AvailabilityCalendar
                  availability={availabilityEntries}
                  selectedDate={formData.date}
                  onSelectDate={(value) => setFormData({ ...formData, date: value })}
                  currentMonth={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  loading={availabilityLoading}
                />
                
                {availabilityError && (
                  <p className="text-xs text-[#E53935] mt-1">{availabilityError}</p>
                )}

                {/* Date availability banner */}
                {formData.date && (
                  <div className={`mt-3 p-3 rounded-lg border text-xs font-inter flex items-center gap-2 ${
                    selectedDateStatus === 'fully_booked'
                      ? 'border-[#E53935]/20 bg-[#E53935]/5 text-[#E53935]'
                      : selectedDateStatus === 'appointment_only'
                        ? 'border-[#C9A96E]/20 bg-[#FDF9F7] text-[#C9A96E]'
                        : 'border-[#4CAF50]/20 bg-[#4CAF50]/5 text-[#4CAF50]'
                  }`}>
                    <span className="text-sm">
                      {selectedDateStatus === 'fully_booked' ? '🔴' : selectedDateStatus === 'appointment_only' ? '🟡' : '🟢'}
                    </span>
                    <span>
                      {selectedDateStatus === 'fully_booked' && 'Fully Booked: This day is completely full.'}
                      {selectedDateStatus === 'appointment_only' && 'Appointment Only: Special Sunday request slot.'}
                      {selectedDateStatus === 'open' && 'Available: This date is available.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Time select picker */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-inter font-semibold text-[#1A1A1A]">
                  Preferred Time
                </label>
                <input 
                  required
                  type="time" 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-4 h-[50px] font-inter text-[15px] text-[#1A1A1A] focus:border-[#C9A96E] outline-none transition-all"
                />
              </div>

              {/* Textarea Special Requests */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-inter font-semibold text-[#1A1A1A]">
                  Special requests
                </label>
                <textarea 
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any allergies, requirements, or location notes?"
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] p-4 font-inter text-[15px] text-[#1A1A1A] placeholder-[#AAAAAA] focus:border-[#C9A96E] outline-none transition-all resize-none"
                />
              </div>

              {/* Deposit secure check policy */}
              <div className="p-4 bg-[#FDF9F7] rounded-xl border border-[#F0EBEB] space-y-3">
                <p className="text-xs font-semibold text-[#1A1A1A]">💳 $10 Confirmation Deposit Required</p>
                <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                  InnBucks/EcoCash: <span className="font-bold text-[#1A1A1A]">+263 777 554 619 (Tessa Masawi)</span>.
                </p>
                <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-[#F0EBEB]">
                  <input 
                    type="checkbox" 
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="w-4 h-4 text-[#C9A96E] focus:ring-[#C9A96E] border-[#E8E0E0] rounded"
                  />
                  <span className="text-[11px] text-[#6B6B6B]">
                    I agree to send proof of payment on WhatsApp to secure slot *
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={!isFormValid || selectedDateStatus === 'fully_booked' || submittingBooking}
                className={`w-full h-[52px] rounded-[10px] text-white font-inter font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 active-press shadow-md ${
                  isFormValid && selectedDateStatus !== 'fully_booked' && !submittingBooking
                    ? 'bg-[#C9A96E] hover:bg-[#B8935A]' 
                    : 'bg-[#AAAAAA] cursor-not-allowed opacity-50'
                }`}
              >
                <WhatsAppIcon size={18} />
                <span>
                  {submittingBooking ? 'Saving Slot & Opening WhatsApp…' : 'Book on WhatsApp →'}
                </span>
              </button>

              {bookingError && (
                <div className="bg-[#E53935]/5 p-3 rounded-lg border border-[#E53935]/20">
                  <p className="text-[11px] text-center text-[#E53935] uppercase tracking-wider">{bookingError}</p>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* CURATED GALLERY */}
        <section id="gallery" className="bg-white py-20 px-6 md:px-12">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center space-y-2">
              <span className="text-[11px] font-inter font-bold tracking-[0.35em] text-[#C9A96E] uppercase block">
                OUR WORK
              </span>
              <h3 className="text-3xl font-garamond font-bold tracking-tight text-[#1A1A1A]">
                Studio Gallery
              </h3>
              <div className="w-12 h-[1px] bg-[#C9A96E] mx-auto mt-4" />
            </div>

            {/* Masonry-like grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {GALLERY.map((img, i) => (
                <div 
                  key={i} 
                  className="relative aspect-[3/4] overflow-hidden rounded-[12px] group luxury-shadow border border-[#F0EBEB]"
                >
                  <img 
                    src={img} 
                    alt={`Charisma Art Work ${i+1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[#C9A96E]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-white/90 backdrop-blur-md text-[#1A1A1A] font-inter font-semibold uppercase tracking-widest text-[11px] py-2 px-5 rounded-full shadow-md">
                      View Look
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center pt-8">
              <a 
                href="https://wa.me/263777554619" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-inter font-semibold uppercase tracking-widest text-[#C9A96E] hover:text-[#B8935A] transition-colors"
              >
                <Camera size={18} />
                <span>Follow our latest looks on WhatsApp</span>
              </a>
            </div>

          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="bg-[#FDF9F7] py-20 px-6 md:px-12 border-t border-[#F0EBEB]">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center space-y-2">
              <span className="text-[11px] font-inter font-bold tracking-[0.3em] text-[#C9A96E] uppercase block">
                LOVE FROM CLIENTS
              </span>
              <h3 className="text-3xl font-garamond font-bold tracking-tight text-[#1A1A1A]">
                Testimonials
              </h3>
              <div className="w-12 h-[1px] bg-[#C9A96E] mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <div 
                  key={i} 
                  className="bg-white border border-[#F0EBEB] rounded-2xl p-8 shadow-luxury space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} size={14} className="fill-[#C9A96E] text-[#C9A96E]" />
                      ))}
                    </div>
                    
                    <p className="text-sm font-inter font-light text-[#6B6B6B] leading-relaxed italic">
                      "{t.text}"
                    </p>
                  </div>

                  <p className="text-xs uppercase tracking-widest text-[#C9A96E] font-bold border-t border-[#F0EBEB] pt-4">
                    — {t.name}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#1A1A1A] text-white pt-20 pb-10 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 pb-16 border-b border-white/10">
            
            {/* Left section */}
            <div className="space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-3xl font-garamond font-bold text-[#C9A96E] tracking-widest">Charisma</h1>
                <p className="text-[10px] tracking-[0.35em] text-[#AAAAAA] uppercase">Beauty Studio</p>
              </div>
              <p className="font-lora italic text-[#AAAAAA] text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                "Where Beauty Becomes Art"
              </p>
            </div>

            {/* Center links */}
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C9A96E]">QUICK LINKS</p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-[#AAAAAA]">
                <a href="#services" className="hover:text-white transition-colors">Services</a>
                <a href="#gallery" className="hover:text-white transition-colors">Gallery</a>
                <a href="#book" className="hover:text-white transition-colors">Book Now</a>
              </div>
            </div>

            {/* Right details */}
            <div className="space-y-3 text-xs text-[#AAAAAA] font-inter text-center md:text-right max-w-xs mx-auto md:mr-0 md:ml-auto">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C9A96E] mb-2">CONTACT</p>
              <p className="flex items-center justify-center md:justify-end gap-2">
                📍 33 Lanark, Avondale, Harare
              </p>
              <p className="flex items-center justify-center md:justify-end gap-2">
                🕗 Mon-Sat: 8:30 - 17:30
              </p>
              <p className="flex items-center justify-center md:justify-end gap-2">
                📅 Sunday: Appointment Only
              </p>
              <p className="flex items-center justify-center md:justify-end gap-2 font-bold text-[#C9A96E]">
                📞 +263 777 554 619
              </p>
            </div>

          </div>

          {/* Bottom attribution */}
          <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#AAAAAA] gap-4">
            <p>© 2026 Charisma Beauty Studio. All rights reserved.</p>
            <p className="font-light">
              Site by <span className="text-[#C9A96E] font-medium">Tadiwa</span>
            </p>
          </div>
        </footer>

      </main>
    </div>
  );
}
