#!/usr/bin/env bash

cd "${0%/*}" || exit

LDAP_SRC_DIR=$(pwd)/src
LDAP_DIST_DIR=$(pwd)/dist
LDAP_ENV_FILE=$(pwd)/build.env

export LDAP_SRC_DIR
export LDAP_DIST_DIR
export LDAP_ENV_FILE

mkdir -p "$LDAP_DIST_DIR"
rm -rf "${LDAP_DIST_DIR:?}"/*

(cd "$LDAP_SRC_DIR" && npm ci) || (echo "Failed to install dependencies" && exit)
(cd "$LDAP_SRC_DIR" && ./node_modules/.bin/tsx run.mts)
