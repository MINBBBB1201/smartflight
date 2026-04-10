"use client";
import { useState } from "react";

export default function Home() {
  const [from, setFrom] = useState("ICN");
  const [to, setTo] = useState("NRT");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    console.log("🔥 버튼 클릭됨");
    if (!date) { setError("날짜를 선택해주세요"); return; }
    setLoading(true);
    setError("");
    setResults([]);
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
      setResults(data.offers || []);
    } catch (err) {
      console.error("🚨 에러:", err);
      setError("서버 연결 실패");
    } finally {
      setLoading(false);
    }
  };

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
        {error && <p className="text-red-400 text-sm text-center">{error}</p >}
      </div>
      {results.length > 0 && (
        <div className="w-full max-w-2xl mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-slate-300">{results.length}개 결과</h2>
          {results.map((offer) => (
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
      )}
      {results.length === 0 && !loading && !error && (
        <p className="mt-12 text-slate-500 text-sm">출발지, 도착지, 날짜를 입력하고 검색해보세요</p >
      )}
    </main>
  );
}
