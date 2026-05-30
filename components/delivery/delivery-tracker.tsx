"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, CheckCircle, Package, Clock, MapPin, Phone } from "lucide-react";

const steps = [
  { id: 1, title: "Order Placed", icon: Package, description: "Lab has received the case details.", time: "09:00 AM" },
  { id: 2, title: "In Production", icon: Clock, description: "Milling and finishing in progress.", time: "10:30 AM" },
  { id: 3, title: "Out for Delivery", icon: Truck, description: "Driver is on the way to the clinic.", time: "02:15 PM" },
  { id: 4, title: "Delivered", icon: CheckCircle, description: "Successfully delivered and signed.", time: "Pending" },
];

export function DeliveryTracker() {
  const [currentStep, setCurrentStep] = useState(3);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 rounded-[2rem] glass-strong bg-aurora relative overflow-hidden shadow-2xl border border-white/20 dark:border-white/10">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl -z-10 mix-blend-overlay" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl -z-10 mix-blend-overlay" />

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Delivery Status
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Case tracking #OD-8924</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-2 bg-white/40 dark:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 shadow-sm"
        >
          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-bounce" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Live GPS</span>
        </motion.div>
      </div>

      <div className="relative pl-2">
        {/* Main Vertical Track Line */}
        <div className="absolute left-[31px] top-6 bottom-10 w-0.5 bg-slate-200 dark:bg-slate-700/50 z-0" />

        <div className="space-y-8 relative z-10">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isPending = step.id > currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
                className="flex items-start gap-6"
              >
                {/* Node & Icon */}
                <div className="relative flex flex-col items-center">
                  <motion.div
                    layout
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md transition-colors duration-500 ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : isCurrent
                        ? "bg-white dark:bg-slate-800 text-blue-600 ring-4 ring-blue-600/20"
                        : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-400"
                    }`}
                  >
                    <Icon className={`w-7 h-7 ${isCurrent ? "animate-pulse" : ""}`} strokeWidth={isCurrent ? 2.5 : 2} />
                  </motion.div>

                  {/* Active Track Line fill */}
                  {index < steps.length - 1 && (isCompleted || isCurrent) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "100%" }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`absolute top-16 w-0.5 -z-10 ${isCompleted ? 'bg-blue-600' : 'bg-gradient-to-b from-blue-600 to-transparent'}`}
                    />
                  )}
                </div>

                {/* Content area */}
                <div className={`flex-1 pt-3 pb-2 transition-opacity duration-500 ${isPending ? "opacity-50" : "opacity-100"}`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <h3 className={`text-xl font-bold tracking-tight ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-100"}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{step.description}</p>
                    </div>
                    <span className={`inline-flex self-start text-xs font-bold px-3 py-1 rounded-full ${
                      isCompleted ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                      isCurrent ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" :
                      "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {step.time}
                    </span>
                  </div>
                  
                  {/* Expandable driver details for 'Out for Delivery' step */}
                  <AnimatePresence>
                    {isCurrent && step.id === 3 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 shadow-inner backdrop-blur-md flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img 
                                src="https://i.pravatar.cc/150?img=11" 
                                alt="Driver" 
                                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Ahmed Hassan</p>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Driver • Toyota Yaris</p>
                            </div>
                          </div>
                          <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-lg shadow-blue-600/30">
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Demo Controls (Only for demonstration purposes) */}
      <div className="mt-10 flex gap-3 justify-center border-t border-slate-200/50 dark:border-slate-700/50 pt-6">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all backdrop-blur-md border border-white/20 shadow-sm"
        >
          Previous State
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl transition-all shadow-md"
        >
          Next State
        </button>
      </div>
    </div>
  );
}
