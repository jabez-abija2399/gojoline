import { getAuth } from "@/lib/auth/server";

const unavailable = () => new Response(null, { status: 503 });

export async function GET(request: Request) {
  const auth = getAuth();
  return auth ? auth.handler(request) : unavailable();
}

export async function POST(request: Request) {
  const auth = getAuth();
  return auth ? auth.handler(request) : unavailable();
}
