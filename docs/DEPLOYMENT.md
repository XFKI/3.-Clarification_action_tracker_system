# Deployment Notes

## Goal

Keep the existing local backend startup path unchanged, while adding an online demo path on Vercel.

## Modes

- Local backend mode: `quick-start.bat --serve 5500`
- Vercel web mode: `https://<domain>.vercel.app/?mode=web`

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
