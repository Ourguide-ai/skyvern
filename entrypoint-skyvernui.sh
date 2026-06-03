#!/bin/bash

set -e

# Default values for environment variables
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8000/api/v1}"
VITE_WSS_BASE_URL="${VITE_WSS_BASE_URL:-ws://localhost:8000/api/v1}"
VITE_ARTIFACT_API_BASE_URL="${VITE_ARTIFACT_API_BASE_URL:-http://localhost:9090}"
VITE_BROWSER_STREAMING_MODE="${VITE_BROWSER_STREAMING_MODE:-vnc}"

# Resolve the API key for the UI. Priority:
# 1. VITE_ARGIDE_API_KEY (new), then legacy VITE_SKYVERN_API_KEY — from env or
#    docker-compose, but only if it looks like a real key (not a placeholder/example).
# 2. Generated credentials file from the backend first-run setup.
SKYVERN_CREDENTIALS_FILE="${SKYVERN_CREDENTIALS_FILE:-/app/.skyvern/credentials.toml}"
GENERATED_KEY=$(sed -n 's/.*cred\s*=\s*"\([^"]*\)".*/\1/p' "$SKYVERN_CREDENTIALS_FILE" 2>/dev/null || echo "")
RESOLVED_API_KEY=""
for candidate in "${VITE_ARGIDE_API_KEY:-}" "${VITE_SKYVERN_API_KEY:-}"; do
    candidate=$(printf '%s' "$candidate" | xargs)
    case "$candidate" in
        ""|"YOUR_API_KEY"|"__SKYVERN_API_KEY_PLACEHOLDER__"|"__ARGIDE_API_KEY_PLACEHOLDER__") ;;
        *) RESOLVED_API_KEY="$candidate"; break ;;
    esac
done
if [ -n "$RESOLVED_API_KEY" ]; then
    echo "Using API key from environment variable"
elif [ -n "$GENERATED_KEY" ]; then
    RESOLVED_API_KEY="$GENERATED_KEY"
    echo "Using API key from $SKYVERN_CREDENTIALS_FILE"
else
    echo "WARNING: No API key found in environment or $SKYVERN_CREDENTIALS_FILE"
    RESOLVED_API_KEY=""
fi

# Inject environment variables into pre-built JS files (replace placeholders)
# Using | as delimiter since URLs contain /
find /app/dist -name "*.js" -exec sed -i \
    -e "s|__VITE_API_BASE_URL_PLACEHOLDER__|${VITE_API_BASE_URL}|g" \
    -e "s|__VITE_WSS_BASE_URL_PLACEHOLDER__|${VITE_WSS_BASE_URL}|g" \
    -e "s|__VITE_ARTIFACT_API_BASE_URL_PLACEHOLDER__|${VITE_ARTIFACT_API_BASE_URL}|g" \
    -e "s|__SKYVERN_API_KEY_PLACEHOLDER__|${RESOLVED_API_KEY}|g" \
    -e "s|__VITE_BROWSER_STREAMING_MODE_PLACEHOLDER__|${VITE_BROWSER_STREAMING_MODE}|g" \
    {} \;

# Start the servers (no rebuild needed)
# Tini (configured as ENTRYPOINT) handles signal forwarding and zombie reaping
node localServer.js &
node artifactServer.js &
wait
