import React from "react";
import Navbar from "../../components/LandingPage/Navbar";
import HeroSection from "../../components/LandingPage/HeroSection";
import SocialProof from "../../components/LandingPage/SocialProof";
import ProblemSection from "../../components/LandingPage/ProblemSection";
import SolutionSection from "../../components/LandingPage/SolutionSection";
import HowItWorks from "../../components/LandingPage/HowItWorks";
import BenefitsSection from "../../components/LandingPage/BenefitsSection"
import Testimonials from "../../components/LandingPage/Testimonials";
import CTA from "../../components/LandingPage/CTA";
import FAQ from "../../components/LandingPage/FAQ";
import Footer from "../../components/LandingPage/Footer";
import StickyCTA from "../../components/LandingPage/StickyCTA"



const LandingPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-white">

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <HeroSection />

      {/* SOCIAL PROOF */}
      <SocialProof />

      {/* PROBLEM SECTION */}
      <ProblemSection />

      {/* SOLUTION SECTION */}
      <SolutionSection />

      <HowItWorks />

      <BenefitsSection />

      <Testimonials />

      <CTA />

      <FAQ />

      <Footer />

      <StickyCTA />



    </div>
  );
};

export default LandingPage;