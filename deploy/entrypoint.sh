#!/bin/sh
set -e

# Substitui o placeholder pelas variáveis de ambiente de runtime (Portainer)
# Isso permite usar a mesma imagem Docker em múltiplos ambientes sem precisar recompilar.
echo "Injetando variáveis NEXT_PUBLIC no Javascript estático..."

# Usa as variáveis ou mantém o placeholder em caso de falha/ausência
URL_VAL=${NEXT_PUBLIC_SUPABASE_URL:-"https://placeholder.supabase.co"}
ANON_VAL=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-"placeholder_anon_key"}

# Encontra arquivos JS e CSS na pasta static e standalone e faz o replace (sed)
find /app/.next -type f -name "*.js" -exec sed -i "s|https://placeholder.supabase.co|${URL_VAL}|g" {} +
find /app/.next -type f -name "*.js" -exec sed -i "s|placeholder_anon_key|${ANON_VAL}|g" {} +

echo "Iniciando servidor Node.js Next..."
exec "$@"
