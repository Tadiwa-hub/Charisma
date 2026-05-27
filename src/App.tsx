import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  Home, 
  Sparkles, 
  Calendar, 
  Info, 
  MapPin, 
  Car, 
  ChevronRight, 
  Star, 
  Camera, 
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  AlertCircle
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
}

interface Addon {
  id: string;
  name: string;
  price: number;
  description?: string;
}

// --- Data ---
const SERVICES: Service[] = [
  { id: 'm-artist', name: 'Makeup by Studio Artist', price: 35, category: 'SERVICES', description: 'Professional studio artist', image: m2 },
  { id: 'studio-artists-combo', name: 'Studio Artists Combo (Hair + Makeup) $60', price: 60, category: 'SERVICES', description: 'Combo styling for hair and makeup', image: m3 },
  { id: 'brow-service', name: 'Brow Service $100', price: 100, category: 'SERVICES', description: 'Perfectly shaped brows', image: m4 },
  { id: 'manicure-pedicure', name: 'Manicure/Pedicure from $15', price: 15, category: 'SERVICES', description: 'Nails and pampering services', image: m5 },
  { id: 'makeup-classes', name: 'Makeup Classes from $150', price: 150, category: 'SERVICES', description: 'Learn expert makeup techniques', image: m6 },
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
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
          Loading admin portal…
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

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

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
  const subtotal = (selectedService?.price || 0) + addonsTotal;
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

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || selectedDateStatus === 'fully_booked') return;

    const message = `Hello Charisma Beauty Studio! I'd like to book ${selectedService?.name} on ${formData.date}. Name: ${formData.name}. Phone: ${formData.phone}. Special requests: ${formData.notes || 'None'}. I will send proof of $10 deposit payment.`;
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
      setBookingError('Unable to save booking to the backend. The form will still open WhatsApp.');
    } finally {
      setSubmittingBooking(false);
      window.location.assign(whatsappUrl);
    }
  };

  const handleQuickInquiry = () => {
    const message = "Hello Charisma! I'm interested in booking a session. Could you please provide more information?";
    window.open(`https://wa.me/263739480224?text=${encodeURIComponent(message)}`, '_blank');
  };

  const isFormValid = !!(selectedService && 
                     policyAccepted && 
                     formData.name && 
                     formData.phone &&
                     formData.date && 
                     formData.time && 
                     formData.eventType);

  // --- Render Helpers ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-luxury-black flex items-center justify-center overflow-hidden z-[100]">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-rose-gold opacity-30 transform -translate-y-1/2 overflow-hidden">
          <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-champagne to-transparent" />
        </div>
        <h1 className="text-4xl md:text-6xl font-garamond text-champagne animate-pulse tracking-widest uppercase">
          Charisma
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black text-soft-white font-inter selection:bg-rose-gold selection:text-white">
      {/* --- Floating WhatsApp Button --- */}
      <button 
        onClick={handleQuickInquiry}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all rose-gold-glow group"
        aria-label="WhatsApp Inquiry"
      >
        <WhatsAppIcon size={28} />
        <span className="absolute right-full mr-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Quick Inquiry
        </span>
      </button>

      {/* --- Background Particles --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-champagne rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.2
            }}
          />
        ))}
      </div>

      {/* --- Desktop Nav --- */}
      <nav className="hidden md:flex fixed top-0 w-full glass-effect z-50 px-8 py-4 justify-between items-center border-b border-rose-gold/10">
        <div>
          <h1 className="text-3xl font-garamond text-champagne tracking-tighter">CHARISMA</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-rose-gold -mt-1">Beauty. Redefined.</p>
        </div>
        <div className="flex gap-8 text-sm uppercase tracking-widest text-soft-white/70">
          <a href="#home" className="hover:text-champagne transition-colors">Home</a>
          <a href="#services" className="hover:text-champagne transition-colors">Services</a>
          <a href="#book" className="hover:text-champagne transition-colors">Book</a>
          <a href="#policy" className="hover:text-champagne transition-colors">Policy</a>
        </div>
      </nav>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="md:hidden fixed bottom-0 w-full glass-effect-bottom z-50 px-6 py-3 flex justify-between items-center">
        <a href="#home" className="flex flex-col items-center gap-1 text-rose-gold">
          <Home size={20} />
          <span className="text-[10px] uppercase tracking-tighter">Home</span>
        </a>
        <a href="#services" className="flex flex-col items-center gap-1 text-soft-white/60">
          <Sparkles size={20} />
          <span className="text-[10px] uppercase tracking-tighter">Services</span>
        </a>
        <a href="#book" className="flex flex-col items-center gap-1 text-soft-white/60">
          <Calendar size={20} />
          <span className="text-[10px] uppercase tracking-tighter">Book</span>
        </a>
        <a href="#policy" className="flex flex-col items-center gap-1 text-soft-white/60">
          <Info size={20} />
          <span className="text-[10px] uppercase tracking-tighter">Policy</span>
        </a>
      </nav>

      {/* --- Main Content --- */}
      <main className="relative z-10 pb-24 md:pb-12 pt-0 md:pt-20">
        
        {/* HERO SECTION */}
        <section id="home" className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroBg} 
              alt="Luxury Beauty" 
              className="w-full h-full object-cover opacity-40 scale-110 animate-[pulse_8s_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-luxury-black via-transparent to-luxury-black" />
          </div>
          
          <div className="relative z-10 animate-fade-in space-y-6">
            <h2 className="text-5xl md:text-8xl font-garamond leading-tight">
              YOUR MOST <br />
              <span className="italic text-champagne">BEAUTIFUL SELF</span> <br />
              AWAITS
            </h2>
            <p className="text-rose-gold tracking-[0.2em] text-sm md:text-lg uppercase">
              Luxury Makeup Studio — Avondale, Harare
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
              <a href="#book" className="px-8 py-4 bg-rose-gold text-white rounded-sm font-medium tracking-widest uppercase hover:bg-rose-gold/80 transition-all rose-gold-glow">
                Book Your Session
              </a>
              <a href="#services" className="px-8 py-4 border border-rose-gold text-rose-gold rounded-sm font-medium tracking-widest uppercase hover:bg-rose-gold/10 transition-all">
                View Services
              </a>
            </div>
          </div>
        </section>

        {/* LOCATION TOGGLE */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white/5 p-2 rounded-full flex gap-1 mb-6 border border-white/10">
            <button 
              onClick={() => setLocation('studio')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all ${location === 'studio' ? 'bg-rose-gold text-white shadow-lg' : 'text-soft-white/50 hover:text-soft-white'}`}
            >
              <MapPin size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Studio Session</span>
            </button>
            <button 
              onClick={() => setLocation('house_call')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all ${location === 'house_call' ? 'bg-rose-gold text-white shadow-lg' : 'text-soft-white/50 hover:text-soft-white'}`}
            >
              <Car size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">House Call</span>
            </button>
          </div>

          {location === 'house_call' && (
            <div className="bg-rose-gold/10 border border-rose-gold/30 p-4 rounded-lg flex items-start gap-3 animate-fade-in">
              <Sparkles className="text-rose-gold shrink-0" size={20} />
              <p className="text-xs text-rose-gold leading-relaxed">
                ✨ <span className="font-bold">House Call Selected</span> — An additional travel fee from $50 applies depending on your location.
              </p>
            </div>
          )}
        </section>

        {/* SERVICES CATALOGUE */}
        <section id="services" className="max-w-4xl mx-auto px-6 py-12">
          <h3 className="text-3xl font-garamond text-champagne mb-8 tracking-widest uppercase text-center">Catalogue</h3>
          
          {['MAKEUP', 'INSTALLATION & COMBOS', 'ADD-ONS'].map((cat) => (
            <div key={cat} className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <h4 className="text-xs tracking-[0.3em] text-rose-gold uppercase whitespace-nowrap">{cat}</h4>
                <div className="h-[1px] w-full bg-rose-gold/20" />
              </div>
              
              <div className="grid gap-6">
                {(cat === 'ADD-ONS' ? ADDONS : SERVICES.filter(s => s.category === cat)).map((item) => {
                  const isSelected = cat === 'ADD-ONS' 
                    ? selectedAddons.some(a => a.id === item.id)
                    : selectedService?.id === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (cat === 'ADD-ONS') {
                          toggleAddon(item as Addon);
                        } else {
                          setSelectedService(item as Service);
                          // Auto-scroll to form on mobile for better UX
                          if (window.innerWidth < 768) {
                            document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                      className={`group relative overflow-hidden text-left transition-all border ${isSelected ? 'rose-gold-border bg-rose-gold/5' : 'border-white/5 hover:border-rose-gold/30 hover:bg-white/5'}`}
                    >
                      <div className="flex flex-col md:flex-row">
                        {'image' in item && (item as Service).image && (
                          <div className="w-full md:w-32 h-48 md:h-auto shrink-0 overflow-hidden">
                            <img src={(item as Service).image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className={`text-lg mb-1 transition-colors ${isSelected ? 'text-rose-gold' : 'text-soft-white'}`}>
                                {item.name}
                              </h5>
                              {'description' in item && (
                                <p className="text-xs text-soft-white/50">{item.description}</p>
                              )}
                            </div>
                            <p className="text-champagne font-garamond text-xl">
                              {typeof item.price === 'string' ? item.price : `$${item.price}`}
                            </p>
                          </div>
                          
                          <div className={`mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest transition-opacity ${isSelected ? 'opacity-100 text-rose-gold' : 'opacity-0 group-hover:opacity-100 text-soft-white/40'}`}>
                            {cat === 'ADD-ONS' ? (isSelected ? 'Added to booking' : 'Add to booking') : (isSelected ? 'Selected' : 'Select')}
                            <ChevronRight size={12} />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* DYNAMIC PRICE CALCULATOR */}
        <section className="max-w-4xl mx-auto px-6 py-12 relative md:static">
          <div className="bg-luxury-black/90 backdrop-blur-xl border border-rose-gold/50 p-6 md:p-8 rose-gold-glow md:sticky md:top-24 z-20">
            <h4 className="text-xs tracking-[0.4em] text-rose-gold uppercase mb-6 text-center">ESTIMATED TOTAL</h4>
            
            <div className="space-y-4 text-sm font-light">
              <div className="flex justify-between items-center text-soft-white/60">
                <span>Service: {selectedService?.name || 'None selected'}</span>
                <span>${selectedService?.price || 0}</span>
              </div>
              
              {selectedAddons.length > 0 && (
                <div className="flex justify-between items-start text-soft-white/60">
                  <div className="flex flex-col">
                    <span>Add-ons:</span>
                    <span className="text-[10px] leading-tight mt-1">{selectedAddons.map(a => a.name).join(', ')}</span>
                  </div>
                  <span>${addonsTotal}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-soft-white/60">
                <span>Location: {location === 'studio' ? 'Studio' : 'House Call'}</span>
                <span>+${travelFee}</span>
              </div>
              
              <div className="h-[1px] w-full bg-rose-gold/30 my-4" />
              
              <div className="flex justify-between items-center text-2xl font-garamond text-champagne">
                <span>Total Amount</span>
                <span className="rose-gold-text-glow">${total}</span>
              </div>
            </div>
          </div>
        </section>

        {/* BOOKING POLICY */}
        <section id="policy" className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-rose-gold/5 border-2 border-rose-gold/40 p-8 rounded-sm text-center space-y-4 rose-gold-glow">
            <h4 className="text-2xl font-garamond text-champagne tracking-widest">BOOKING POLICY</h4>
            <div className="h-[1px] w-24 bg-rose-gold/40 mx-auto" />
            <p className="text-sm text-soft-white/80 leading-relaxed max-w-lg mx-auto italic">
              "NB: A non-refundable deposit of <span className="text-rose-gold font-bold">$10</span> is required to secure your appointment. This confirms your slot and is deducted from your total on the day."
            </p>
            <label className="flex items-center justify-center gap-3 cursor-pointer group pt-4">
              <input 
                type="checkbox" 
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="hidden" 
              />
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${policyAccepted ? 'bg-rose-gold border-rose-gold' : 'border-rose-gold/50 group-hover:border-rose-gold'}`}>
                {policyAccepted && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className={`text-[10px] uppercase tracking-widest transition-colors ${policyAccepted ? 'text-soft-white' : 'text-rose-gold'}`}>
                {policyAccepted ? 'I have read and understood the booking policy' : 'Confirm acceptance of policy *'}
              </span>
            </label>
          </div>
        </section>

        {/* BOOKING FORM */}
        <section id="book" className="max-w-4xl mx-auto px-6 py-12">
          <form onSubmit={handleBooking} className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-garamond text-champagne tracking-widest uppercase mb-2">Secure Your Slot</h3>
              <p className="text-[10px] text-rose-gold uppercase tracking-[0.2em]">Complete the details below</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* --- Service Selection Dropdown --- */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-rose-gold flex items-center gap-2">
                  <Sparkles size={12} /> Selected Service <span className="text-rose-gold/50">*</span>
                </label>
                <select 
                  required
                  value={selectedService?.id || ''}
                  onChange={(e) => {
                    const s = SERVICES.find(serv => serv.id === e.target.value);
                    if (s) setSelectedService(s);
                  }}
                  className={`w-full bg-white/5 border p-4 rounded-sm outline-none transition-all text-sm appearance-none cursor-pointer ${selectedService ? 'border-white/10' : 'border-rose-gold/50'}`}
                >
                  <option value="" disabled className="bg-luxury-black">Choose a service</option>
                  {SERVICES.map(s => (
                    <option key={s.id} value={s.id} className="bg-luxury-black">{s.name} — ${s.price}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-rose-gold flex items-center gap-2">
                  <User size={12} /> Full Name <span className="text-rose-gold/50">*</span>
                </label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your name"
                  className={`w-full bg-white/5 border p-4 rounded-sm outline-none transition-all text-sm placeholder:text-white/20 ${formData.name ? 'border-white/10' : 'border-rose-gold/50'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-rose-gold flex items-center gap-2">
                  <User size={12} /> Phone Number <span className="text-rose-gold/50">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className={`w-full bg-white/5 border p-4 rounded-sm outline-none transition-all text-sm placeholder:text-white/20 ${formData.phone ? 'border-white/10' : 'border-rose-gold/50'}`}
                />
              </div>

              {/* --- Location Display --- */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-rose-gold flex items-center gap-2">
                  <MapPin size={12} /> Booking Location
                </label>
                <div className="w-full bg-white/5 border border-white/10 p-4 rounded-sm text-sm text-soft-white flex justify-between items-center opacity-80">
                  <span>{location === 'studio' ? 'Studio Session (Avondale)' : 'House Call'}</span>
                  <span className="text-[10px] text-rose-gold font-bold">{location === 'house_call' ? '+$50 Travel Fee' : 'Standard'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-rose-gold flex items-center gap-2">
                  <Sparkles size={12} /> Event Type <span className="text-rose-gold/50">*</span>
                </label>
                <select 
                  required
                  value={formData.eventType}
                  onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                  className={`w-full bg-white/5 border p-4 rounded-sm outline-none transition-all text-sm appearance-none cursor-pointer ${formData.eventType ? 'border-white/10' : 'border-rose-gold/50'}`}
                >
                  <option value="" disabled className="bg-luxury-black">Select event type</option>
                  <option value="Wedding" className="bg-luxury-black">Wedding</option>
                  <option value="Birthday" className="bg-luxury-black">Birthday</option>
                  <option value="Photo Session" className="bg-luxury-black">Photo Session</option>
                  <option value="Gala / Formal" className="bg-luxury-black">Gala / Formal</option>
                  <option value="Casual / Soft Glam" className="bg-luxury-black">Casual / Soft Glam</option>
                  <option value="Other" className="bg-luxury-black">Other</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-rose-gold flex items-center gap-2">
                    <Calendar size={12} /> Preferred Date <span className="text-rose-gold/50">*</span>
                  </label>
                  <span className="text-[10px] text-slate-300">Swipe or tap a date</span>
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
                  <p className="mt-3 text-sm text-rose-300">{availabilityError}</p>
                )}
                {formData.date && (
                  <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                    selectedDateStatus === 'fully_booked'
                      ? 'border-rose-200 bg-rose-50 text-rose-900'
                      : selectedDateStatus === 'appointment_only'
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  }`}>
                    {selectedDateStatus === 'fully_booked' && 'This date is fully booked and cannot be selected.'}
                    {selectedDateStatus === 'appointment_only' && 'Sundays are appointment-only. You will receive manual confirmation.'}
                    {selectedDateStatus === 'open' && 'This date is available to book.'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-rose-gold flex items-center gap-2">
                  <Clock size={12} /> Preferred Time <span className="text-rose-gold/50">*</span>
                </label>
                <input 
                  required
                  type="time" 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className={`w-full bg-white/5 border p-4 rounded-sm outline-none transition-all text-sm [color-scheme:dark] ${formData.time ? 'border-white/10' : 'border-rose-gold/50'}`}
                />
              </div>
            </div>
            
            <div className="rounded-3xl border border-rose-gold/30 bg-rose-gold/5 p-5 text-sm text-rose-900">
              <p className="font-semibold">💳 Booking Deposit Required</p>
              <p className="mt-2">To secure your appointment pay $10 (non-refundable).</p>
              <p className="mt-2">EcoCash USD / InnBucks:</p>
              <p className="font-semibold">+263 777554619 (Tessa Masawi)</p>
              <p className="mt-3">Send proof of payment with your booking request on WhatsApp.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-rose-gold flex items-center gap-2">
                <MessageSquare size={12} /> Additional Notes
              </label>
              <textarea 
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any skin allergies or special requests?"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-sm focus:border-rose-gold outline-none transition-all text-sm placeholder:text-white/20 resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={!isFormValid || selectedDateStatus === 'fully_booked' || submittingBooking}
              className={`w-full py-6 rounded-sm font-bold tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 ${
                isFormValid && selectedDateStatus !== 'fully_booked' && !submittingBooking
                  ? 'bg-[#25D366] text-white shadow-[0_0_20px_rgba(37,211,102,0.4)] animate-pulse hover:brightness-110 active:scale-[0.98]' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              }`}
            >
              <WhatsAppIcon size={20} />
              {submittingBooking ? 'Saving & Opening WhatsApp…' : 'Book via WhatsApp'}
            </button>
            
            {bookingError && (
              <div className="bg-rose-gold/5 p-4 rounded-sm border border-rose-gold/20 mt-4">
                <p className="text-[10px] text-center text-rose-gold uppercase tracking-widest">{bookingError}</p>
              </div>
            )}
            {!isFormValid && (
              <div className="bg-rose-gold/5 p-4 rounded-sm border border-rose-gold/20 animate-pulse mt-4">
                <p className="text-[10px] text-center text-rose-gold uppercase tracking-widest flex items-center justify-center gap-2">
                  <AlertCircle size={10} /> Please complete all required fields (*) and accept policy
                </p>
              </div>
            )}
          </form>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-4xl mx-auto px-6 py-24 bg-white/2">
          <h3 className="text-3xl font-garamond text-champagne text-center tracking-widest uppercase mb-16 underline underline-offset-8 decoration-rose-gold/30">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Select Service", text: "Choose your professional makeup service and any add-ons." },
              { step: "02", title: "Pick Date", text: "Choose your preferred date and session location." },
              { step: "03", title: "Confirm", text: "Pay your deposit and you're officially booked!" },
            ].map((s) => (
              <div key={s.step} className="text-center space-y-4">
                <span className="text-6xl font-garamond text-rose-gold/10 block leading-none">{s.step}</span>
                <h5 className="text-xl text-champagne uppercase tracking-widest font-garamond -mt-8">{s.title}</h5>
                <p className="text-sm text-soft-white/50 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GALLERY */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-garamond text-champagne tracking-widest uppercase mb-4">Gallery</h3>
            <p className="text-xs text-rose-gold tracking-widest uppercase">Curated Portfoilo</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {GALLERY.map((img, i) => (
              <div key={i} className="aspect-[3/4] overflow-hidden border border-white/10 group">
                <img 
                  src={img} 
                  alt={`Charisma Look ${i+1}`} 
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" 
                />
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a href="#" className="inline-flex items-center gap-2 text-rose-gold hover:text-champagne transition-colors">
              <Camera size={20} />
              <span className="text-xs tracking-widest uppercase font-bold">Follow our latest looks</span>
            </a>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="max-w-4xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white/2 border border-rose-gold/20 p-8 space-y-4 hover:border-rose-gold/50 transition-colors">
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={12} className="fill-rose-gold text-rose-gold" />)}
                </div>
                <p className="text-sm italic text-soft-white/80 leading-relaxed">"{t.text}"</p>
                <p className="text-[10px] uppercase tracking-widest text-rose-gold font-bold">— {t.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="max-w-4xl mx-auto px-6 py-24 border-t border-white/5 text-center space-y-8">
          <div>
            <h1 className="text-4xl font-garamond text-rose-gold tracking-widest">CHARISMA</h1>
            <p className="text-xs tracking-[0.4em] text-soft-white/40 uppercase mt-2">Beauty. Redefined.</p>
          </div>
          
          <div className="space-y-4 text-xs tracking-widest text-soft-white/60">
            <p className="flex items-center justify-center gap-2">
              <MapPin size={12} className="text-rose-gold" /> Avondale, Harare
            </p>
            <p className="flex items-center justify-center gap-2">
              <Clock size={12} className="text-rose-gold" /> Mon - Sat: 9AM - 6PM
            </p>
          </div>

          <div className="pt-12 space-y-4">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">
              Site by Tadiwa
            </p>
            <div className="flex justify-center gap-6">
              <a href="#" className="text-white/40 hover:text-rose-gold transition-colors"><Camera size={18} /></a>
              <a href="#" className="text-white/40 hover:text-rose-gold transition-colors"><MessageSquare size={18} /></a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
