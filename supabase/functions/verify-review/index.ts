import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const USAR_GROUP_ID = 3108077;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Proxy Roblox avatar thumbnails so review cards can load them reliably.
  if (req.method === "GET") {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId || !/^\d+$/.test(userId)) {
      return response({ error: "Invalid Roblox user ID." }, 400);
    }

    const thumb = await fetch(
      "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" +
      encodeURIComponent(userId) +
      "&size=150x150&format=Png&isCircular=false"
    );

    if (!thumb.ok) {
      return response({ error: "Avatar lookup failed." }, 502);
    }

    const thumbData = await thumb.json();
    const imageUrl = thumbData?.data?.[0]?.imageUrl;

    if (!imageUrl) {
      return response({ error: "Avatar not available." }, 404);
    }

    return Response.redirect(imageUrl, 302);
  }

  if (req.method !== "POST") {
    return response({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim();
    const rating = Number(body.rating);
    const reviewText = String(body.review_text ?? "").trim();

    if (!username || username.length > 50) {
      return response({ error: "Enter a valid Roblox username." }, 400);
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return response({ error: "Rating must be between 1 and 5." }, 400);
    }

    if (reviewText.length < 10 || reviewText.length > 1000) {
      return response({ error: "Review must be between 10 and 1000 characters." }, 400);
    }

    const robloxLookup = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false,
      }),
    });

    if (!robloxLookup.ok) {
      return response({ error: "Roblox account lookup failed. Try again shortly." }, 502);
    }

    const robloxData = await robloxLookup.json();
    const user = robloxData?.data?.[0];

    if (!user?.id) {
      return response({ error: "Roblox username not found." }, 404);
    }

    const groupLookup = await fetch(
      `https://groups.roblox.com/v2/users/${encodeURIComponent(user.id)}/groups/roles`
    );

    if (!groupLookup.ok) {
      return response({ error: "USAR membership lookup failed. Try again shortly." }, 502);
    }

    const groupData = await groupLookup.json();
    const isMember = (groupData?.data ?? []).some(
      (entry: any) => Number(entry?.group?.id) === USAR_GROUP_ID
    );

    if (!isMember) {
      return response({ error: "That Roblox account is not a member of Zanance's USAR." }, 403);
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      user_id: null,
      roblox_user_id: String(user.id),
      roblox_username: user.name,
      rating,
      review_text: reviewText,
      status: "approved",
    });

    if (insertError) {
      console.error(insertError);
      return response({ error: "Review could not be submitted. Please try again." }, 500);
    }

    return response({
      ok: true,
      username: user.name,
      message: "Review submitted — now published.",
    });
  } catch (error) {
    console.error(error);
    return response({ error: "Unable to process the review right now." }, 500);
  }
});
