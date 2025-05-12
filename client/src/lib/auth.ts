import { apiRequest } from "./queryClient";
import { User } from "@shared/schema";

interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  const data = await response.json();
  return data;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getSession(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Failed to fetch session");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}
