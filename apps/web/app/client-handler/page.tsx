"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientHandler() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const handleAuthRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (token) {
        setStatus("Token found, storing...");
        try {
          localStorage.setItem("auth_token", token);
          setStatus("Redirecting to dashboard...");
          
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } catch (error) {
          console.error("Error storing token:", error);
          setStatus("Authentication error");
        }
      } else {
        console.log("No token found, redirecting to login");
        setStatus("No token found, redirecting...");
        router.push("/get-started");
      }
    };
    
    handleAuthRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(25, 26, 31)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#af1aff] mx-auto mb-4"></div>
        <p className="text-white text-lg">Checking authentication... {status}</p>
      </div>
    </div>
  );
}