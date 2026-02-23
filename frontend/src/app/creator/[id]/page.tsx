"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCreatorAnalytics, predictViews } from "@/lib/api";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  Area, AreaChart, BarChart, Bar, ScatterChart, Scatter, ZAxis, Label,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from "recharts";
import { Activity, Eye, TrendingUp, AlertCircle, Sparkles, ChevronLeft, Medal, BarChart2, PieChart, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function CreatorIntelligencePage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchCreatorAnalytics(id as string),
        predictViews(id as string).catch(() => null)
      ]).then(([analyticsData, predData]) => {
        setData(analyticsData);
        if (predData) setPrediction(predData.predicted_views_next_7_days);
        setLoading(false);
      }).catch(console.error);
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!data) return <div className="p-10 text-center min-h-screen bg-gray-950 text-white flex items-center justify-center text-2xl font-bold">Creator not found</div>;

  const latestHistory = data.score_history?.[0] || { score: 0, insights: [] };
  
  const chartData = [...(data.score_history || [])].reverse().map((h: any) => ({
    date: h.date,
    score: h.score,
  }));

  const eps = data.episodes || [];
  
  // 1. Views vs Episode (Line)
  const viewsData = eps.map((e: any, idx: number) => ({
    episode: e.episode_number || idx + 1,
    views: e.views,
    name: e.series_name
  })).sort((a: any, b: any) => a.episode - b.episode);

  // 2. Completion Rate (Bar)
  const compData = eps.map((e: any, idx: number) => ({
    episode: e.episode_number || idx + 1,
    completion: (e.completion_rate || 0) * 100,
  })).sort((a: any, b: any) => a.episode - b.episode);

  // 3. Views vs Episode Duration (Scatter)
  const scatterData = eps.map((e: any) => ({
    duration: e.episode_duration,
    views: e.views,
    name: e.series_name
  }));

  // 4. Genre (Bar)
  const genreViews: Record<string, number> = {};
  eps.forEach((e: any) => {
    if (e.genre) genreViews[e.genre] = (genreViews[e.genre] || 0) + e.views;
  });
  const genreData = Object.keys(genreViews).map(k => ({ genre: k, views: genreViews[k] }));

  // 5. Language (Stacked/Bar)
  const langViews: Record<string, number> = {};
  eps.forEach((e: any) => {
    if (e.language) langViews[e.language] = (langViews[e.language] || 0) + e.views;
  });
  const langData = Object.keys(langViews).map(k => ({ language: k, views: langViews[k] }));

  // 6. Radar (Mock derived from eps)
  let sumLikes = 0, sumViews = 0, sumComp = 0;
  eps.forEach((e:any) => { sumLikes += e.likes; sumViews += e.views; sumComp += (e.completion_rate || 0) * 100; });
  const engRatio = Math.min(((sumLikes * 5) / Math.max(sumViews, 1)) * 100, 100) || 50;
  const avgComp = eps.length ? sumComp / eps.length : 50;

  const radarData = [
    { metric: "Retention", value: isNaN(avgComp) ? 50 : avgComp },
    { metric: "Engagement", value: engRatio },
    { metric: "Growth", value: 75 }, // Mocked for radar shape
    { metric: "Consistency", value: 85 } // Mocked for radar shape
  ];

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const formatNum = (v: number) => {
    if (v >= 1000000) return (v/1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v/1000).toFixed(1) + 'K';
    return v.toString();
  };

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-gray-400 mb-1">{payload[0].payload.metric}</p>
          <p className="font-mono text-emerald-400 font-black text-lg">{payload[0].value.toFixed(1)}%</p>
          <p className="text-[10px] text-gray-500 mt-2">Scores are normalized relative to platform benchmarks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12 font-sans relative">
      <motion.div 
        className="max-w-7xl mx-auto space-y-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Header Section */}
        <motion.div variants={fadeUpVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-gray-800 pb-8 gap-6">
          <div className="w-full xl:w-auto min-w-0">
            <Link href="/leaderboard" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mb-6 text-sm font-semibold tracking-wider uppercase">
              <ChevronLeft className="w-4 h-4" /> Back to Leaderboard
            </Link>
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg shadow-emerald-900/10">
                {data.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight truncate">{data.name}</h1>
                <p className="text-gray-400 mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <span className="text-emerald-400 font-medium truncate">@{data.handle}</span> 
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-700 flex-shrink-0" /> 
                  <span className="font-semibold tracking-wide uppercase text-gray-500">{data.platform}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="w-full xl:w-auto text-left xl:text-right bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-5 sm:p-6 rounded-2xl shadow-xl flex-shrink-0">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2 xl:justify-end">
              <Zap className="w-3 h-3 text-emerald-400"/> Creator Health Score
            </div>
            <div className="flex items-baseline gap-2 justify-start md:justify-end">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {latestHistory.score.toFixed(1)}
              </div>
              <span className="text-xl text-gray-600 font-bold">/ 100</span>
            </div>
            {latestHistory.rank && (
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-gray-950/50 border border-gray-700 text-gray-300 rounded-lg text-sm font-bold">
                <Medal className="w-4 h-4 text-amber-400" /> Global Rank #{latestHistory.rank}
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Intelligence Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Insights & Prediction */}
          <motion.div variants={fadeUpVariants} className="lg:col-span-1 space-y-6 w-full min-w-0">
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden group">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-gray-400">
                <AlertCircle className="w-4 h-4 text-emerald-400" />
                Executive Summary
              </h3>
              <ul className="space-y-4">
                {latestHistory.insights.map((insight: string, idx: number) => {
                  const isRisk = insight.startsWith("Risk");
                  const isOpp = insight.startsWith("Opportunity");
                  const isStrength = insight.startsWith("Strength");
                  
                  return (
                    <li key={idx} className={`p-5 rounded-2xl text-sm border flex gap-3 items-start ${
                      isRisk ? "bg-red-950/30 border-red-900/50 text-red-200" 
                      : isOpp ? "bg-blue-950/30 border-blue-900/50 text-blue-200"
                      : isStrength ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-200"
                      : "bg-gray-800/50 border-gray-700 text-gray-300"
                    }`}>
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${isRisk ? "bg-red-400" : isOpp ? "bg-blue-400" : isStrength ? "bg-emerald-400" : "bg-gray-400"}`} />
                      <span className="font-medium leading-relaxed">{insight}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl">
               <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4" /> ML Forecast
              </h3>
              {prediction !== null ? (
                <>
                  <div className="text-sm font-medium text-gray-400 mb-1">Expected Views for Next Episodes</div>
                  <div className="text-5xl font-black text-white tracking-tight mb-2">
                    {prediction.toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="text-sm font-medium text-gray-400 py-4 leading-relaxed border border-dashed border-gray-600 rounded-xl p-4 bg-gray-900/50">
                  <span className="block text-white mb-1"><AlertCircle className="inline-block w-4 h-4 mr-1 text-gray-400"/> Forecast unavailable</span>
                  due to insufficient time-series data
                </div>
              )}
            </div>
          </motion.div>

          {/* Radar & Genre Row */}
          <motion.div variants={fadeUpVariants} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
             <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col items-center w-full min-w-0">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2 w-full text-left text-gray-400">
                  Consistency Matrix
                </h3>
                <div className="w-full h-[280px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip content={<CustomRadarTooltip />} />
                      <Radar name="Creator" dataKey="value" stroke="#34D399" strokeWidth={2} fill="#34D399" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl w-full min-w-0">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 w-full text-left text-gray-400">
                  Genre Performance
                </h3>
                <div className="w-full h-[250px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genreData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="genre" type="category" stroke="#9CA3AF" tick={{fill:'#9CA3AF', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#1F2937'}} contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px'}} />
                      <Bar dataKey="views" fill="#818CF8" radius={[0, 4, 4, 0]}>
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#818CF8', '#A78BFA', '#34D399', '#FBBF24'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </motion.div>

        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
          <motion.div variants={fadeUpVariants} className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl w-full min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-3 text-gray-400">
              <TrendingUp className="text-blue-400 w-4 h-4" />
              Views Progression
            </h3>
            <div className="w-full h-[250px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={viewsData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="episode" stroke="#9CA3AF" tickLine={false} axisLine={false} tick={{fontSize: 12}}>
                     <Label value="Episode Number" offset={-10} position="insideBottom" fill="#9CA3AF" fontSize={12} />
                  </XAxis>
                  <YAxis stroke="#9CA3AF" tickLine={false} axisLine={false} tickFormatter={formatNum} tick={{fontSize: 12}}>
                     <Label value="Views" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#9CA3AF" fontSize={12} />
                  </YAxis>
                  <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px'}} />
                  <Line type="monotone" dataKey="views" name="Views" stroke="#60A5FA" strokeWidth={3} dot={{r: 4, fill: '#1E3A8A', strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={fadeUpVariants} className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl w-full min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-3 text-gray-400">
              <Target className="text-orange-400 w-4 h-4" />
              Completion Rate %
            </h3>
            <div className="w-full h-[250px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={compData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <defs>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="episode" stroke="#9CA3AF" tick={false} tickLine={false} axisLine={false}>
                     <Label value="Episode Number" offset={-10} position="insideBottom" fill="#9CA3AF" fontSize={12} />
                  </XAxis>
                  <YAxis domain={[0, 100]} stroke="#9CA3AF" tickLine={false} axisLine={false} tick={{fontSize: 12}}>
                     <Label value="Completion (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#9CA3AF" fontSize={12} />
                  </YAxis>
                  <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px'}} />
                  <Area type="monotone" dataKey="completion" name="Completion Rate (%)" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={fadeUpVariants} className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl md:col-span-2 w-full min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-3 text-gray-400">
              <Activity className="text-purple-400 w-4 h-4" />
              Views vs Episode Length
            </h3>
            <div className="w-full h-[300px] min-w-0 overflow-x-auto">
              <div className="min-w-[500px] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                     <XAxis type="number" dataKey="duration" name="Duration (s)" stroke="#9CA3AF" tick={{fontSize: 12}} tickLine={false} axisLine={false}>
                        <Label value="Duration (seconds)" offset={-10} position="insideBottom" fill="#9CA3AF" fontSize={12} />
                     </XAxis>
                     <YAxis type="number" dataKey="views" name="Views" stroke="#9CA3AF" tickFormatter={formatNum} tick={{fontSize: 12}} tickLine={false} axisLine={false}>
                        <Label value="Views" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#9CA3AF" fontSize={12} />
                     </YAxis>
                     <ZAxis type="category" dataKey="name" name="Series" />
                     <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px'}} />
                     <Scatter name="Episodes" data={scatterData} fill="#A78BFA" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}
