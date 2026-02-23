"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Database, Sparkles, TrendingUp, UploadCloud, FileText } from "lucide-react";
import { uploadCSV } from "@/lib/api";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    message: string; 
    insights?: string[];
    total_creators?: number;
    total_series?: number;
    avg_completion?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadCSV(file);
      setUploadResult({
        message: res.message,
        insights: res.insights,
        total_creators: res.total_creators,
        total_series: res.total_series,
        avg_completion: res.avg_completion
      });
    } catch (err: any) {
      setUploadResult({ message: `Upload Failed: ${err.message}` });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 overflow-hidden relative">

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-screen">
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-800 text-gray-300 font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" /> TRINETRA V2
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-white">
            Creator Intelligence
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Real-time analytics and predictive ML forecasting.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
        >
          {/* Card 1: Leaderboard */}
          <motion.div variants={itemVariants} className="h-full">
            <Link href="/leaderboard" className="block h-full group">
              <div className="h-full min-h-[250px] bg-gray-800 border border-gray-700 rounded-2xl p-6 md:p-8 hover:border-gray-500 hover:bg-gray-700 transition-all duration-300 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Leaderboard</h2>
                <p className="text-gray-400 text-sm">Real-time rank velocity.</p>
              </div>
            </Link>
          </motion.div>

          {/* Card 2: Upload CSV */}
          <motion.div variants={itemVariants} className="h-full">
            <div className="h-full min-h-[250px] bg-gray-800 border border-gray-700 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 transition-transform">
                <Database className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-4">Ingest Data</h2>
              
              <label className={`w-full flex items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'border-emerald-500 bg-emerald-900/10' : 'border-gray-600 hover:border-gray-500 bg-gray-900/50 hover:bg-gray-700'}`}>
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <UploadCloud className={`w-6 h-6 ${isUploading ? 'text-emerald-500 animate-pulse' : 'text-gray-500'}`} />
                  <span className="font-semibold text-sm">{isUploading ? 'Uploading...' : 'Select CSV File'}</span>
                </div>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>

              {uploadResult && (
                <div className={`mt-4 p-4 text-left w-full rounded-lg border text-sm max-h-60 overflow-y-auto ${uploadResult.insights ? 'bg-gray-900 border-gray-700' : 'bg-red-900/20 border-red-900'}`}>
                  <div className="font-semibold flex items-center gap-2 mb-3 text-gray-200 text-xs">
                    <FileText className="w-4 h-4 text-gray-400"/> 
                    {uploadResult.message}
                  </div>

                  {uploadResult.total_creators !== undefined && (
                    <div className="grid grid-cols-3 gap-2 mb-4 border-b border-gray-800 pb-4">
                      <div className="bg-gray-800/50 p-2 rounded text-center">
                        <div className="text-xl font-bold text-white">{uploadResult.total_creators}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Creators</div>
                      </div>
                      <div className="bg-gray-800/50 p-2 rounded text-center">
                        <div className="text-xl font-bold text-white">{uploadResult.total_series}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Series</div>
                      </div>
                      <div className="bg-gray-800/50 p-2 rounded text-center">
                        <div className="text-xl font-bold text-white">{uploadResult.avg_completion?.toFixed(1)}%</div>
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Avg Complete</div>
                      </div>
                    </div>
                  )}

                  {uploadResult.insights && uploadResult.insights.length > 0 && (
                    <ul className="space-y-1.5">
                      {uploadResult.insights.map((insight, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-gray-300">
                          <span className="text-blue-400 font-bold">↳</span> {insight}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Global Footer Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 flex items-center gap-6 border-t border-gray-800 pt-8 w-full max-w-2xl justify-center text-xs font-semibold text-gray-500 uppercase tracking-widest"
        >
          <div className="flex items-center gap-2"><Database className="w-4 h-4"/> Live</div>
          <div className="flex items-center gap-2 text-blue-400/80"><UploadCloud className="w-4 h-4"/> Custom Data</div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4"/> ML Model</div>
        </motion.div>

      </div>
    </main>
  );
}
