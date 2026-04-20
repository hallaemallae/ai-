#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# .env (Prisma CLI 용) — DATABASE_URL 만 있으면 됨
if [ ! -f .env ]; then
  echo 'DATABASE_URL="file:./dev.db"' > .env
fi

# .env.local — 런타임용. ANTHROPIC_API_KEY 는 Codespaces Secret 에서 주입됨
if [ ! -f .env.local ]; then
  cat > .env.local <<EOF
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-여기에키붙여넣기}
DATABASE_URL="file:./dev.db"
EOF
fi

npm install
npx prisma generate
npx prisma db push --skip-generate
npm run db:seed || true

echo ""
echo "✅ Setup 완료. 잠시 후 자동으로 dev 서버가 켜지고 브라우저 미리보기가 열립니다."
