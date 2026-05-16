import BotDetailScreen from '@/components/v3/screens/BotDetail';

type Params = { botId: string };

// Next.js 15: route params are async — page receives a Promise.
export default async function V3BotDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { botId } = await params;
  return <BotDetailScreen botId={botId} />;
}
