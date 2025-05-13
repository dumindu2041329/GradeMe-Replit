import { Helmet } from "react-helmet";
import AboutHero from "@/components/about/AboutHero";
import AboutContent from "@/components/about/AboutContent";
import TeamSection from "@/components/about/TeamSection";

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Us - ReactSite</title>
        <meta name="description" content="Learn more about ReactSite and our mission to build modern, responsive React applications for businesses and individuals." />
      </Helmet>
      <AboutHero />
      <AboutContent />
      <TeamSection />
    </>
  );
}
