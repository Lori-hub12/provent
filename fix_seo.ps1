$htmlFiles = Get-ChildItem -Path . -Filter *.html

$metaTags = @"
    <meta name="description" content="ProVend es la plataforma B2B de Nicaragua que conecta empresas con proveedores verificados para optimizar la cadena de suministro.">
    <meta property="og:title" content="ProVend — Conectando Empresas y Proveedores">
    <meta property="og:description" content="Encuentra proveedores verificados y cotiza materiales para tu empresa en Nicaragua.">
    <meta property="og:image" content="https://provend.com.ni/assets/images/logo.svg">
    <meta property="og:url" content="https://provend.com.ni/">
    <meta property="og:type" content="website">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
"@

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw

    # Remove existing preconnects or OG tags if they accidentally exist
    $content = $content -replace '(?i)<meta property="og:.*?>\s*', ''
    $content = $content -replace '(?i)<link rel="preconnect".*?>\s*', ''
    # Only remove meta description if it's there
    $content = $content -replace '(?i)<meta name="description".*?>\s*', ''

    # Insert tags before <title> or <link rel="stylesheet">
    if ($content -match '<title>') {
        $content = $content -replace '(?s)(<title>)', ($metaTags + "`n    `$1")
    }

    # Fix favicon
    $content = $content -replace "(?i)<link rel=['`"]icon['`"].*?>", '<link rel="icon" type="image/svg+xml" href="assets/images/logo.svg">'

    # If favicon didn't exist, insert it before <link rel="stylesheet">
    if (-not ($content -match '<link rel="icon"')) {
        $content = $content -replace '(?s)(<link rel="stylesheet")', ("<link rel=`"icon`" type=`"image/svg+xml`" href=`"assets/images/logo.svg`">`n    `$1")
    }

    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}
