import { motion } from "framer-motion";
import { 
  Code, 
  Server, 
  Cloud, 
  Smartphone, 
  Palette, 
  Settings 
} from "lucide-react";

export default function Skills() {
  const skills = [
    {
      icon: <Code className="text-3xl" />,
      title: "Frontend Development",
      description: "Creating responsive and interactive user interfaces",
      technologies: ["React", "Vue.js", "TypeScript", "Tailwind CSS"]
    },
    {
      icon: <Server className="text-3xl" />,
      title: "Backend Development",
      description: "Building scalable and secure server-side applications",
      technologies: ["Node.js", "Python", "PostgreSQL", "MongoDB"]
    },
    {
      icon: <Cloud className="text-3xl" />,
      title: "Cloud & DevOps",
      description: "Deploying and managing applications in the cloud",
      technologies: ["AWS", "Docker", "Kubernetes", "CI/CD"]
    },
    {
      icon: <Smartphone className="text-3xl" />,
      title: "Mobile Development",
      description: "Cross-platform mobile application development",
      technologies: ["React Native", "Flutter", "iOS", "Android"]
    },
    {
      icon: <Palette className="text-3xl" />,
      title: "UI/UX Design",
      description: "Designing user-centered digital experiences",
      technologies: ["Figma", "Adobe XD", "Sketch", "Prototyping"]
    },
    {
      icon: <Settings className="text-3xl" />,
      title: "Development Tools",
      description: "Modern tools for efficient development workflow",
      technologies: ["Git", "VS Code", "Webpack", "Jest"]
    }
  ];

  return (
    <section id="skills" className="py-20 bg-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <div className="animate-on-scroll">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary text-center mb-16">Skills & Technologies</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="text-accent mb-4">
                  {skill.icon}
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3">{skill.title}</h3>
                <p className="text-text-gray mb-4 text-sm">{skill.description}</p>
                <div className="flex flex-wrap gap-2">
                  {skill.technologies.map((tech, techIndex) => (
                    <span 
                      key={techIndex}
                      className="bg-secondary text-primary px-3 py-1 rounded-full text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
