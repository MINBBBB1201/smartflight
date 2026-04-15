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

const destinations = [
  {
    city: "Tokyo",
    country: "Japan",
    image: "/images/tokyo.jpg",
    dates: "Mar 15 - Mar 22",
    price: 489,
  },
  {
    city: "Paris",
    country: "France",
    image: "/images/paris.jpg",
    dates: "Apr 10 - Apr 17",
    price: 599,
  },
  {
    city: "Bali",
    country: "Indonesia",
    image: "/images/bali.jpg",
    dates: "May 5 - May 12",
    price: 449,
  },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "multicity">(
    "roundtrip"
  );
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
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
                  className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium hover:bg-border/50 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/25"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

{/* Hero Section */}
        <section className="relative min-h-[90vh] pt-16 overflow-hidden">
          {/* Clean light gradient background: #F0F4F8 to #FFFFFF */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #F0F4F8 0%, #FFFFFF 50%, #F8FAFC 100%)',
            }}
          />
        
          <div className="relative max-w-7xl mx-auto px-6 pt-20 lg:pt-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline */}
            <div className="space-y-6">
              <h1 className="text-balance">
                <span className="block text-4xl md:text-5xl lg:text-6xl font-light text-foreground/80 leading-tight">
                  Discover New
                </span>
                <span className="block text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight">
                  <span className="text-primary">Horizons</span> Today
                </span>
              </h1>
              <p className="text-lg text-muted max-w-md leading-relaxed">
                Find the best flight deals worldwide and start your next adventure with confidence. Smart search, better prices.
              </p>
            </div>
            
