"use client";

import { Sparkles, Send, Bot } from "lucide-react";

export default function AIChatbotPage() {
  return (
    <div className="w-full h-full min-h-[80vh] flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground font-sans flex items-center justify-center gap-2">
          <Sparkles className="size-6 text-purple-400" /> AI Lab Chatbot
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">Database schema deployed by Claude Architect.</p>
      </div>
      
      <div className="w-full max-w-2xl glass-strong bg-aurora rounded-2xl p-6 border border-white/10 shadow-2xl h-[500px] flex flex-col relative overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shrink-0">
              <Bot className="size-4 text-purple-400" />
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 p-3 rounded-2xl rounded-tl-none text-sm text-slate-200">
              مرحباً! أنا المساعد الذكي الخاص بـ LabOS. قاعدة البيانات الخاصة بي (ai_chat_sessions و ai_chat_messages) تم بناؤها بنجاح وهي محمية بالكامل بواسطة RLS. كيف يمكنني مساعدتك اليوم؟
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 relative">
          <input 
            type="text" 
            placeholder="اكتب رسالتك هنا... (الواجهة تجريبية)" 
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
            disabled
          />
          <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 flex items-center justify-center transition-colors" disabled>
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
