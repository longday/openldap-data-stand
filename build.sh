#!/usr/bin/env bash

# check if node is installed
if ! command -v node &> /dev/null
then
    echo "Please install node.js"
    exit
fi

# configure
LDAP_ADMIN_PASSWORD=pass1234
LDAP_USERS_PASSWORD=pass1234

# execute
cd "${0%/*}" || exit

LDAP_SRC_DIR=$(pwd)/src
LDAP_DIST_DIR=$(pwd)/dist

export LDAP_SRC_DIR
export LDAP_DIST_DIR
export LDAP_ADMIN_PASSWORD
export LDAP_USERS_PASSWORD

mkdir -p "$LDAP_DIST_DIR"
rm -rf "${LDAP_DIST_DIR:?}"/*

(cd "$LDAP_SRC_DIR" && npm ci) || (echo "Failed to install dependencies" && exit)
(cd "$LDAP_SRC_DIR" && ./node_modules/.bin/tsx run.mts)
