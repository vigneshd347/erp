/**
 * Manti ERP — Cloudflare Worker for R2 Image Uploads
 *
 * DEPLOY STEPS:
 * 1. Go to dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file as the Worker code
 * 3. In Worker Settings → Variables → Add these:
 *      UPLOAD_TOKEN  = any random secret string you choose (e.g. "manti-secret-2024")
 *      R2_PUBLIC_URL = your R2 public bucket URL (e.g. "https://pub-XXXX.r2.dev")
 * 4. In Worker Settings → Bindings → R2 → Add binding:
 *      Variable name: BUCKET
 *      Bucket: manti-erp-assets  (create this bucket in R2 first)
 * 5. Deploy the Worker. Copy the Worker URL (e.g. https://manti-upload.yourname.workers.dev)
 * 6. Paste that URL into r2upload.js as R2_WORKER_URL
 * 7. Paste your UPLOAD_TOKEN into r2upload.js as R2_UPLOAD_TOKEN
 */

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'X-Upload-Token',
        },
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return json({ success: false, error: 'Method not allowed' }, 405);
    }

    // Authenticate with secret token
    const token = request.headers.get('X-Upload-Token');
    if (!token || token !== env.UPLOAD_TOKEN) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const folder = formData.get('folder') || 'uploads';

      if (!file || typeof file === 'string') {
        return json({ success: false, error: 'No file provided' }, 400);
      }

      // Build a unique filename
      const ext = file.name.split('.').pop().toLowerCase();
      const safeName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload to R2
      await env.BUCKET.put(safeName, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });

      const publicUrl = `${env.R2_PUBLIC_URL}/${safeName}`;
      return json({ success: true, url: publicUrl });

    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
