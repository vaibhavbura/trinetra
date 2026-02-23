"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchLeaderboard } from "@/lib/api";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Crown, Award, Medal, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function LeaderboardPage() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [year, setYear] = useState("");

  const [totalCreators, setTotalCreators] = useState<number>(0);
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchRefreshedData = useCallback(() => {
    // First figure out total unfiltered count for relative context
    fetchLeaderboard({}).then(all => setTotalCreators(all.length)).catch(() => {});

    const params: any = {};
    if (genre) params.genre = genre;
    if (language) params.language = language;
    if (year) params.year = year;
    
    fetchLeaderboard(params).then((data) => {
      setCreators(data);
      setLoading(false);
    }).catch(console.error);
  }, [genre, language, year]);

  useEffect(() => {
    fetchRefreshedData();
    const interval = setInterval(fetchRefreshedData, 15000);
    return () => clearInterval(interval);
  }, [fetchRefreshedData]);

  if (loading && creators.length === 0) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Award className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="font-mono text-xl text-gray-500">#{rank}</span>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || "0";
  };

  const activeCreators = creators.filter(c => c.data_confidence !== "none");
  const inactiveCreators = creators.filter(c => c.data_confidence === "none");
  const hasAnySubscribers = creators.some(c => c.subscribers > 0);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Leaderboard
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
              <span className="text-xs font-semibold uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto justify-start xl:justify-end">
            {/* Filter Feedback */}
            {(genre || language || year) && (
               <div className="text-sm font-medium text-emerald-400 bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                 Showing {creators.length} of {totalCreators} creators
               </div>
            )}
            
            <div className="flex gap-2 items-center bg-gray-800 p-2 rounded-lg border border-gray-700 text-sm whitespace-nowrap">
              <label className="flex items-center gap-2 cursor-pointer pr-2">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={showInactive} onChange={() => setShowInactive(!showInactive)} />
                  <div className={`block w-8 h-5 rounded-full transition-colors ${showInactive ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${showInactive ? 'translate-x-3' : ''}`}></div>
                </div>
                <span className="text-gray-400 text-xs text-nowrap">Show Inactive</span>
              </label>
            </div>

            <div className="flex gap-2 items-center bg-gray-800 p-2 rounded-lg border border-gray-700 text-sm">
              <Filter className="w-4 h-4 text-gray-400 ml-2" />
              <input 
                type="text" 
                placeholder="Genre" 
                value={genre} 
                onChange={e => setGenre(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-white w-24 placeholder-gray-500 outline-none"
              />
              <span className="text-gray-600">|</span>
              <input 
                type="text" 
                placeholder="Language" 
                value={language} 
                onChange={e => setLanguage(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-white w-24 placeholder-gray-500 outline-none"
              />
              <span className="text-gray-600">|</span>
              <input 
                type="text" 
                placeholder="Year" 
                value={year} 
                onChange={e => setYear(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-white w-16 placeholder-gray-500 outline-none"
              />
            </div>
            <Link href="/" className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-semibold transition-colors">
              Home
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl overflow-x-auto shadow-lg border border-gray-700">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-5 font-semibold w-16 text-center">Rank</th>
                <th className="p-5 font-semibold">Creator</th>
                <th className="p-5 font-semibold w-48">Creator Health Score</th>
                <th className="p-5 font-semibold text-right">
                  Avg Views / Ep
                  <div className="text-[10px] text-gray-500 font-normal normal-case mt-0.5 tracking-normal">Calculated across selected period</div>
                </th>
                <th className="p-5 font-semibold text-right">Avg Comp</th>
                {hasAnySubscribers && <th className="p-5 font-semibold text-right">Subs</th>}
                <th className="p-5 font-semibold text-center">Trend</th>
                <th className="p-5 font-semibold text-center"></th>
              </tr>
            </thead>
            <motion.tbody 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {activeCreators.map((c, idx) => (
                <motion.tr 
                  key={c.id} 
                  variants={itemVariants}
                  className="border-b border-gray-700/50 transition-colors"
                >
                  <td className="p-5 text-center flex justify-center items-center h-full min-h-[5rem]">
                    {getRankIcon(idx + 1)}
                  </td>
                  
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-white font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-100">{c.name}</div>
                        <div className="text-sm text-gray-500">{c.handle}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-5 w-48 align-middle group relative cursor-pointer">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-end">
                        <span className="font-mono text-xl font-bold text-emerald-400">{c.latest_score.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 font-medium">/ 100</span>
                      </div>
                      <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${c.latest_score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${c.latest_score > 75 ? 'bg-emerald-500' : c.latest_score > 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                        />
                      </div>
                    </div>
                    {/* Explainability Tooltip */}
                    {/* <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-gray-800 border border-gray-700 shadow-xl rounded-xl p-4 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                       <div className="text-xs font-bold text-gray-400 mb-3 border-b border-gray-700 pb-2">Score Breakdown</div>
                       <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">Engagement</span><span className="font-mono text-emerald-400">{c.engagement_score}%</span></div>
                            <div className="h-1.5 bg-gray-900 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{width: `${c.engagement_score}%`}}></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">Retention</span><span className="font-mono text-blue-400">{c.retention_score}%</span></div>
                            <div className="h-1.5 bg-gray-900 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width: `${c.retention_score}%`}}></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">Growth</span><span className="font-mono text-purple-400">{c.growth_score}%</span></div>
                            <div className="h-1.5 bg-gray-900 rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{width: `${c.growth_score}%`}}></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">Consistency</span><span className="font-mono text-orange-400">{c.consistency_score}%</span></div>
                            <div className="h-1.5 bg-gray-900 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{width: `${c.consistency_score}%`}}></div></div>
                          </div>
                       </div>
                       <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 border-r border-b border-gray-700 transform rotate-45"></div>
                    </div> */}
                  </td>

                  <td className="p-5 text-right font-mono text-gray-300 align-middle">
                    <div className="flex items-center justify-end gap-1">
                       {formatNumber(c.views)}
                    </div>
                  </td>
                  
                  <td className="p-5 text-right font-mono text-gray-300">
                    {c.completion_rate}%
                  </td>
                  
                  {hasAnySubscribers && (
                    <td className="p-5 text-right font-mono text-gray-300 align-middle">
                      {c.subscribers > 0 ? formatNumber(c.subscribers) : <span className="text-gray-600">-</span>}
                    </td>
                  )}
                  
                  <td className="p-5 text-center align-middle">
                    <div className={`inline-flex items-center justify-center p-2 rounded-lg border ${c.trend === 'up' ? 'bg-emerald-950/30 border-emerald-900/50' : c.trend === 'down' ? 'bg-red-950/30 border-red-900/50' : 'bg-gray-900/50 border-gray-700'}`}>
                      {c.trend === 'up' && <TrendingUp className="text-emerald-500 w-5 h-5" />}
                      {c.trend === 'down' && <TrendingDown className="text-red-500 w-5 h-5" />}
                      {c.trend === 'stable' && <Minus className="text-gray-500 w-5 h-5" />}
                    </div>
                  </td>
                  
                  <td className="p-5 text-right">
                    <Link 
                      href={`/creator/${c.id}`} 
                      className="inline-flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50 rounded-lg text-sm font-semibold transition-all"
                    >
                      Analytics
                    </Link>
                  </td>
                </motion.tr>
              ))}
              
              {creators.length === 0 && !loading && (
                <tr>
                   <td colSpan={8} className="p-10 text-center text-gray-500">
                      No creators found matching the current filters.
                   </td>
                </tr>
              )}
            </motion.tbody>
            
            {/* Inactive Creators Section */}
            {showInactive && inactiveCreators.length > 0 && (
              <tbody className="opacity-60 bg-gray-900/50">
                {inactiveCreators.map((c, idx) => (
                  <tr key={c.id} className="border-b border-gray-700/50">
                    <td className="p-5 text-center flex justify-center items-center h-full min-h-[5rem]">
                      <span className="font-mono text-xl text-gray-600">-</span>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 font-bold">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-lg text-gray-400">{c.name}</div>
                          <div className="text-sm text-gray-600">{c.handle}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5 w-48 align-middle">
                      <div className="text-sm font-medium text-gray-500 bg-gray-800 px-3 py-1.5 rounded-lg text-center border border-gray-700">
                        Insufficient data
                      </div>
                    </td>

                    <td className="p-5 text-right font-mono text-gray-500 align-middle">-</td>
                    <td className="p-5 text-right font-mono text-gray-500">-</td>
                    
                    {hasAnySubscribers && (
                      <td className="p-5 text-right font-mono text-gray-500 align-middle">-</td>
                    )}
                    
                    <td className="p-5 text-center align-middle">
                      <div className="inline-flex items-center justify-center p-2 rounded-lg border bg-gray-900/50 border-gray-800">
                        <Minus className="text-gray-700 w-5 h-5" />
                      </div>
                    </td>
                    
                    <td className="p-5 text-right">
                      <Link 
                        href={`/creator/${c.id}`} 
                        className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-gray-600 border border-gray-800 rounded-lg text-sm font-semibold transition-all pointer-events-none"
                      >
                        Analytics
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
            
          </table>
        </div>
      </div>
    </div>
  );
}
