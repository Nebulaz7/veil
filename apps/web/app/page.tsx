import FeatureSection from "./components/FeatureSection";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import NavBar from "./components/Navbar";
// import FeatureSection from "./components/FeatureSection";

export default function Home() {
  return (
    <div>
      <NavBar />
      <Hero />
      <FeatureSection />
      <Footer />
    </div>
  );
}
