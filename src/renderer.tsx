import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <title>{title ? `${title} — Vaultguards` : 'Vaultguards — Guards for Graded Slabs'}</title>
        <meta
          name="description"
          content="Precision-fit colorway guards for TAG and PSA graded slabs. Try before you buy with The Vault virtual try-on."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        <link href="/static/style.css" rel="stylesheet" />
        <link href="/static/css/theme.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
})
