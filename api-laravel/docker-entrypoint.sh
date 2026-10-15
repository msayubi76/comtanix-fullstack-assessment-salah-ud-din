#!/bin/sh
set -e

# local demo only: without a key, generate one for this container
if [ -z "$APP_KEY" ]; then
    export APP_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
fi

if [ "$RUN_MIGRATIONS" = "true" ]; then
    php artisan migrate --force --seed
fi

exec "$@"
