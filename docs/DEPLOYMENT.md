# Deployment Notes

## Goal

Keep the existing local backend startup path unchanged, while adding an online demo path on Vercel.

## Modes

- Local backend mode: `quick-start.bat --serve 5500`
- Vercel web mode: `https://<domain>.vercel.app/?mode=web`

## Vercel Deploy (CLI)

1. Login:

`npx vercel login`

1. Deploy production:

`npx vercel --prod --yes`

1. Or one-click script (Linux / macOS / Git Bash):

`sh quick-deploy-vercel.sh`

1. Windows one-click script (CMD / PowerShell):

`quick-deploy-vercel.bat`

1. Open with web mode query:

`https://<domain>.vercel.app/?mode=web`

## Common Error

- Error: `The specified token is not valid`

Resolution:

1. Re-login with `npx vercel login`.
2. Or generate a new token in Vercel account settings and re-run deploy.

## Why two modes

- Local backend mode keeps SQLite persistence and backend APIs.
- Vercel web mode removes local Python dependency for restricted enterprise laptops.

## Limitations on Vercel mode

- Uses browser local storage only.
- No local filesystem mapping/indexing.
- Not recommended as the only production data source.

## Recommended workflow

1. Use local backend mode for daily real data.
2. Use Vercel mode for access/demo when local process execution is blocked.
3. Export backups (Excel) regularly.
