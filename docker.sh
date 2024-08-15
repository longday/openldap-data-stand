#!/usr/bin/env bash
set -x

VERSION=1.0.0

NODE_TAG=longday/ldap-stand:${VERSION}

# Build docker image
docker build --tag "${NODE_TAG}" . || exit 1
#docker push "${NODE_TAG}"