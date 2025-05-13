import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Rocket, Sprout } from "lucide-react";
import { fadeIn, pageAnimation, staggerContainer } from "@/lib/motion";

const About = () => {
  return (
    <motion.div
      variants={pageAnimation}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="py-4"
    >
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Learn more about our team and our mission
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-10 mb-16">
        <motion.div 
          className="flex-1"
          variants={fadeIn("right")}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-gray-600 mb-4">
            We started with a simple mission: to make building beautiful, accessible web applications easier for developers of all skill levels. Our team of passionate engineers and designers has worked tirelessly to create tools and components that streamline the development process.
          </p>
          <p className="text-gray-600 mb-4">
            With years of experience building web applications for companies of all sizes, we understand the challenges developers face when trying to balance speed, quality, and maintainability.
          </p>
          <p className="text-gray-600">
            Our platform is the result of countless hours of research, development, and refinement, all aimed at solving real problems for developers building modern web applications.
          </p>
        </motion.div>
        <motion.div 
          className="flex-1"
          variants={fadeIn("left", 0.2)}
          initial="hidden"
          animate="visible"
        >
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600" 
            alt="Team collaborating on code" 
            className="rounded-xl shadow-lg w-full h-auto"
          />
        </motion.div>
      </div>

      {/* Values Section */}
      <motion.section 
        className="mb-16"
        variants={fadeIn("up")}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <h2 className="text-2xl font-bold mb-8 text-center">Our Values</h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div variants={fadeIn("up")}>
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Heart className="text-primary h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Accessibility First</h3>
                <p className="text-gray-600">
                  We believe the web should be accessible to everyone, which is why we build with accessibility as a core principle, not an afterthought.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn("up", 0.1)}>
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <Rocket className="text-secondary h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Developer Experience</h3>
                <p className="text-gray-600">
                  We're dedicated to creating tools that are intuitive, well-documented, and a joy to use, helping developers build better applications faster.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn("up", 0.2)}>
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Sprout className="text-green-600 h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Continuous Improvement</h3>
                <p className="text-gray-600">
                  We're committed to constantly refining and improving our tools based on user feedback and the latest web development best practices.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Team Section */}
      <motion.section
        variants={fadeIn("up")}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <h2 className="text-2xl font-bold mb-8 text-center">Meet Our Team</h2>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div variants={fadeIn("up")}>
            <Card className="overflow-hidden h-full">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400" 
                alt="Team member - Sarah Johnson" 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">Sarah Johnson</h3>
                <p className="text-gray-600 text-sm">Lead Designer</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn("up", 0.1)}>
            <Card className="overflow-hidden h-full">
              <img 
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400" 
                alt="Team member - Michael Chen" 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">Michael Chen</h3>
                <p className="text-gray-600 text-sm">Frontend Lead</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn("up", 0.2)}>
            <Card className="overflow-hidden h-full">
              <img 
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400" 
                alt="Team member - Sophia Martinez" 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">Sophia Martinez</h3>
                <p className="text-gray-600 text-sm">Product Manager</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn("up", 0.3)}>
            <Card className="overflow-hidden h-full">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400" 
                alt="Team member - David Kim" 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">David Kim</h3>
                <p className="text-gray-600 text-sm">Backend Developer</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.section>
    </motion.div>
  );
};

export default About;
