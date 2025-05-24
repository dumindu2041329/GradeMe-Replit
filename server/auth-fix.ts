  app.post("/api/auth/student/login", async (req, res) => {
    try {
      const { email, password }: LoginCredentials = req.body;
      
      console.log("Student login attempt:", { email });
      
      // Validate credentials
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // First check if this is a valid user with student role
      const user = await storage.getUserByEmail(email);
      console.log("User found:", user ? { id: user.id, email: user.email, role: user.role } : "No user found");
      
      // If user doesn't exist or is not a student, return an error
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      if (user.role !== "student") {
        console.log("User is not a student, role:", user.role);
        return res.status(403).json({ 
          message: "Access denied. Please use the admin login page instead." 
        });
      }
      
      // Check password directly first
      console.log("Password check:", user.password === password ? "Matches" : "Does not match");
      
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Get associated student record
      const student = await storage.getStudent(user.studentId || 0);
      console.log("Student record found:", student ? "Yes" : "No");
      
      if (!student) {
        return res.status(401).json({ message: "Student record not found" });
      }
      
      // First create a sanitized user object without the password
      const { password: _, ...userWithoutPassword } = user;
      
      // Store only the sanitized user object in the session
      req.session.user = userWithoutPassword;
      console.log("Student login successful");
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Student login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });