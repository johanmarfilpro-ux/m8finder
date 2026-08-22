// Edge Function : verifie une image de banniere fraichement uploadee avec
// la moderation IA de Sightengine (nudite, contenu choquant/offensant,
// violence). Si l'image est jugee inappropriee, elle est supprimee du
// bucket et un signalement est cree pour que les admins aient une trace
// des tentatives.
//
// A deployer via le dashboard Supabase (Edge Functions > New Function,
// nom "moderate-banner", colle ce fichier) ou via la CLI :
//   npx supabase functions deploy moderate-banner --project-ref <ref>
//
// Necessite deux secrets (Dashboard > Edge Functions > Secrets, ou
// `npx supabase secrets set`) : SIGHTENGINE_API_USER et
// SIGHTENGINE_API_SECRET, recuperables gratuitement sur
// https://sightengine.com (inscription par email, sans carte bancaire).
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont
// fournis automatiquement par Supabase, pas besoin de les configurer.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Seuils au-dela desquels une image est consideree comme interdite.
const THRESHOLDS = {
  sexual_activity: 0.5,
  sexual_display: 0.5,
  erotica: 0.5,
  very_suggestive: 0.6,
  offensive: 0.5,
  gore: 0.5,
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
    const SIGHTENGINE_API_USER = Deno.env.get('SIGHTENGINE_API_USER');
    const SIGHTENGINE_API_SECRET = Deno.env.get('SIGHTENGINE_API_SECRET');

    if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
      return json({ error: 'Identifiants Sightengine manquants cote serveur.' }, 500);
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

    const params = new URLSearchParams({
      url: publicUrl,
      models: 'nudity-2.1,offensive,gore',
      api_user: SIGHTENGINE_API_USER,
      api_secret: SIGHTENGINE_API_SECRET,
    });

    const modRes = await fetch(`https://api.sightengine.com/1.0/check.json?${params.toString()}`);

    if (!modRes.ok) {
      console.error('Erreur Sightengine (HTTP)', await modRes.text());
      return json({ error: 'Service de moderation indisponible, reessaie plus tard.' }, 502);
    }

    const modBody = await modRes.json();
    if (modBody.status !== 'success') {
      console.error('Erreur Sightengine (reponse)', JSON.stringify(modBody));
      return json({ error: 'Service de moderation indisponible, reessaie plus tard.' }, 502);
    }

    const nudity = modBody.nudity ?? {};
    const flaggedCategories: string[] = [];

    if ((nudity.sexual_activity ?? 0) > THRESHOLDS.sexual_activity) flaggedCategories.push('nudite/activite sexuelle');
    if ((nudity.sexual_display ?? 0) > THRESHOLDS.sexual_display) flaggedCategories.push('nudite');
    if ((nudity.erotica ?? 0) > THRESHOLDS.erotica) flaggedCategories.push('contenu erotique');
    if ((nudity.very_suggestive ?? 0) > THRESHOLDS.very_suggestive) flaggedCategories.push('contenu suggestif');
    if ((modBody.offensive?.prob ?? 0) > THRESHOLDS.offensive) flaggedCategories.push('contenu offensant');
    if ((modBody.gore?.prob ?? 0) > THRESHOLDS.gore) flaggedCategories.push('violence/gore');

    if (flaggedCategories.length > 0) {
      await admin.storage.from('banners').remove([path]);

      await admin.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: user.id,
        reason: 'Image de banniere refusee automatiquement (moderation IA)',
        details: `Categories detectees : ${flaggedCategories.join(', ')}`,
      });

      return json({ allowed: false, categories: flaggedCategories });
    }

    return json({ allowed: true });
  } catch (error) {
    console.error(error);
    return json({ error: 'Erreur interne du service de moderation.' }, 500);
  }
});
