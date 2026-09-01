# 프로젝트 로컬 Node 환경 활성화 (PowerShell)
#
#   . .\env.ps1
#
# 시스템 PATH·레지스트리를 건드리지 않는다. 현재 셸 세션에만 적용된다.
# Node 는 .node/ 에 포터블로 설치되어 있다. 지우려면 .node/ 폴더만 삭제하면 된다.

$nodeDir = Join-Path $PSScriptRoot '.node'

if (-not (Test-Path (Join-Path $nodeDir 'node.exe'))) {
    Write-Error "Node 가 없습니다: $nodeDir  (README 의 환경 구성 참고)"
    return
}

if ($env:PATH -notlike "*$nodeDir*") {
    $env:PATH = "$nodeDir;$env:PATH"
}

Write-Host "node $(& node --version) / npm $(& npm --version)  <- $nodeDir"
