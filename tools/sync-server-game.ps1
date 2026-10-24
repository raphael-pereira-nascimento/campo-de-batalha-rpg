# Sincroniza apenas os arquivos de jogo que ainda sao identicos entre cliente e servidor.
# data.js e battleManager.js NAO sao sincronizados porque o servidor contem logica
# exclusiva de gemas da forja (FORGE_GEMS/getGemDef). Uma copia cega apagaria esses
# efeitos e quebraria a paridade online/offline.
# Uso: powershell -File tools/sync-server-game.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'src\game'
$dst = Join-Path $root 'server\src\game'

# Arquivos sem diferencas intencionais conhecidas.
$identicos = @('sistema.js', 'eclipse.js', 'dungeons.js', 'monsters.js', 'races.js')
foreach ($f in $identicos) {
  Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force
}

Write-Host "Sincronizado: $($identicos -join ', ')"
Write-Warning "data.js e battleManager.js foram preservados. O servidor tem logica exclusiva de gemas da forja; reconcilie manualmente antes de sincronizar esses dois arquivos."