{/* Right: Airplane Image with CSS Mask Fade - No container box */}
            <div 
              className="relative lg:absolute lg:right-[-5%] lg:top-1/2 lg:-translate-y-1/2 lg:w-[60%] lg:h-[700px] pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 30%), linear-gradient(to top, transparent 0%, black 25%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%), linear-gradient(to top, transparent 0%, black 25%)',
                maskComposite: 'intersect',
                WebkitMaskComposite: 'destination-in',
              }}
            >
              <Image
                src="/images/airplane-hero.jpg"
                alt="Airplane floating in the sky"
                fill
                className="object-contain object-center lg:object-right scale-105"
                style={{
                  filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.12))',
                }}
                priority
              />
            </div>
          </div>
        </div>

        {/* Search Panel */}
        <div className="relative max-w-5xl mx-auto px-6 mt-12 lg:mt-16">
          <div className="bg-card rounded-2xl shadow-xl shadow-foreground/5 p-6 border border-border/50">
            {/* Trip Type Toggle */}
            <div className="flex gap-2 mb-6">
              {[
                { value: "oneway", label: "One Way" },
                { value: "roundtrip", label: "Round Trip" },
                { value: "multicity", label: "Multi City" },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setTripType(type.value as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    tripType === type.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Search Fields - Row 1: From, To */}
            <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
              {/* From */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  From
                </label>
                <div className="h-[52px] px-4 bg-background rounded-xl border border-border/50 hover:border-primary/50 transition cursor-pointer flex items-center">
                  <div className="flex-1">
                    <input
                      value={from}
                      onChange={(e) => setFrom(e.target.value.toUpperCase())}
                      className="w-full text-lg font-bold text-foreground bg-transparent outline-none"
                      placeholder="ICN"
                      maxLength={3}
                    />
                    <input
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      className="w-full text-xs text-muted bg-transparent outline-none -mt-1"
                      placeholder="Seoul, Korea"
                    />
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={swapLocations}
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition mb-1"
              >
                <SwapIcon />
              </button>

              {/* To */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  To
                </label>
                <div className="h-[52px] px-4 bg-background rounded-xl border border-border/50 hover:border-primary/50 transition cursor-pointer flex items-center">
                  <div className="flex-1">
                    <input
                      value={to}
                      onChange={(e) => setTo(e.target.value.toUpperCase())}
                      className="w-full text-lg font-bold text-foreground bg-transparent outline-none"
                      placeholder="NRT"
                      maxLength={3}
                    />
                    <input
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      className="w-full text-xs text-muted bg-transparent outline-none -mt-1"
                      placeholder="Tokyo, Japan"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Fields - Row 2: Dates, Passengers, Cabin Class, Search */}
            <div className={`grid gap-4 items-end mt-4 ${tripType === "roundtrip" ? "md:grid-cols-[1fr,1fr,1fr,1fr,auto]" : "md:grid-cols-[1fr,1fr,1fr,auto]"}`}>
              {/* Departure Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Departure
                </label>
                <div className="h-[52px] px-4 bg-background rounded-xl border border-border/50 hover:border-primary/50 transition flex items-center gap-2">
                  <CalendarIcon />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 text-foreground bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Return Date - Only for Round Trip */}
              {tripType === "roundtrip" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">
                    Return
                  </label>
                  <div className="h-[52px] px-4 bg-background rounded-xl border border-border/50 hover:border-primary/50 transition flex items-center gap-2">
                    <CalendarIcon />
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="flex-1 text-foreground bg-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Passengers */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Passengers
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassengerPopover(!showPassengerPopover)}
                  className="w-full h-[52px] px-4 bg-background rounded-xl border border-border/50 hover:border-primary/50 transition flex items-center gap-2 text-left"
                >
                  <UserIcon />
                  <span className="flex-1 text-foreground text-sm">
                    {adults} Adult{adults > 1 ? "s" : ""}
                    {children > 0 && `, ${children} Child${children > 1 ? "ren" : ""}`}
                    {infants > 0 && `, ${infants} Infant${infants > 1 ? "s" : ""}`}
                  </span>
                  <ChevronDownIcon />
                </button>
                
                {/* Passenger Popover */}
                {showPassengerPopover && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-xl z-50 p-4 space-y-4">
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
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <MinusIcon />
                        </button>
                        <span className="w-6 text-center font-medium text-foreground">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(Math.min(9, adults + 1))}
                          disabled={adults >= 9}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <MinusIcon />
                        </button>
                        <span className="w-6 text-center font-medium text-foreground">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren(Math.min(9, children + 1))}
                          disabled={children >= 9}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <MinusIcon />
                        </button>
                        <span className="w-6 text-center font-medium text-foreground">{infants}</span>
                        <button
                          type="button"
                          onClick={() => setInfants(Math.min(adults, infants + 1))}
                          disabled={infants >= adults}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                    </div>
                    
                    {/* Done Button */}
                    <button
                      type="button"
                      onClick={() => setShowPassengerPopover(false)}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Cabin Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Cabin Class
                </label>
                <div className="relative">
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value as any)}
                    className="w-full h-[52px] px-4 bg-background rounded-xl border border-border/50 hover:border-primary/50 transition text-foreground outline-none appearance-none cursor-pointer pr-10"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium_economy">Premium Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First Class</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="h-[52px] px-8 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <SearchIcon />
                <span className="hidden sm:inline">{loading ? "Searching..." : "Search"}</span>
              </button>
            </div>

            {error && (
              <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 bg-card border-y border-border/50">
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

      {/* Search Results */}
      {showResults && (
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-6">
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
                        <div className="bg-card rounded-xl p-5 border border-primary/30 shadow-sm">
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
                        <div className="bg-card rounded-xl p-5 border border-amber-300/50 shadow-sm">
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
                <div className="flex gap-1 bg-background rounded-xl p-1 border border-border">
                  {(["price", "duration", "ai"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSortTab(tab)}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                        sortTab === tab
                          ? "bg-primary text-primary-foreground"
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

                {/* Results List */}
                <div className="space-y-3">
                  {getSortedResults().map((offer) => (
                    <div
                      key={offer.id}
                      className="bg-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/50 hover:border-primary/30 hover:shadow-md transition"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-foreground">
                          {offer.airline ?? "Unknown Airline"}
                        </p>
                        <p className="text-sm text-muted mt-1">
                          {offer.departure?.slice(11, 16)} →{" "}
                          {offer.arrival?.slice(11, 16)}
                          {" · "}
                          {offer.stops === 0
                            ? "Direct"
                            : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${Number(offer.price).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted">{offer.currency}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Trend Button */}
                <button
                  onClick={handlePriceTrend}
                  disabled={chartLoading}
                  className="w-full py-3 rounded-xl bg-card border border-border text-foreground text-sm font-medium hover:bg-background transition disabled:opacity-50"
                >
                  {chartLoading ? "Loading price trends..." : "View Price Trends"}
                </button>

                {/* Price Chart */}
                {priceChartData.length > 0 && (
                  <div className="bg-card rounded-xl p-6 border border-border/50">
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
                <div className="bg-card rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Set Price Alert
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      placeholder="Target price (USD)"
                      className="flex-1 p-3 rounded-xl bg-background text-foreground border border-border placeholder-muted outline-none focus:border-primary transition"
                    />
                    <button
                      onClick={handleAddAlert}
                      disabled={!alertPrice}
                      className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition disabled:opacity-50"
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
                          className="flex justify-between items-center bg-background p-3 rounded-xl border border-border"
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

      {/* Popular Destinations */}
      {!showResults && (
        <section className="py-20 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              Explore Top Destinations
            </h2>
            <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
              Discover amazing places around the world with our curated selection of popular destinations
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {destinations.map((dest, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl overflow-hidden h-80 cursor-pointer transform hover:scale-[1.02] transition duration-300"
                >
                  <Image
                    src={dest.image}
                    alt={dest.city}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {dest.city}
                        </h3>
                        <p className="text-white/70 text-sm">{dest.dates}</p>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
                        <p className="text-xs text-muted">Economy From</p>
                        <p className="text-sm font-bold text-foreground">
                          USD ${dest.price}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
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
