import LuceDiFedeHome from "@/components/main/LuceDiFedeHome";

async function getEvents() {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://amenguide-backend-775250805671.us-west1.run.app";
  try {
    const res = await fetch(`${backendUrl}/events`, {
      next: { revalidate: false }, // revalidatePath('/') 로만 무효화
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const events = await getEvents();
  return (
    <main>
      <LuceDiFedeHome initialEvents={events} />
    </main>
  );
}
