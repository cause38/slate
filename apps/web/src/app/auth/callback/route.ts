import { ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email?.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=domain_not_allowed`);
  }

  // 첫 로그인 시 Member로 자동 가입 (PRD 3.9)
  const { error: upsertError } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
    name:
      (user.user_metadata.full_name as string | undefined) ??
      (user.user_metadata.name as string | undefined) ??
      user.email.split("@")[0],
    avatar_url: (user.user_metadata.avatar_url as string | undefined) ?? null,
  });

  if (upsertError) {
    console.error("users 자동 가입 실패", upsertError);
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=signup_failed`);
  }

  return NextResponse.redirect(`${origin}/`);
}
