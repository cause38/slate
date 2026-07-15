import { LoginCard } from "@/components/auth/LoginCard";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <LoginCard errorCode={error} />
    </main>
  );
}
