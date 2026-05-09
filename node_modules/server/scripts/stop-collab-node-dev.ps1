# Stops dev-related Node processes for this repo (vite / tsx / concurrently / kill-port) so Prisma can
# replace query_engine DLLs. Narrow filter avoids killing arbitrary tools under collab-node/node_modules.
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object {
  $c = $_.CommandLine
  if (-not $c -or $c -notlike '*collab-node*') { return $false }
  return (
    $c -like '*vite*' -or
    $c -like '*tsx*' -or
    $c -like '*concurrently*' -or
    $c -like '*kill-port*'
  )
} | ForEach-Object {
  Write-Host "[prisma] stopping dev Node PID $($_.ProcessId)"
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1
