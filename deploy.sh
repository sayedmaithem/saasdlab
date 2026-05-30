#!/bin/bash
# LabFlow → Vercel Production Deploy (no GitHub required)
set -e

echo "🚀 LabFlow Production Deploy"
echo "─────────────────────────────"

# 1. Load env vars
source .env.local

# 2. Check Vercel login
if ! vercel whoami &>/dev/null; then
  echo "→ Logging in to Vercel..."
  vercel login
fi

# 3. Create project without GitHub (direct deploy)
echo "→ Creating Vercel project..."
vercel link --yes --no-git 2>/dev/null || true

# 4. Push all env vars
echo "→ Setting environment variables..."
echo "$NEXT_PUBLIC_SUPABASE_URL"     | vercel env add NEXT_PUBLIC_SUPABASE_URL     production --force 2>/dev/null || true
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY"| vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force 2>/dev/null || true
echo "$SUPABASE_SERVICE_ROLE_KEY"    | vercel env add SUPABASE_SERVICE_ROLE_KEY    production --force 2>/dev/null || true
echo "$OPENAI_API_KEY"               | vercel env add OPENAI_API_KEY               production --force 2>/dev/null || true
echo "$ANTHROPIC_API_KEY"            | vercel env add ANTHROPIC_API_KEY            production --force 2>/dev/null || true
echo "0"                             | vercel env add LABFLOW_DEV_PREVIEW          production --force 2>/dev/null || true

# 5. Deploy to production
echo "→ Deploying..."
OUTPUT=$(vercel --prod --yes 2>&1)
echo "$OUTPUT"

DEPLOY_URL=$(echo "$OUTPUT" | grep -E "https://.*\.vercel\.app" | tail -1)

# 6. Set APP_URL to actual domain
if [ -n "$DEPLOY_URL" ]; then
  echo "$DEPLOY_URL" | vercel env add NEXT_PUBLIC_APP_URL production --force 2>/dev/null || true
  echo "$DEPLOY_URL" | vercel env add APP_URL             production --force 2>/dev/null || true
  echo ""
  echo "✅ Live at: $DEPLOY_URL"
else
  echo "✅ Deploy triggered — check https://vercel.com/dashboard for URL"
fi
