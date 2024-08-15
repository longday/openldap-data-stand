#!/usr/bin/env bash
cd "${0%/*}" || exit

set -x

if [ ! -d dist ]; then
    echo "dist directory not found"
    ./build.sh || exit 1
fi

VERSION=1.0.0
NODE_TAG=longday/ldap-stand:${VERSION}
# Build docker image
(cd ./dist  \
    && source ./.env \
    && docker build \
    --build-arg LDAP_DOMAIN="$LDAP_ADMIN_PASSWORD" \
    --build-arg LDAP_ORGANIZATION="$LDAP_ORGANIZATION" \
    --build-arg LDAP_ADMIN_PASSWORD="$LDAP_ADMIN_PASSWORD" \
    --tag "${NODE_TAG}"  . )|| exit 1
docker push "${NODE_TAG}"