import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token is invalid, try to refresh
          return await refreshToken();
        }

        return response.json();
      } catch (error) {
        // Try to refresh token
        return await refreshToken();
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    }

    try {
      const response = await apiRequest("POST", "/api/auth/refresh", {
        refreshToken,
      });
      const data = await response.json();

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // Retry getting user info with new token
      const userResponse = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      });

      if (userResponse.ok) {
        return userResponse.json();
      }

      throw new Error("Failed to get user info");
    } catch (error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    queryClient.clear();
    setAuthState({ user: null, loading: false });
  };

  useEffect(() => {
    setAuthState({
      user,
      loading: isLoading,
    });
  }, [user, isLoading]);

  return {
    user: authState.user,
    loading: authState.loading,
    logout,
  };
}
