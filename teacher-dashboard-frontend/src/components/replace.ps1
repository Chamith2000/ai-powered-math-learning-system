
$files = Get-ChildItem -Path "d:\Sysconex\projects\lms jane\lms_jane_git\admin\src\components" -Recurse -Filter "*Table.jsx"
foreach ($f in $files) {
    $content = Get-Content -Raw $f.FullName
    if ($content -match 'className="table-responsive"') {
        $content = $content -replace 'className="table-responsive"', 'className="table-responsive" style={{ minHeight: "350px" }}'
        Set-Content -Path $f.FullName -Value $content -Encoding UTF8
        Write-Host "Updated $($f.Name)"
    }
}
