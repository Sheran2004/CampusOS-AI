# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. Email the maintainer directly (see GitHub profile)
3. Include detailed reproduction steps
4. Allow up to 72 hours for initial response

We will:
- Acknowledge within 72 hours
- Provide a fix timeline within 7 days
- Credit you (with permission) in the fix release notes

## Best Practices for Self-Hosting

- Always use HTTPS in production (Let's Encrypt, Cloudflare, etc.)
- Set `JWT_SECRET` to a strong random 32+ char string
- Use Postgres in production (not SQLite)
- Enable database backups (daily minimum)
- Keep dependencies updated (`npm audit` regularly)
- Set rate limiting at the reverse proxy level (Cloudflare, nginx)
- Never commit `.env.local` to git (already in `.gitignore`)
