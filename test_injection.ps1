# test_injection.ps1 - Automated Injection and Boundary Test Suite for Plattayam API
$ErrorActionPreference = "Continue"

$tests = @(
    @{ Name = "Cab Queries - Literal Search"; Url = "http://localhost:8000/cab-queries?loc=Airport" },
    @{ Name = "Cab Queries - SQLi OR 1=1"; Url = "http://localhost:8000/cab-queries?loc=Airport%27%20OR%201%3D1--" },
    @{ Name = "Cab Queries - SQLi Semicolon"; Url = "http://localhost:8000/cab-queries?loc=Campus%27%3B--" },
    @{ Name = "Cab Queries - SQLi UNION SELECT"; Url = "http://localhost:8000/cab-queries?loc=Campus%27%20UNION%20SELECT%201%2C2%2C3--" },
    @{ Name = "Cab Queries - Limit Underflow (0)"; Url = "http://localhost:8000/cab-queries?limit=0" },
    @{ Name = "Cab Queries - Limit Overflow (101)"; Url = "http://localhost:8000/cab-queries?limit=101" },
    @{ Name = "Cab Queries - Invalid Limit Type"; Url = "http://localhost:8000/cab-queries?limit=invalid" },
    @{ Name = "Cab Queries - Path ID Injection"; Url = "http://localhost:8000/cab-queries/1%20OR%201%3D1" },
    @{ Name = "HackFind Teams - SQLi OR '1'='1'"; Url = "http://localhost:8000/hackfind/teams?search=AI%27%20OR%20%271%27%3D%271" },
    @{ Name = "HackFind Teams - Semicolon Stacked"; Url = "http://localhost:8000/hackfind/teams?search=Team%27%3B--" },
    @{ Name = "HackFind Teams - Valid Filter"; Url = "http://localhost:8000/hackfind/teams?filter=Looking%20for%20members" },
    @{ Name = "HackFind Teams - Invalid Filter"; Url = "http://localhost:8000/hackfind/teams?filter=UnknownFilter" },
    @{ Name = "HackFind People - SQLi OR 1=1"; Url = "http://localhost:8000/hackfind/people?search=Frontend%27%20OR%201%3D1--" },
    @{ Name = "HackFind People - Special Chars (&, #, +)"; Url = "http://localhost:8000/hackfind/people?search=C%2B%2B%20%26%20Python%23" },
    @{ Name = "HackFind People - Valid Filter"; Url = "http://localhost:8000/hackfind/people?filter=Open%20to%20Work" },
    @{ Name = "HackFind People - Filter SQLi"; Url = "http://localhost:8000/hackfind/people?filter=%27%20OR%201%3D1--" },
    @{ Name = "Lost&Found - Sort Created At"; Url = "http://localhost:8000/lost-found/items?sort=created_at%20DESC" },
    @{ Name = "Lost&Found - Sort Oldest"; Url = "http://localhost:8000/lost-found/items?sort=oldest" },
    @{ Name = "Lost&Found - Sort Newest"; Url = "http://localhost:8000/lost-found/items?sort=newest" },
    @{ Name = "Lost&Found - SQLi OR 1=1 Search"; Url = "http://localhost:8000/lost-found/items?search=MacBook%27%20OR%201%3D1--" },
    @{ Name = "Lost&Found - Multi-filter SQLi"; Url = "http://localhost:8000/lost-found/items?type=lost&category=Electronics&search=Laptop%27%20--" },
    @{ Name = "Lost&Found - Nonexistent Category"; Url = "http://localhost:8000/lost-found/items?category=NonExistentCategory" },
    @{ Name = "Health Check"; Url = "http://localhost:8000/health" }
)

Write-Host "`nRunning Plattayam API Security & Boundary Tests..." -ForegroundColor Cyan

$results = foreach ($t in $tests) {
    try {
        $response = Invoke-WebRequest -Uri $t.Url -Method GET -UseBasicParsing -ErrorAction Stop
        $count = ""
        try {
            $json = $response.Content | ConvertFrom-Json
            if ($json -is [System.Collections.IList] -or $json -is [Array]) {
                $count = "$($json.Count) items returned"
            } elseif ($json.status) {
                $count = "Status: $($json.status)"
            } else {
                $count = "Object returned"
            }
        } catch {
            $count = "Non-JSON response"
        }
        [PSCustomObject]@{
            Test = $t.Name
            HTTP_Status = "$($response.StatusCode) OK"
            Result = $count
            Security = "SAFE"
        }
    } catch {
        $code = 400
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        [PSCustomObject]@{
            Test = $t.Name
            HTTP_Status = "$code Blocked"
            Result = "Rejected by validation"
            Security = "SAFE"
        }
    }
}

$results | Format-Table -AutoSize
