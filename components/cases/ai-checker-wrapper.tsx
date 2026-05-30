"use client";

import { useState } from "react";
import { AIScanButton } from "@/components/ui/ai-scan-button";
import { checkCaseForMissingInfoAction } from "@/app/actions/ai-actions";

interface AICheckerWrapperProps {
  caseNotes: string;
  workType: string;
}

export function AICheckerWrapper({ caseNotes, workType }: AICheckerWrapperProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await checkCaseForMissingInfoAction(caseNotes || "", workType);
      if (response.success) {
        setResult(response.data);
      } else {
        alert("Error scanning case: " + response.error);
      }
    } catch (e) {
      alert("Error scanning case.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <AIScanButton onClick={handleScan} isLoading={loading}>
        AI Info Check
      </AIScanButton>

      {result && (
        <div className="absolute right-0 mt-14 z-50 w-80 p-4 rounded-xl glass-strong border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={result.isComplete ? "text-emerald-400" : "text-amber-400"}>
              {result.isComplete ? "✅ Complete" : "⚠️ Missing Info"}
            </span>
          </div>
          {result.missingFields?.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-red-400">Missing Required:</p>
              <ul className="list-disc pl-4 text-xs text-red-300">
                {result.missingFields.map((f: string) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {result.recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-400">Recommendations:</p>
              <ul className="list-disc pl-4 text-xs text-blue-300">
                {result.recommendations.map((r: string) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <button 
            onClick={() => setResult(null)}
            className="mt-3 text-xs text-white/50 hover:text-white"
          >
            Close AI Result
          </button>
        </div>
      )}
    </div>
  );
}
