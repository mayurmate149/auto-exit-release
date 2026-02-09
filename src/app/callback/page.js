"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = params.get("RequestToken");
    if (!token) {
      setErr("No RequestToken found in URL");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/5paisa/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestToken: token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErr("Exchange failed: " + JSON.stringify(data));
          setLoading(false);
          return;
        }
        // success; hard refresh to dashboard
        window.location.href = "/positions";
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params, router]);

  if (loading) return <div>Processing 5paisa login...</div>;
  if (err) return <div>Error: {err}</div>;
  return <div>Redirecting...</div>;
}
