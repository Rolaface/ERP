import React from "react";
import Navbar from "../../components/LandingPage/Navbar";
import HeroSection from "../../components/LandingPage/HeroSection";
import SocialProof from "../../components/LandingPage/SocialProof";
import ProblemSection from "../../components/LandingPage/ProblemSection";
// import SolutionSection from "../../components/LandingPage/SolutionSection";
import HowItWorks from "../../components/LandingPage/HowItWorks";
import BenefitsSection from "../../components/LandingPage/BenefitsSection";
// import CTA from "../../components/LandingPage/CTA";
// import FAQ from "../../components/LandingPage/FAQ";
import Footer from "../../components/LandingPage/Footer";

const LandingPage: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto bg-white">


      <Navbar />


      <HeroSection />


      <SocialProof />


      <ProblemSection />


      {/* <SolutionSection /> */}

      <HowItWorks />

      <BenefitsSection />

      {/* <CTA /> */}

      {/* <FAQ /> */}

      <Footer />

    </div>
  );
};

export default LandingPage;