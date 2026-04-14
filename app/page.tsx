"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { signInWithGoogle, signOut, handleRedirectResult, auth, onAuthStateChanged } from '../lib/auth';
import type { User } from "firebase/auth";

interface PriceAlert {
  id: string;
  from: string;
  to: string;
  targetPrice: number;
  setDate: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [from, setFrom] = useState("ICN");
  const [to, setTo] = useState("NRT");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [sortTab, setSortTab] = useState<'price' | 'duration' | 'ai'>('price');
  const [priceChartData, setPriceChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertPrice, setAlertPrice] = useState("");
  const [matchedAlert, setMatchedAlert] = useState<PriceAlert | null>(null);

  useEffect(() => {
    handleRedirectResult().then(u => { if (u) setUser(u); });
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedAlerts = localStorage.getItem("priceAlerts");
    if (savedAlerts) {
      try { setAlerts(JSON.parse(savedAlerts)); }
      catch { console.error("Failed to load alerts"); }
    }
  }, []);

  const handleSignIn = async () => {
    try { await signInWithGoogle(); }
    catch (err) { console.error("로그인 실패:", err); }
  };

  const handleSignOut = async () => {
    try { await signOut(); }
    catch (err) { console.error("로그아웃 실패:", err); }
  };

  const handleSearch = async () => {
    if (!date) { setError("날짜를 선택해주세요"); return; }
    setLoading(true);
    setError("");
    setResults([]);
    setMatchedAlert(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: from.trim().toUpperCase(),
          destination: to.trim().toUpperCase(),
          departureDate: date,
          adults: passengers,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError("API 오류 발생"); return; }
      const offers = data.offers || [];
      setResults(offers);
      if (offers.length > 0) {
        const minPrice = Math.min(...offers.map((o: any) => Number(o.price)));
        const match = alerts.find(a =>
          a.from === from.toUpperCase() && a.to === to.toUpperCase() && minPrice <= a.targetPrice
        );
        if (match) setMatchedAlert(match);
      }
    } catch { setError("서버 연결 실패"); }
    finally { setLoading(false); }
  };

  const calculateDuration = (dep: string, arr: string) => {
    if (!dep || !arr) return Infinity;
    return new Date(arr).getTime() - new Date(dep).getTime();
  };

  const getSortedResults = () => {
    const sorted = [...results];
    if (sortTab === 'price') return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortTab === 'duration') return sorted.sort((a, b) => calculateDuration(a.departure, a.arrival) - calculateDuration(b.departure, b.arrival));
    if (sortTab === 'ai') return sorted.sort((a, b) => {
      if ((a.stops ?? 0) !== (b.stops ?? 0)) return (a.stops ?? 0) - (b.stops ?? 0);
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
        const dateStr = checkDate.toISOString().split('T')[0];
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: from.trim().toUpperCase(),
            destination: to.trim().toUpperCase(),
            departureDate: dateStr,
            adults: passengers,
          }),
        });
        const data = await res.json();
        if (res.ok && data.offers?.length > 0) {
          const minPrice = Math.min(...data.offers.map((o: any) => Number(o.price)));
          chartData.push({
            date: new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            price: minPrice,
            fullDate: dateStr,
            isSelected: dateStr === date,
          });
        }
      }
      setPriceChartData(chartData);
    } catch { } finally { setChartLoading(false); }
  };

  const cheapestDatePoint = priceChartData.length > 0
    ? priceChartData.reduce((min, curr) => Number(curr.price) < Number(min.price) ? curr : min)
    : null;

  const handleAddAlert = () => {
    if (!alertPrice || isNaN(Number(alertPrice))) return;
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      targetPrice: Number(alertPrice),
      setDate: new Date().toLocaleDateString('ko-KR'),
    };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    localStorage.setItem("priceAlerts", JSON.stringify(updated));
    setAlertPrice("");
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem("priceAlerts", JSON.stringify(updated));
  };

  const cheapestDirect = results.filter(f => f.stops === 0)
    .reduce((min: any, curr) => !min || Number(curr.price) < Number(min.price) ? curr : min, null);
  const cheapestConnecting = results.filter(f => (f.stops ?? 0) > 0)
    .reduce((min: any, curr) => !min || Number(curr.price) < Number(min.price) ? curr : min, null);

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center py-16 px-4">

      {/* 로그인 버튼 */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {user ? (
          <>
            {user.photoURL && <img src={user.photoURL} alt={user.displayName ?? ""} className="w-8 h-8 rounded-full" />}
            <span className="text-sm text-slate-300">{user.displayName}</span>
            <button onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition">
              로그아웃
            </button>
          </>
        ) : (
          <button onClick={handleSignIn}
            className="px-4 py-2 rounded-lg bg-white text-gray-800 font-semibold text-sm flex items-center gap-2 hover:bg-gray-100 transition shadow">
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 로그인
          </button>
        )}
      </div>

      <h1 className="text-4xl font-bold mb-2">SmartFlight ✈️</h1>
      <p className="text-slate-400 mb-10">최저가 항공권을 찾아드립니다</p>

      {/* 검색 폼 */}
      <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">출발지</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0f172a] text-white border border-slate-600" placeholder="ICN" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">도착지</label>
            <input value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0f172a] text-white border border-slate-600" placeholder="NRT" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">날짜</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0f172a] text-white border border-slate-600" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">승객</label>
            <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full p-3 rounded-lg bg-[#0f172a] text-white border border-slate-600">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}명</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleSearch} disabled={loading}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold transition disabled:opacity-50">
          {loading ? "검색 중..." : "최저가 항공권 검색"}
        </button>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* 결과 */}
      {results.length > 0 && (
        <div className="w-full max-w-2xl mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">{results.length}개 결과</h2>

          {matchedAlert && (
            <div className="p-3 rounded-lg bg-green-600/30 border border-green-400/50 text-green-300 text-sm font-semibold text-center">
              🔔 {matchedAlert.from}→{matchedAlert.to} 목표가 달성! 현재 최저가 {Math.min(...results.map((o: any) => Number(o.price))).toLocaleString()} USD
            </div>
          )}

          {(cheapestDirect || cheapestConnecting) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400">직항 vs 경유 비교</h3>
              <div className="grid grid-cols-2 gap-3">
                {cheapestDirect && (
                  <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-400/40">
                    <p className="text-blue-400 font-semibold text-sm mb-2">✈️ 직항</p>
                    <p className="text-white font-bold text-xl">${Number(cheapestDirect.price).toLocaleString()}</p>
                    <p className="text-slate-400 text-xs mt-1">{cheapestDirect.airline}</p>
                    <p className="text-slate-300 text-sm">{cheapestDirect.departure?.slice(11,16)} → {cheapestDirect.arrival?.slice(11,16)}</p>
                  </div>
                )}
                {cheapestConnecting && (
                  <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-400/40">
                    <p className="text-amber-400 font-semibold text-sm mb-2">🔄 경유 ({cheapestConnecting.stops}회)</p>
                    <p className="text-white font-bold text-xl">${Number(cheapestConnecting.price).toLocaleString()}</p>
                    <p className="text-slate-400 text-xs mt-1">{cheapestConnecting.airline}</p>
                    <p className="text-slate-300 text-sm">{cheapestConnecting.departure?.slice(11,16)} → {cheapestConnecting.arrival?.slice(11,16)}</p>
                  </div>
                )}
              </div>
              {cheapestDirect && cheapestConnecting && (
                <div className={`text-center py-2 rounded-lg text-sm font-semibold ${
                  Number(cheapestDirect.price) <= Number(cheapestConnecting.price)
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-400/40'
                    : 'bg-green-600/30 text-green-300 border border-green-400/40'
                }`}>
                  {Number(cheapestDirect.price) <= Number(cheapestConnecting.price)
                    ? '✨ 직항이 더 저렴!'
                    : `✨ 경유로 $${(Number(cheapestDirect.price) - Number(cheapestConnecting.price)).toLocaleString()} 절약 가능!`}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 bg-[#1e293b] rounded-lg p-1 border border-slate-700">
            {(['price','duration','ai'] as const).map(tab => (
              <button key={tab} onClick={() => setSortTab(tab)}
                className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition ${
                  sortTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                {tab === 'price' ? '최저가' : tab === 'duration' ? '최단시간' : 'AI 추천'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {getSortedResults().map((offer) => (
              <div key={offer.id} className="bg-[#1e293b] rounded-xl p-4 flex justify-between items-center border border-slate-700">
                <div>
                  <p className="font-bold text-blue-400">{offer.airline ?? "항공사 미상"}</p>
                  <p className="text-sm text-slate-400">
                    {offer.departure?.slice(11,16)} → {offer.arrival?.slice(11,16)}
                    {" · "}{offer.stops === 0 ? "직항" : `${offer.stops}회 경유`}
                  </p>
                </div>
                <p className="text-xl font-bold text-green-400">
                  {Number(offer.price).toLocaleString()} {offer.currency}
                </p>
              </div>
            ))}
          </div>

          <button onClick={handlePriceTrend} disabled={chartLoading}
            className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition disabled:opacity-50">
            {chartLoading ? "데이터 로딩 중..." : "가격 추이 보기"}
          </button>

          <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 space-y-3">
            <h3 className="text-sm font-semibold text-slate-400">🔔 가격 알림 설정</h3>
            <div className="flex gap-2">
              <input type="number" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)}
                placeholder="목표 가격 (USD)"
                className="flex-1 p-2 rounded-lg bg-[#0f172a] text-white border border-slate-600 text-sm placeholder-slate-500" />
              <button onClick={handleAddAlert} disabled={!alertPrice}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition disabled:opacity-50">
                설정
              </button>
            </div>
            {alerts.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-slate-400">활성 알림 ({alerts.length})</p>
                {alerts.map(alert => (
                  <div key={alert.id} className="flex justify-between items-center bg-[#0f172a] p-2 rounded-lg border border-slate-700">
                    <div className="text-xs">
                      <p className="text-blue-300 font-semibold">{alert.from}→{alert.to}</p>
                      <p className="text-slate-400">${alert.targetPrice} USD · {alert.setDate}</p>
                    </div>
                    <button onClick={() => handleDeleteAlert(alert.id)}
                      className="px-2 py-1 rounded bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-semibold transition">
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {priceChartData.length > 0 && (
        <div className="w-full max-w-4xl mt-8 bg-[#1e293b] rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-300 mb-4">가격 추이 (±7일)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceChartData}>
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} label={{ value: 'USD', angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #64748b', borderRadius: '8px' }}
                formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              {priceChartData.map(point => point.isSelected ? (
                <ReferenceDot key={point.fullDate} x={point.date} y={point.price}
                  r={6} fill="#06b6d4" stroke="#0891b2" strokeWidth={2} />
              ) : null)}
              {cheapestDatePoint && !cheapestDatePoint.isSelected && (
                <ReferenceDot x={cheapestDatePoint.date} y={cheapestDatePoint.price}
                  r={6} fill="#10b981" stroke="#059669" strokeWidth={2}
                  label={{ value: '최저가', position: 'top', fill: '#10b981', fontSize: 12 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <p className="mt-12 text-slate-500 text-sm">출발지, 도착지, 날짜를 입력하고 검색해보세요</p>
      )}
    </main>
  );
}