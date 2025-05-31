import { motion } from "framer-motion";

export default function Hero() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-white pt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-primary mb-6 leading-tight">
              Full Stack<br />
              <span className="text-accent">Developer</span>
            </h1>
            <p className="text-xl text-text-gray mb-8 leading-relaxed">
              I craft digital experiences that blend beautiful design with robust functionality. 
              Specializing in modern web technologies and user-centered development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => scrollToSection('#projects')}
                className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 text-center"
              >
                View My Work
              </button>
              <button
                onClick={() => scrollToSection('#contact')}
                className="border-2 border-accent text-accent px-8 py-3 rounded-lg font-semibold hover:bg-accent hover:text-white transition-all duration-300 text-center"
              >
                Get In Touch
              </button>
            </div>
          </motion.div>
          <motion.div 
            className="lg:w-1/2 flex justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=500" 
              alt="Alex Johnson - Full Stack Developer" 
              className="w-80 h-80 rounded-full object-cover shadow-2xl border-8 border-white"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
