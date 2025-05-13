import { Helmet } from "react-helmet";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>ReactSite - Modern React Templates</title>
        <meta name="description" content="A modern, responsive React template for your next web project. Build amazing React applications with our clean and professional design." />
      </Helmet>
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </>
  );
}
