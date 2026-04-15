"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import {
  signInWithGoogle,
  signOut,
  handleRedirectResult,
  auth,
  onAuthStateChanged,
} from "../lib/auth";
import type { User } from "firebase/auth";
import Image from "next/image";

interface PriceAlert {
  id: string;
  from: string;
  to: string;
  targetPrice: number;
  setDate: string;
}

// Icons
const PlaneIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const PlaneRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(-90 12 12)" />
  </svg>
);

const SwapIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const MinusIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 12H4"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

// Ticket-shaped container with notch cutouts
const TicketCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Main card */}
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {children}
    </div>
    {/* Left notch */}
    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-[#E8F4FD] rounded-full" />
    {/* Right notch */}
    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-[#E8F4FD] rounded-full" />
  </div>
);

// Flight ticket card for results
const FlightTicketCard = ({ 
  airline, 
  airlineLogo,
  cabinClass,
  from, 
  to, 
  fromCity,
  toCity,
  duration, 
  stops, 
  price,
  departureTime,
  arrivalTime
}: { 
  airline: string;
  airlineLogo?: string;
  cabinClass: string;
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  duration: string;
  stops: number;
  price: number;
  departureTime: string;
  arrivalTime: string;
}) => (
  <div className="relative group">
    {/* Main ticket */}
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
      <div className="flex">
        {/* Left section - Airline info */}
        <div className="flex-1 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
            {airlineLogo ? (
              <Image src={airlineLogo} alt={airline} width={40} height={40} className="object-contain" />
            ) : (
              <PlaneRightIcon className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">{airline}</p>
            <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full mt-1">
              {cabinClass}
            </span>
          </div>
        </div>

        {/* Center section - Flight route */}
        <div className="flex-[2] p-5 flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{from}</p>
            <p className="text-xs text-muted">{fromCity}</p>
            <p className="text-sm font-medium text-foreground mt-1">{departureTime}</p>
          </div>
          
          {/* Flight path */}
          <div className="flex-1 flex items-center gap-2 px-4">
            <div className="h-0.5 flex-1 border-t-2 border-dashed border-gray-300" />
            <div className="relative">
              <PlaneRightIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="h-0.5 flex-1 border-t-2 border-dashed border-gray-300" />
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{to}</p>
            <p className="text-xs text-muted">{toCity}</p>
            <p className="text-sm font-medium text-foreground mt-1">{arrivalTime}</p>
          </div>
        </div>

        {/* Dashed divider */}
        <div className="w-px border-l-2 border-dashed border-gray-200 my-4" />

        {/* Right section - Price */}
        <div className="w-48 p-5 flex flex-col items-center justify-center bg-gray-50/50">
          <p className="text-sm text-muted mb-1">{duration} · {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}</p>
          <p className="text-3xl font-bold text-foreground">${price.toLocaleString()}</p>
          <button className="mt-3 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-primary/90 transition">
            Book Now
          </button>
        </div>
      </div>
    </div>
    {/* Left notch */}
    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-[#F0F4F8] rounded-full" />
    {/* Right notch (between main content and price) */}
    <div className="absolute right-48 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-dashed border-gray-200" style={{ clipPath: 'inset(0 50% 0 0)' }} />
  </div>
);

// Sample flight data
const sampleFlights = [
  {
    id: '1',
    airline: 'Turkish Airlines',
    airlineLogo: '/images/turkish.png',
    cabinClass: 'Economy',
    from: 'ICN',
    to: 'NRT',
    fromCity: 'Seoul',
    toCity: 'Tokyo',
    departureTime: '08:30',
    arrivalTime: '11:00',
    duration: '2h 30m',
    stops: 0,
    price: 289,
  },
  {
    id: '2',
    airline: 'Korean Air',
    airlineLogo: '/images/koreanair.png',
    cabinClass: 'Business',
    from: 'ICN',
    to: 'LAX',
    fromCity: 'Seoul',
    toCity: 'Los Angeles',
    departureTime: '13:45',
    arrivalTime: '09:20',
    duration: '11h 35m',
    stops: 0,
    price: 1249,
  },
  {
    id: '3',
    airline: 'Asiana Airlines',
    airlineLogo: '/images/asiana.png',
    cabinClass: 'Economy',
    from: 'ICN',
    to: 'CDG',
    fromCity: 'Seoul',
    toCity: 'Paris',
    departureTime: '10:15',
    arrivalTime: '16:30',
    duration: '12h 15m',
    stops: 1,
    price: 687,
  },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "multicity">("roundtrip");
  const [from, setFrom] = useState("ICN");
  const [fromCity, setFromCity] = useState("Seoul");
  const [to, setTo] = useState("NRT");
  const [toCity, setToCity] = useState("Tokyo");
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<"economy" | "premium_economy" | "business" | "first">("economy");
  const [showPassengerPopover, setShowPassengerPopover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [sortTab, setSortTab] = useState<"price" | "duration" | "ai">("price");
  const [priceChartData, setPriceChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertPrice, setAlertPrice] = useState("");
  const [matchedAlert, setMatchedAlert] = useState<PriceAlert | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showOffers, setShowOffers] = useState(true);

  useEffect(() => {
    handleRedirectResult().then((u) => {
      if (u) setUser(u);
    });
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedAlerts = localStorage.getItem("priceAlerts");
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch {
        console.error("Failed to load alerts");
      }
    }
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const swapLocations = () => {
    setFrom(to);
    setFromCity(toCity);
    setTo(from);
    setToCity(fromCity);
  };

  const handleSearch = async () => {
    if (!date) {
      setError("Please select a departure date");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    setMatchedAlert(null);
    setShowResults(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: from.trim().toUpperCase(),
          destination: to.trim().toUpperCase(),
          departureDate: date,
          adults: adults,
          children: children,
          infants: infants,
          cabinClass: cabinClass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("API error occurred");
        return;
      }
      const offers = data.offers || [];
      setResults(offers);
      if (offers.length > 0) {
        const minPrice = Math.min(...offers.map((o: any) => Number(o.price)));
        const match = alerts.find(
          (a) =>
            a.from === from.toUpperCase() &&
            a.to === to.toUpperCase() &&
            minPrice <= a.targetPrice
        );
        if (match) setMatchedAlert(match);
      }
    } catch {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (dep: string, arr: string) => {
    if (!dep || !arr) return Infinity;
    return new Date(arr).getTime() - new Date(dep).getTime();
  };

  const getSortedResults = () => {
    const sorted = [...results];
    if (sortTab === "price")
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortTab === "duration")
      return sorted.sort(
        (a, b) =>
          calculateDuration(a.departure, a.arrival) -
          calculateDuration(b.departure, b.arrival)
      );
    if (sortTab === "ai")
      return sorted.sort((a, b) => {
        if ((a.stops ?? 0) !== (b.stops ?? 0))
          return (a.stops ?? 0) - (b.stops ?? 0);
        return Number(a.price) - Number(b.price);
      });
    return sorted;
  };

  const handlePriceTrend = async () => {
    if (!date) return;
    setChartLoading(true);
    const chartData: any[] = [];
    const selectedDate = new Date(date);
    try {
      for (let i = -7; i <= 7; i++) {
        const checkDate = new Date(selectedDate);
        checkDate.setDate(checkDate.getDate() + i);
        const dateStr = checkDate.toISOString().split("T")[0];
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: from.trim().toUpperCase(),
            destination: to.trim().toUpperCase(),
            departureDate: dateStr,
            adults: adults,
          }),
        });
        const data = await res.json();
        if (res.ok && data.offers?.length > 0) {
          const minPrice = Math.min(
            ...data.offers.map((o: any) => Number(o.price))
          );
          chartData.push({
            date: new Date(dateStr).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            price: minPrice,
            fullDate: dateStr,
            isSelected: dateStr === date,
          });
        }
      }
      setPriceChartData(chartData);
    } catch {
    } finally {
      setChartLoading(false);
    }
  };

  const cheapestDatePoint =
    priceChartData.length > 0
      ? priceChartData.reduce((min, curr) =>
          Number(curr.price) < Number(min.price) ? curr : min
        )
      : null;

  const handleAddAlert = () => {
    if (!alertPrice || isNaN(Number(alertPrice))) return;
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      targetPrice: Number(alertPrice),
      setDate: new Date().toLocaleDateString("en-US"),
    };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    localStorage.setItem("priceAlerts", JSON.stringify(updated));
    setAlertPrice("");
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    localStorage.setItem("priceAlerts", JSON.stringify(updated));
  };

  const cheapestDirect = results
    .filter((f) => f.stops === 0)
    .reduce(
      (min: any, curr) =>
        !min || Number(curr.price) < Number(min.price) ? curr : min,
      null
    );
  const cheapestConnecting = results
    .filter((f) => (f.stops ?? 0) > 0)
    .reduce(
      (min: any, curr) =>
        !min || Number(curr.price) < Number(min.price) ? curr : min,
      null
    );

  const totalPassengers = adults + children + infants;

  const getCabinClassLabel = (cls: string) => {
    switch (cls) {
      case 'economy': return 'Economy';
      case 'premium_economy': return 'Premium';
      case 'business': return 'Business';
      case 'first': return 'First';
      default: return 'Economy';
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <PlaneIcon />
            </div>
            <span className="text-xl font-bold text-foreground">SmartFlight</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition">Home</a>
            <a href="#" className="text-sm font-medium text-muted hover:text-primary transition">Booking</a>
            <a href="#" className="text-sm font-medium text-muted hover:text-primary transition">Deals</a>
            <a href="#" className="text-sm font-medium text-muted hover:text-primary transition">Blog</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition">
              <GlobeIcon />
              <span className="hidden sm:inline">EN</span>
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName ?? ""}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="hidden sm:inline text-sm text-muted">
                  {user.displayName}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium hover:bg-gray-200 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/25"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Sky Background */}
      <section className="relative min-h-screen pt-16 overflow-hidden">
        {/* Sky gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #E8F4FD 0%, #F0F7FC 40%, #FFFFFF 100%)',
          }}
        />
        
        {/* Cloud shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute top-20 left-10 w-64 h-32 text-white/60" viewBox="0 0 200 100" fill="currentColor">
            <ellipse cx="50" cy="60" rx="50" ry="30" />
            <ellipse cx="100" cy="50" rx="60" ry="40" />
            <ellipse cx="150" cy="60" rx="50" ry="30" />
          </svg>
          <svg className="absolute top-32 right-20 w-80 h-40 text-white/50" viewBox="0 0 200 100" fill="currentColor">
            <ellipse cx="50" cy="60" rx="50" ry="30" />
            <ellipse cx="100" cy="50" rx="60" ry="40" />
            <ellipse cx="150" cy="60" rx="50" ry="30" />
          </svg>
          <svg className="absolute top-48 left-1/3 w-48 h-24 text-white/40" viewBox="0 0 200 100" fill="currentColor">
            <ellipse cx="50" cy="60" rx="50" ry="30" />
            <ellipse cx="100" cy="50" rx="60" ry="40" />
            <ellipse cx="150" cy="60" rx="50" ry="30" />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-12">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Smart Flight Finder
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Compare prices from hundreds of airlines and find the best deals for your next adventure
            </p>
          </div>

          {/* Airplane Image */}
          <div className="relative w-full flex justify-center mb-[-60px] z-10">
            <div 
              className="relative w-[500px] h-[200px]"
              style={{
                filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.15))',
              }}
            >
              <Image
                src="https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=900&auto=format&fit=crop&q=80"
                alt="Airplane"
                fill
                className="object-contain"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                }}
                priority
              />
            </div>
          </div>

          {/* Trip Type Pills */}
          <div className="flex justify-center gap-2 mb-4 relative z-20">
            {[
              { value: "oneway", label: "One Way" },
              { value: "roundtrip", label: "Round Trip" },
              { value: "multicity", label: "Multi City" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setTripType(type.value as any)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
                  tripType === type.value
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-white text-muted hover:text-foreground border border-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Ticket-Shaped Search Panel */}
          <TicketCard className="relative z-20">
            <div className="flex flex-col md:flex-row">
              {/* Left Section: FROM */}
              <div className="flex-1 p-6 md:pl-10">
                <div className="space-y-4">
                  {/* From */}
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wide">From</label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        value={from}
                        onChange={(e) => setFrom(e.target.value.toUpperCase())}
                        className="text-3xl font-bold text-foreground bg-transparent outline-none w-20"
                        placeholder="ICN"
                        maxLength={3}
                      />
                      <input
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        className="text-sm text-muted bg-transparent outline-none flex-1"
                        placeholder="Seoul, Korea"
                      />
                    </div>
                  </div>
                  {/* Date */}
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wide">Departure</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="text-foreground bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  {/* Passengers */}
                  <div className="relative">
                    <label className="text-xs font-medium text-muted uppercase tracking-wide">Passengers</label>
                    <button
                      type="button"
                      onClick={() => setShowPassengerPopover(!showPassengerPopover)}
                      className="flex items-center gap-2 mt-1 text-foreground"
                    >
                      <UserIcon />
                      <span className="text-sm">
                        {totalPassengers} Passenger{totalPassengers > 1 ? "s" : ""}
                      </span>
                      <ChevronDownIcon />
                    </button>
                    
                    {/* Passenger Popover */}
                    {showPassengerPopover && (
                      <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-4 space-y-4 w-64">
                        {/* Adults */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Adults</p>
                            <p className="text-xs text-muted">12+ years</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              disabled={adults <= 1}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <MinusIcon />
                            </button>
                            <span className="w-6 text-center font-medium text-foreground">{adults}</span>
                            <button
                              type="button"
                              onClick={() => setAdults(Math.min(9, adults + 1))}
                              disabled={adults >= 9}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <PlusIcon />
                            </button>
                          </div>
                        </div>
                        
                        {/* Children */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Children</p>
                            <p className="text-xs text-muted">2-11 years</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setChildren(Math.max(0, children - 1))}
                              disabled={children <= 0}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <MinusIcon />
                            </button>
                            <span className="w-6 text-center font-medium text-foreground">{children}</span>
                            <button
                              type="button"
                              onClick={() => setChildren(Math.min(9, children + 1))}
                              disabled={children >= 9}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <PlusIcon />
                            </button>
                          </div>
                        </div>
                        
                        {/* Infants */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Infants</p>
                            <p className="text-xs text-muted">Under 2 years</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setInfants(Math.max(0, infants - 1))}
                              disabled={infants <= 0}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <MinusIcon />
                            </button>
                            <span className="w-6 text-center font-medium text-foreground">{infants}</span>
                            <button
                              type="button"
                              onClick={() => setInfants(Math.min(adults, infants + 1))}
                              disabled={infants >= adults}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <PlusIcon />
                            </button>
                          </div>
                        </div>
                        
                        {/* Done Button */}
                        <button
                          type="button"
                          onClick={() => setShowPassengerPopover(false)}
                          className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Divider with Plane */}
              <div className="flex flex-col items-center justify-center px-4 py-6">
                <div className="h-full border-l-2 border-dashed border-gray-300 relative">
                  <button
                    onClick={swapLocations}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary/90 transition"
                  >
                    <PlaneRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right Section: TO */}
              <div className="flex-1 p-6 md:pr-10">
                <div className="space-y-4">
                  {/* To */}
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wide">To</label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        value={to}
                        onChange={(e) => setTo(e.target.value.toUpperCase())}
                        className="text-3xl font-bold text-foreground bg-transparent outline-none w-20"
                        placeholder="NRT"
                        maxLength={3}
                      />
                      <input
                        value={toCity}
                        onChange={(e) => setToCity(e.target.value)}
                        className="text-sm text-muted bg-transparent outline-none flex-1"
                        placeholder="Tokyo, Japan"
                      />
                    </div>
                  </div>
                  {/* Return Date */}
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wide">
                      {tripType === "roundtrip" ? "Return" : "Flexible"}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon />
                      {tripType === "roundtrip" ? (
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="text-foreground bg-transparent outline-none"
                        />
                      ) : (
                        <span className="text-muted text-sm">Add return</span>
                      )}
                    </div>
                  </div>
                  {/* Cabin Class */}
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wide">Cabin Class</label>
                    <div className="relative mt-1">
                      <select
                        value={cabinClass}
                        onChange={(e) => setCabinClass(e.target.value as any)}
                        className="text-foreground bg-transparent outline-none appearance-none cursor-pointer pr-6"
                      >
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                      </select>
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Button - Barcode Strip Style */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-semibold text-lg flex items-center justify-center gap-3 hover:bg-primary/90 transition disabled:opacity-50"
              style={{
                borderBottomLeftRadius: '1rem',
                borderBottomRightRadius: '1rem',
              }}
            >
              {loading ? (
                "Searching..."
              ) : (
                <>
                  Search Flights
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </TicketCard>

          {error && (
            <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Destinations" },
              { value: "50M+", label: "Happy Travelers" },
              { value: "200+", label: "Airlines" },
              { value: "4.9", label: "User Rating" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Flights Section */}
      {!showResults && (
        <section className="py-20 bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto px-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-foreground">
                Choose Your Perfect Flight
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">Show Offers</span>
                <button
                  onClick={() => setShowOffers(!showOffers)}
                  className={`relative w-12 h-6 rounded-full transition ${showOffers ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${showOffers ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Flight Cards */}
            <div className="space-y-4">
              {sampleFlights.map((flight) => (
                <FlightTicketCard
                  key={flight.id}
                  airline={flight.airline}
                  cabinClass={flight.cabinClass}
                  from={flight.from}
                  to={flight.to}
                  fromCity={flight.fromCity}
                  toCity={flight.toCity}
                  departureTime={flight.departureTime}
                  arrivalTime={flight.arrivalTime}
                  duration={flight.duration}
                  stops={flight.stops}
                  price={flight.price}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search Results */}
      {showResults && (
        <section className="py-16 bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto px-6">
            {results.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {results.length} Flights Found
                </h2>

                {matchedAlert && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium text-center">
                    Target price reached! {matchedAlert.from} to {matchedAlert.to} - Current lowest: $
                    {Math.min(
                      ...results.map((o: any) => Number(o.price))
                    ).toLocaleString()}{" "}
                    USD
                  </div>
                )}

                {/* Direct vs Connecting Comparison */}
                {(cheapestDirect || cheapestConnecting) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
                      Direct vs Connecting
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {cheapestDirect && (
                        <div className="bg-white rounded-xl p-5 border border-primary/30 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <PlaneIcon />
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              Direct Flight
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-foreground">
                            ${Number(cheapestDirect.price).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted mt-1">
                            {cheapestDirect.airline}
                          </p>
                          <p className="text-sm text-foreground mt-2">
                            {cheapestDirect.departure?.slice(11, 16)} →{" "}
                            {cheapestDirect.arrival?.slice(11, 16)}
                          </p>
                        </div>
                      )}
                      {cheapestConnecting && (
                        <div className="bg-white rounded-xl p-5 border border-amber-300/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <SwapIcon />
                            </div>
                            <span className="text-sm font-semibold text-amber-600">
                              {cheapestConnecting.stops} Stop
                              {cheapestConnecting.stops > 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-foreground">
                            ${Number(cheapestConnecting.price).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted mt-1">
                            {cheapestConnecting.airline}
                          </p>
                          <p className="text-sm text-foreground mt-2">
                            {cheapestConnecting.departure?.slice(11, 16)} →{" "}
                            {cheapestConnecting.arrival?.slice(11, 16)}
                          </p>
                        </div>
                      )}
                    </div>
                    {cheapestDirect && cheapestConnecting && (
                      <div
                        className={`text-center py-3 rounded-xl text-sm font-semibold ${
                          Number(cheapestDirect.price) <=
                          Number(cheapestConnecting.price)
                            ? "bg-primary/10 text-primary"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {Number(cheapestDirect.price) <=
                        Number(cheapestConnecting.price)
                          ? "Direct flight is cheaper!"
                          : `Save $${(
                              Number(cheapestDirect.price) -
                              Number(cheapestConnecting.price)
                            ).toLocaleString()} with connecting flight!`}
                      </div>
                    )}
                  </div>
                )}

                {/* Sort Tabs */}
                <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200">
                  {(["price", "duration", "ai"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSortTab(tab)}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                        sortTab === tab
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {tab === "price"
                        ? "Lowest Price"
                        : tab === "duration"
                        ? "Shortest"
                        : "AI Recommended"}
                    </button>
                  ))}
                </div>

                {/* Results List as Ticket Cards */}
                <div className="space-y-4">
                  {getSortedResults().map((offer) => (
                    <FlightTicketCard
                      key={offer.id}
                      airline={offer.airline ?? "Unknown Airline"}
                      cabinClass={getCabinClassLabel(cabinClass)}
                      from={from}
                      to={to}
                      fromCity={fromCity}
                      toCity={toCity}
                      departureTime={offer.departure?.slice(11, 16) ?? '--:--'}
                      arrivalTime={offer.arrival?.slice(11, 16) ?? '--:--'}
                      duration={`${Math.floor(calculateDuration(offer.departure, offer.arrival) / 3600000)}h ${Math.floor((calculateDuration(offer.departure, offer.arrival) % 3600000) / 60000)}m`}
                      stops={offer.stops ?? 0}
                      price={Number(offer.price)}
                    />
                  ))}
                </div>

                {/* Price Trend Button */}
                <button
                  onClick={handlePriceTrend}
                  disabled={chartLoading}
                  className="w-full py-3 rounded-xl bg-white border border-gray-200 text-foreground text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {chartLoading ? "Loading price trends..." : "View Price Trends"}
                </button>

                {/* Price Chart */}
                {priceChartData.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Price Trends (±7 days)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={priceChartData}>
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          style={{ fontSize: "12px" }}
                        />
                        <YAxis
                          stroke="#64748b"
                          style={{ fontSize: "12px" }}
                          label={{
                            value: "USD",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value) =>
                            `$${Number(value).toLocaleString()}`
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ fill: "#2563eb", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        {priceChartData.map((point) =>
                          point.isSelected ? (
                            <ReferenceDot
                              key={point.fullDate}
                              x={point.date}
                              y={point.price}
                              r={6}
                              fill="#0ea5e9"
                              stroke="#0891b2"
                              strokeWidth={2}
                            />
                          ) : null
                        )}
                        {cheapestDatePoint && !cheapestDatePoint.isSelected && (
                          <ReferenceDot
                            x={cheapestDatePoint.date}
                            y={cheapestDatePoint.price}
                            r={6}
                            fill="#10b981"
                            stroke="#059669"
                            strokeWidth={2}
                            label={{
                              value: "Best",
                              position: "top",
                              fill: "#10b981",
                              fontSize: 12,
                            }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Price Alert */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Set Price Alert
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      placeholder="Target price (USD)"
                      className="flex-1 p-3 rounded-xl bg-gray-50 text-foreground border border-gray-200 placeholder-gray-400 outline-none focus:border-primary transition"
                    />
                    <button
                      onClick={handleAddAlert}
                      disabled={!alertPrice}
                      className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      Set Alert
                    </button>
                  </div>
                  {alerts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted uppercase tracking-wide">
                        Active Alerts ({alerts.length})
                      </p>
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {alert.from} → {alert.to}
                            </p>
                            <p className="text-xs text-muted">
                              ${alert.targetPrice} USD · {alert.setDate}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : !loading ? (
              <div className="text-center py-12">
                <p className="text-muted">No flights found. Try different dates or destinations.</p>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <PlaneIcon />
              </div>
              <span className="text-xl font-bold text-foreground">SmartFlight</span>
            </div>
            <p className="text-sm text-muted">
              © 2026 SmartFlight. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
