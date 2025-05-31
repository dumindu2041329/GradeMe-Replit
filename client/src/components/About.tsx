import { MapPin, GraduationCap, Code, Layers } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="animate-on-scroll">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary text-center mb-16">About Me</h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-primary mb-6">My Journey</h3>
              <p className="text-text-gray mb-6 leading-relaxed">
                With over 5 years of experience in full-stack development, I've had the privilege of working 
                with startups and established companies to bring their digital visions to life. My passion 
                lies in creating seamless user experiences backed by solid, scalable architecture.
              </p>
              <p className="text-text-gray mb-6 leading-relaxed">
                I believe in writing clean, maintainable code and staying current with the latest 
                technologies. When I'm not coding, you'll find me contributing to open source projects 
                or mentoring junior developers.
              </p>
              <div className="flex flex-wrap gap-4">
                <span className="bg-secondary text-primary px-4 py-2 rounded-full text-sm font-medium">Problem Solver</span>
                <span className="bg-secondary text-primary px-4 py-2 rounded-full text-sm font-medium">Team Player</span>
                <span className="bg-secondary text-primary px-4 py-2 rounded-full text-sm font-medium">Continuous Learner</span>
              </div>
            </div>
            <div className="bg-secondary rounded-2xl p-8">
              <h4 className="text-xl font-semibold text-primary mb-6">Quick Facts</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="text-accent mr-3 h-5 w-5" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center">
                  <GraduationCap className="text-accent mr-3 h-5 w-5" />
                  <span>Computer Science, Stanford University</span>
                </div>
                <div className="flex items-center">
                  <Code className="text-accent mr-3 h-5 w-5" />
                  <span>5+ Years Experience</span>
                </div>
                <div className="flex items-center">
                  <Layers className="text-accent mr-3 h-5 w-5" />
                  <span>50+ Projects Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
