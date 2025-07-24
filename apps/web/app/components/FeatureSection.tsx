import React from "react";
import { MessageCircleMore, ChartNoAxesColumn, LayoutGrid } from "lucide-react";

const FeatureSection = () => {
  return (
    <section className="relative py-0 md:py-24 px-4 bg-gradient-to-b from-transparent to-purple-900/90">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need for
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}
              Engagement
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Powerful features designed to make your events more interactive and
            engaging
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Real-time Q&A Card */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-6 md:p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircleMore size={32} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors duration-300">
                Real-time Q&A
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                Attendees can submit questions and upvote others. Moderators can
                manage and prioritize questions in real-time.
              </p>
            </div>
          </div>

          {/* Live Polling Card */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-6 md:p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ChartNoAxesColumn size={32} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors duration-300">
                Live Polling
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                Create interactive polls with instant results. Perfect for
                gathering feedback and engaging your audience.
              </p>
            </div>
          </div>

          {/* Easy Access Card */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-6 md:p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl md:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <LayoutGrid size={32} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-green-200 transition-colors duration-300">
                Easy Access
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                No registration required. Participants join instantly via QR
                code or room link with just their name.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
