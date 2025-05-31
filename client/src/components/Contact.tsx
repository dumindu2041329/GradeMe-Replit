import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Linkedin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically send the form data to your backend
    toast({
      title: "Thank you for your message!",
      description: "I'll get back to you soon."
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-20 bg-secondary">
      <div className="max-w-4xl mx-auto px-6">
        <div className="animate-on-scroll">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary text-center mb-16">Let's Work Together</h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold text-primary mb-6">Get In Touch</h3>
              <p className="text-text-gray mb-8 leading-relaxed">
                I'm always interested in new opportunities and exciting projects. 
                Whether you have a question or just want to say hello, feel free to reach out!
              </p>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-accent text-white p-3 rounded-lg mr-4">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Email</h4>
                    <p className="text-text-gray">alex.johnson@example.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-accent text-white p-3 rounded-lg mr-4">
                    <Linkedin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">LinkedIn</h4>
                    <p className="text-text-gray">linkedin.com/in/alexjohnson</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-accent text-white p-3 rounded-lg mr-4">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">GitHub</h4>
                    <p className="text-text-gray">github.com/alexjohnson</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="bg-white rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-primary mb-2">Name *</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-primary mb-2">Email *</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium text-primary mb-2">Subject</Label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Project Discussion"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-primary mb-2">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project..."
                    className="w-full resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-blue-700 text-white">
                  Send Message
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
