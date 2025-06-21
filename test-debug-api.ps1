# Test debug session API
$headers = @{
    'Cookie' = 'next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..fRQYBidDD9ZPv8qy.hoxsY4ZFnfuZg4U5mAjU9inq5dlYBMmI-ljlMo1mOHVO8OBRcWWBOFV2ZImANWtigoWlbIelgJXpAR2P1fVv-yZY-dsIx5iK1__TOiscr9oJlaaAcbFuze88fFqlvG3ffJz5uGCiLF5hlyhOdyVitRPsFsvO32byXuj0N0eRgCuXx3cCRqa2Gab9QK5w-TvQXIxaOBcPqL6LonnUgpq5mSUifTpCQwgAQHEAwewjO9rjNbFR4XbABOBeyWirUbQwcBwnWsyn1g8qxKRejdnGr-N1L1pnsMidnjWK2KFLOvcxlXV5h6qjulDaYvwsQamXvGAhvmExe0wnfa-_.juo92aZ3oEKgbIlZUVpjUA'
}

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:9002/api/debug-session' -Method GET -Headers $headers
    Write-Host "=== DEBUG SESSION API RESPONSE ==="
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
}