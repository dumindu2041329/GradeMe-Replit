import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";

export default function Projects() {
  const projects = [
    {
      title: "E-commerce Dashboard",
      description: "A comprehensive admin dashboard for managing online stores with real-time analytics and inventory management.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      technologies: ["React", "Node.js", "MongoDB"],
      liveDemo: "#",
      github: "#"
    },
    {
      title: "Task Management App",
      description: "A collaborative project management tool with drag-and-drop functionality and team collaboration features.",
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      technologies: ["Vue.js", "Express.js", "PostgreSQL"],
      liveDemo: "#",
      github: "#"
    },
    {
      title: "Social Media Platform",
      description: "A modern social networking platform with real-time messaging, content sharing, and community features.",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      technologies: ["React Native", "GraphQL", "Redis"],
      liveDemo: "#",
      github: "#"
    },
    {
      title: "Weather Forecast App",
      description: "A beautiful weather application with location-based forecasts, interactive maps, and detailed meteorological data.",
      image: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      technologies: ["Flutter", "API Integration", "Maps"],
      liveDemo: "#",
      github: "#"
    },
    {
      title: "Fitness Tracker",
      description: "A comprehensive fitness tracking app with workout planning, progress monitoring, and social features.",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      technologies: ["React Native", "Python", "ML"],
      liveDemo: "#",
      github: "#"
    },
    {
      title: "Investment Portfolio",
      description: "A sophisticated investment tracking platform with real-time market data and portfolio analytics.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      technologies: ["Angular", "Java", "AWS"],
      liveDemo: "#",
      github: "#"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="animate-on-scroll">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary text-center mb-16">Featured Projects</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-primary mb-3">{project.title}</h3>
                  <p className="text-text-gray mb-4 text-sm">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, techIndex) => (
                      <span 
                        key={techIndex}
                        className="bg-secondary text-primary px-2 py-1 rounded text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <a 
                      href={project.liveDemo} 
                      className="flex items-center gap-1 text-accent hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Live Demo
                    </a>
                    <a 
                      href={project.github} 
                      className="flex items-center gap-1 text-accent hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <motion.button
              className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All Projects
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
