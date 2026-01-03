# 1Password Secret Template for Logarr (OPTIONAL)
# This file is for developers using 1Password CLI for secret management.
# Regular users should copy .env.example to .env and fill in values manually.
#
# Usage: op inject -i .env.tpl -o .env

# Database
DATABASE_URL=op://Development/Logarr-Dev/DATABASE_URL

# Redis
REDIS_URL=op://Development/Logarr-Dev/REDIS_URL

# Backend
BACKEND_PORT={{ op://Development/Logarr-Dev/BACKEND_PORT }}
CORS_ORIGIN={{ op://Development/Logarr-Dev/CORS_ORIGIN }}

# Environment
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL={{ op://Development/Logarr-Dev/NEXT_PUBLIC_API_URL }}
NEXT_PUBLIC_WS_URL={{ op://Development/Logarr-Dev/NEXT_PUBLIC_WS_URL }}
FRONTEND_PORT={{ op://Development/Logarr-Dev/FRONTEND_PORT }}

# AI Providers (optional - leave empty if not using)
ANTHROPIC_API_KEY={{ op://Development/Logarr-Dev/ANTHROPIC_API_KEY }}
OPENAI_API_KEY={{ op://Development/Logarr-Dev/OPENAI_API_KEY }}
GOOGLE_AI_API_KEY={{ op://Development/Logarr-Dev/GOOGLE_AI_API_KEY }}
