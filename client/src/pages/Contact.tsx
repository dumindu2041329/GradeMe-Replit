import { Helmet } from "react-helmet";
import ContactHero from "@/components/contact/ContactHero";
import ContactForm from "@/components/contact/ContactForm";

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact Us - ReactSite</title>
        <meta name="description" content="Get in touch with the ReactSite team. We'd love to hear from you and discuss how we can help with your next project." />
      </Helmet>
      <ContactHero />
      <ContactForm />
    </>
  );
}
