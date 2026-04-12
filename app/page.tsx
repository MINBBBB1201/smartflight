"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

interface PriceAlert {
  id: string;
  from: string;
  to: string;
  targetPrice: number;
  setDate: string;
}

export default function Home() {
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
    const savedAlerts = localStorage.getItem("priceAlerts");
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch {
        console.error("Failed to load alerts");
      }
    }
  }, []);

  const handleSearch = async () => {
    console.log("🔥 버튼 클릭됨");
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
      console.log("📦 응답:", data);
      if (!res.ok) { setError("API 오류 발생"); return; }
      const offers = data.offers || [];
      setResults(offers);
      
      // Check for matching alerts
      if (offers.length > 0) {
        const minPrice = Math.min(...offers.map((o: any) => Number(o.price)));
        const matchingAlert = alerts.find(
          (alert) => alert.from === from.toUpperCase() && alert.to === to.toUpperCase() && minPrice <= alert.targetPrice
        );
        if (matchingAlert) {
          setMatchedAlert(matchingAlert);
        }
      }
    } catch (err) {
      console.error("🚨 에러:", err);
      setError("서버 연결 실패");
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (departure: string, arrival: string) => {
    if (!departure || !arrival) return Infinity;
    const dept = new Date(departure).getTime();
    const arrv = new Date(arrival).getTime();
    return arrv - dept;
  };

  const getSortedResults = () => {
    const sorted = [...results];
    if (sortTab === 'price') {
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortTab === 'duration') {
      return sorted.sort((a, b) => {
        const durationA = calculateDuration(a.departure, a.arrival);
        const durationB = calculateDuration(b.departure, b.arrival);
        return durationA - durationB;
      });
    } else if (sortTab === 'ai') {
      return sorted.sort((a, b) => {
        const stopsA = a.stops ?? 0;
        const stopsB = b.stops ?? 0;
        if (stopsA !== stopsB) return stopsA - stopsB;
        return Number(a.price) - Number(b.price);
      });
    }
    return sorted;
  };

  const handlePriceTrend = async () => {
    if (!date) return;
    setChartLoading(true);
    const chartData = [];
    const selectedDate = new Date(date);
    
    try {
      // Fetch prices for ±7 days
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
        if (res.ok && data.offers && data.offers.length > 0) {
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
    } catch (err) {
      console.error("🚨 차트 데이터 오류:", err);
    } finally {
      setChartLoading(false);
    }
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
    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    localStorage.setItem("priceAlerts", JSON.stringify(updatedAlerts));
    setAlertPrice("");
  };

  const handleDeleteAlert = (alertId: string) => {
    const updatedAlerts = alerts.filter((a) => a.id !== alertId);
    setAlerts(updatedAlerts);
    localStorage.setItem("priceAlerts", JSON.stringify(updatedAlerts));
  };

  const getCheapestDirect = () => {
    const directFlights = results.filter((f) => f.stops === 0);
    if (directFlights.length === 0) return null;
    return directFlights.reduce((min, curr) => Number(curr.price) < Number(min.price) ? curr : min);
  };

  const getCheapestConnecting = () => {
    const connectingFlights = results.filter((f) => (f.stops ?? 0) > 0);
    if (connectingFlights.length === 0) return null;
    return connectingFlights.reduce((min, curr) => Number(curr.price) < Number(min.price) ? curr : min);
  };

  const cheapestDirect = getCheapestDirect();
  const cheapestConnecting = getCheapestConnecting();

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center py-16 px-4">
      <h1 className="text-4xl font-bold mb-2">SmartFlight ✈️</h1>
      <p className="text-slate-400 mb-10">최저가 항공권을 찾아드립니다</p >
      <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">출발지</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0f172a] text-white border border-slate-600"
              placeholder="ICN" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">도착지</label>
            <input value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0f172a] text-white border border-slate-600"
              placeholder="NRT" />
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

      {/* Matched Alert Banner */}
      {matchedAlert && results.length > 0 && (
        <div className="w-full max-w-2xl mt-6 bg-green-600/30 border border-green-400/60 rounded-xl p-4 text-center">
          <p className="text-green-300 font-semibold">
            🔔 알림: {matchedAlert.from}→{matchedAlert.to} 목표가 달성! 현재 최저가 ${Math.min(...results.map((o: any) => Number(o.price))).toLocaleString()} USD
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="w-full max-w-2xl mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">{results.length}개 결과</h2>
          
          {/* Direct vs Connecting Comparison */}
          {(cheapestDirect || cheapestConnecting) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400">직항 vs 경유 비교</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Direct Flight Card */}
                {cheapestDirect && (
                  <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-4 border border-blue-400/40">
                    <p className="text-blue-400 font-semibold text-sm mb-2">✈️ 직항</p>
                    <p className="text-white font-bold text-xl mb-1">${Number(cheapestDirect.price).toLocaleString()}</p>
                    <p className="text-slate-400 text-xs mb-2">{cheapestDirect.airline ?? "항공사 미상"}</p>
                    <p className="text-slate-300 text-sm">{cheapestDirect.departure?.slice(11,16)} → {cheapestDirect.arrival?.slice(11,16)}</p>
                  </div>
                )}
                
                {/* Connecting Flight Card */}
                {cheapestConnecting && (
                  <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-xl p-4 border border-amber-400/40">
                    <p className="text-amber-400 font-semibold text-sm mb-2">🔄 경유 ({cheapestConnecting.stops}회)</p>
                    <p className="text-white font-bold text-xl mb-1">${Number(cheapestConnecting.price).toLocaleString()}</p>
                    <p className="text-slate-400 text-xs mb-2">{cheapestConnecting.airline ?? "항공사 미상"}</p>
                    <p className="text-slate-300 text-sm">{cheapestConnecting.departure?.slice(11,16)} → {cheapestConnecting.arrival?.slice(11,16)}</p>
                  </div>
                )}
              </div>

              {/* Savings Badge */}
              {cheapestDirect && cheapestConnecting && (
                <div className={`text-center py-2 rounded-lg font-semibold text-sm ${
                  Number(cheapestDirect.price) < Number(cheapestConnecting.price)
                    ? 'bg-blue-600/40 text-blue-300 border border-blue-400/50'
                    : 'bg-green-600/40 text-green-300 border border-green-400/50'
                }`}>
                  {Number(cheapestDirect.price) < Number(cheapestConnecting.price)
                    ? '✨ 직항이 더 저렴!'
                    : `✨ 경유로 $${(Number(cheapestConnecting.price) - Number(cheapestDirect.price)).toLocaleString()} 절약 가능!`
                  }
                </div>
              )}
            </div>
          )}
          
          {/* Sorting Tabs */}
          <div className="flex gap-2 bg-[#1e293b] rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setSortTab('price')}
              className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition ${
                sortTab === 'price'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              최저가
            </button>
            <button
              onClick={() => setSortTab('duration')}
              className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition ${
                sortTab === 'duration'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              최단시간
            </button>
            <button
              onClick={() => setSortTab('ai')}
              className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition ${
                sortTab === 'ai'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI 추천
            </button>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {getSortedResults().map((offer) => (
              <div key={offer.id} className="bg-[#1e293b] rounded-xl p-4 flex justify-between items-center border border-slate-700">
                <div>
                  <p className="font-bold text-blue-400">{offer.airline ?? "항공사 미상"}</p >
                  <p className="text-sm text-slate-400">
                    {offer.departure?.slice(11,16)} → {offer.arrival?.slice(11,16)}
                    {" · "}{offer.stops === 0 ? "직항" : `${offer.stops}회 경유`}
                  </p >
                </div>
                <p className="text-xl font-bold text-green-400">
                  {Number(offer.price).toLocaleString()} {offer.currency}
                </p >
              </div>
            ))}
          </div>

          {/* Price Trend Button */}
          <button 
            onClick={handlePriceTrend}
            disabled={chartLoading}
            className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition disabled:opacity-50"
          >
            {chartLoading ? "데이터 로딩 중..." : "가격 추이 보기"}
          </button>

          {/* Price Alert Setting */}
          <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 space-y-3">
            <h3 className="text-sm font-semibold text-slate-400">🔔 가격 알림 설정</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder="목표 가격 (USD)"
                className="flex-1 p-2 rounded-lg bg-[#0f172a] text-white border border-slate-600 text-sm placeholder-slate-500"
              />
              <button
                onClick={handleAddAlert}
                disabled={!alertPrice}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition disabled:opacity-50"
              >
                설정
              </button>
            </div>
            {alerts.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-400">활성 알림 ({alerts.length})</p>
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex justify-between items-center bg-[#0f172a] p-2 rounded-lg border border-slate-700">
                    <div className="text-xs">
                      <p className="text-blue-300 font-semibold">{alert.from}→{alert.to}</p>
                      <p className="text-slate-400">${alert.targetPrice} USD · {alert.setDate}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="px-2 py-1 rounded bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-semibold transition"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Price Trend Chart */}
      {priceChartData.length > 0 && (
        <div className="w-full max-w-4xl mt-8 bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-300 mb-4">가격 추이 (±7일)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceChartData}>
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                label={{ value: 'USD', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a',
                  border: '1px solid #64748b',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              {/* Highlight selected date */}
              {priceChartData.map((point) => 
                point.isSelected ? (
                  <ReferenceDot
                    key={point.fullDate}
                    x={point.date}
                    y={point.price}
                    r={6}
                    fill="#06b6d4"
                    stroke="#0891b2"
                    strokeWidth={2}
                  />
                ) : null
              )}
              
              {/* Highlight cheapest date */}
              {cheapestDatePoint && !cheapestDatePoint.isSelected && (
                <ReferenceDot
                  x={cheapestDatePoint.date}
                  y={cheapestDatePoint.price}
                  r={6}
                  fill="#10b981"
                  stroke="#059669"
                  strokeWidth={2}
                  label={{ value: '최저가', position: 'top', fill: '#10b981', fontSize: 12 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {results.length === 0 && !loading && !error && (
        <p className="mt-12 text-slate-500 text-sm">출발지, 도착지, 날짜를 입력하고 검색해보세요</p >
      )}
    </main>
  );
}
///fjdkfs;kadjf;lsadjf;l