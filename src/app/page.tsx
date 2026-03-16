"use client";

import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/portal");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return <div>Loading...</div>;
}
