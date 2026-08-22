// Edge Function : verifie une image de banniere fraichement uploadee avec
// la moderation IA d'OpenAI. Si l'image est jugee inappropriee, elle est
// supprimee du bucket et un signalement est cree pour que les admins aient
// une trace des tentatives.
//
// A deployer via le dashboard Supabase (Edge Functions > New Function,
// nom "moderate-banner", colle ce fichier) ou via la CLI :
//   npx supabase functions deploy moderate-banner --project-ref <ref>
//
// Necessite un secret OPENAI_API_KEY (Dashboard > Edge Functions > Secrets,
// ou `npx supabase secrets set OPENAI_API_KEY=sk-...`). SUPABASE_URL,
// SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournis
// automatiquement par Supabase, pas besoin de les configurer.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      return json({ error: 'OPENAI_API_KEY manquant cote serveur.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Non authentifie.' }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Non authentifie.' }, 401);

    const { path } = await req.json();
    if (typeof path !== 'string' || !path.startsWith(`${user.id}/`)) {
      return json({ error: 'Chemin invalide.' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/banners/${path}`;

    const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: [{ type: 'image_url', image_url: { url: publicUrl } }],
      }),
    });

    if (!moderationRes.ok) {
      console.error('Erreur OpenAI moderation', await moderationRes.text());
      return json({ error: 'Service de moderation indisponible, reessaie plus tard.' }, 502);
    }

    const moderationBody = await moderationRes.json();
    const result = moderationBody.results?.[0];
    const flagged = Boolean(result?.flagged);

    if (flagged) {
      await admin.storage.from('banners').remove([path]);

      const flaggedCategories = Object.entries(result.categories ?? {})
        .filter(([, isFlagged]) => Boolean(isFlagged))
        .map(([category]) => category);

      await admin.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: user.id,
        reason: 'Image de banniere refusee automatiquement (moderation IA)',
        details: `Categories detectees : ${flaggedCategories.join(', ') || 'non precise'}`,
      });

      return json({ allowed: false, categories: flaggedCategories });
    }

    return json({ allowed: true });
  } catch (error) {
    console.error(error);
    return json({ error: 'Erreur interne du service de moderation.' }, 500);
  }
});
