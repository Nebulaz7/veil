import React from "react";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <div className="relative max-h-[100vh] md:max-h-[80vh] w-full bg-[rgb(25, 26, 31)] mb-0">
      {/* Background Image - Full Screen */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/hero-bg.png"
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen md:max-h-[85vh] w-full">
        {/* Content Section */}
        <div className="w-full max-w-4xl mx-auto md:mt-0 md:pt-0 md:text-center p-6 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Engage Your Audience in Real Time
            <br />
            <span className="bg-[#f5f5f5] bg-clip-text text-transparent">
              No Downloads, No Signups
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join the conversation in real time — no login, no fuss. Just your
            name and your thoughts.
          </p>

          <div className="flex justify-center">
            <Link
              href="/get-started"
              className="group relative px-8 py-4 bg-[#0f0f0f] cursor-pointer text-white font-semibold rounded-full shadow-lg border-none hover:-translate-y-1 transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0  bg-[#1a1a1a] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black opacity-30"></div>
    </div>
  );
};

export default Hero;
