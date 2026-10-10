# Sincroniza a lógica de jogo do cliente (src/game) com a cópia do servidor.
# O servidor é a fonte de verdade quando o jogo está online, então as duas
# cópias precisam ficar idênticas — exceto por três diferenças intencionais:
#   1. randomUUID vem de node:crypto (sem fallback de contexto seguro);
#   2. clamp vem de ../utils.js (módulo compartilhado do servidor);
#   3. o servidor aceita arma de monstro fora do catálogo EQUIPMENT.
# Uso: powershell -File tools/sync-server-game.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'src\game'
$dst = Join-Path $root 'server\src\game'
$utf8 = New-Object System.Text.UTF8Encoding $false

# ArquCopiados sem nenhuma alteração.
$identicos = @('sistema.js', 'eclipse.js', 'dungeons.js', 'monsters.js', 'data.js', 'races.js')
foreach ($f in $identicos) {
  Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force
}

# battleManager.js precisa dos 2 ajustes do servidor.
Copy-Item (Join-Path $src 'battleManager.js') (Join-Path $dst 'battleManager.js') -Force
$p = Join-Path $dst 'battleManager.js'
$c = [System.IO.File]::ReadAllText($p)

# Regexes: ignoram CRLF/LF, por isso não comparamos blocos literais.
$c2 = [regex]::Replace($c, '(?s)\A// crypto\.randomUUID.*?\nimport \{', "import { randomUUID } from 'node:crypto';`nimport { clamp } from '../utils.js';`nimport {", 1)
if ($c2 -eq $c) { throw 'Shim de randomUUID não encontrado no battleManager.js do cliente.' }
$c = $c2

$c2 = [regex]::Replace($c, '(?s)function clamp\(v, min, max\) \{\r?\n  return Math\.max\(min, Math\.min\(max, v\)\);\r?\n\}\r?\n\r?\n', '', 1)
if ($c2 -eq $c) { throw 'clamp local não encontrado no battleManager.js do cliente.' }
$c = $c2

# A arma do ataque básico sai do próprio equipamento (melhorArma), sem lookup
# no catálogo — então o antigo fallback de monstro deixou de existir.
$arma = 'const weapon = melhorArma(p.equipment);'
$n = ([regex]::Matches($c, [regex]::Escape($arma))).Count
if ($n -lt 1) { throw 'Resolução de arma (melhorArma) não encontrada no battleManager.js do cliente.' }

[System.IO.File]::WriteAllText($p, $c, $utf8)
Write-Host "Sincronizado: $($identicos -join ', ') e battleManager.js ($n resoluções de arma via melhorArma)."
