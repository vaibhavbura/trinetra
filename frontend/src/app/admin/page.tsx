"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { triggerMlTraining, uploadCSV } from "@/lib/api";
import { Database, BrainCircuit, ActivitySquare, UploadCloud, FileText } from "lucide-react";

export default function AdminPage() {
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{message: string; insights?: string[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTrainModel = async () => {
    setIsLoading(true);
    setTrainingStatus("Training...");
    try {
      const res = await triggerMlTraining();
      setTrainingStatus(res.message);
    } catch (err: any) {
      setTrainingStatus(err.message || "Training failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadCSV(file);
      setUploadResult({
        message: res.message,
        insights: res.insights
      });
    } catch (err: any) {
      setUploadResult({ message: `Upload Failed: ${err.message}` });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            Admin
          </h1>
          <Link href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors">
            Home
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ML Controls */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden group">
            <h3 className="text-xl font-bold mb-4 z-10 relative flex items-center gap-2 text-blue-400">
              Machine Learning
            </h3>
            <p className="text-gray-400 mb-6 z-10 relative text-sm">
              Retrain the Views Predictor model explicitly.
            </p>
            
            <button
              onClick={handleTrainModel}
              disabled={isLoading}
              className="z-10 relative px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              {isLoading ? "Training..." : "Train Predictor"}
              <BrainCircuit className="w-4 h-4"/>
            </button>
            
            {trainingStatus && (
              <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded text-xs text-gray-400 font-mono z-10 relative">
                {trainingStatus}
              </div>
            )}
          </div>

          {/* Database Info */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden group">
            <h3 className="text-xl font-bold mb-4 z-10 relative flex items-center gap-2 text-blue-400">
              Storage
            </h3>
            <p className="text-gray-400 mb-6 z-10 relative leading-relaxed text-sm">
              Database is managed by <code className="bg-gray-900 text-gray-300 px-2 py-1 rounded">seed_data.py</code>.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-gray-900 rounded border border-gray-800 text-center">
                <div className="text-xl font-bold text-gray-100">PostgreSQL</div>
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-1">Provider</div>
              </div>
              <div className="p-4 bg-gray-900 rounded border border-gray-800 text-center">
                <div className="text-xl font-bold text-gray-100">SQLAlchemy</div>
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-1">ORM</div>
              </div>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden group">
            <h3 className="text-xl font-bold mb-4 z-10 relative flex items-center gap-2 text-blue-400">
              CSV Ingestion
            </h3>
            <p className="text-gray-400 mb-6 z-10 relative text-sm">
              Upload historical CSV files to auto-generate AI insights.
            </p>
            
            <div className="flex flex-col gap-4 z-10 relative">
              <label className={`w-full md:w-1/2 flex items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'border-blue-500 bg-blue-900/10' : 'border-gray-600 hover:border-gray-500 bg-gray-900/50 hover:bg-gray-700'}`}>
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <UploadCloud className={`w-8 h-8 ${isUploading ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
                  <span className="font-semibold">{isUploading ? 'Uploading...' : 'Select File'}</span>
                  <span className="text-xs">.csv formats only</span>
                </div>
                <input 
                  type="file" 
                  accept=".csv"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>

              {uploadResult && (
                <div className={`mt-4 p-5 rounded-lg border ${uploadResult.insights ? 'bg-gray-900 border-gray-700' : 'bg-red-900/20 border-red-900'}`}>
                  <div className="font-semibold flex items-center gap-2 mb-3 text-gray-200 text-sm">
                    <FileText className="w-5 h-5 text-gray-400"/> 
                    {uploadResult.message}
                  </div>
                  {uploadResult.insights && uploadResult.insights.length > 0 && (
                    <ul className="space-y-2 mt-2">
                      {uploadResult.insights.map((insight, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-300 bg-gray-800 px-3 py-2 rounded">
                          <span className="text-blue-400 font-bold">↳</span> {insight}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
