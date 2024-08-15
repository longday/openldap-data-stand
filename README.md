# OpenLDAP Stand for Testing

A complete Docker setup for running an OpenLDAP server pre-loaded with demo data. This project is an ideal alternative to [online LDAP test server](https://www.forumsys.com/2022/05/10/online-ldap-test-server/), providing a local environment to test and experiment with LDAP operations.

**Keywords:** LDAP demo server, OpenLDAP Docker, LDAP testing environment, local LDAP server, OpenLDAP with seed data.

## Components

### Idea
Csv to Ldif converter [Nordes/Csv2Ldif](https://github.com/Nordes/Csv2Ldif)

[![GitHub stars](https://img.shields.io/github/stars/Nordes/Csv2Ldif?style=social)](https://github.com/Nordes/Csv2Ldif)

### Seed Data
The LDAP server is populated with a comprehensive set of [Contoso users](https://mrhodes.net/2011/10/25/adding-285-contoso-users-with-pictures-to-your-development-environment-active-directory/) including pictures, courtesy of Mr. Rhodes. This dataset is ideal for development and testing purposes.

### LDAP server docker
The core of this setup is powered by the [osixia/docker-openldap](https://github.com/osixia/docker-openldap) image.

[![GitHub stars](https://img.shields.io/github/stars/osixia/docker-openldap?style=social)](https://github.com/osixia/docker-openldap)

### phpLDAPadmin docker
For managing the LDAP directory through a web interface, the [osixia/docker-phpLDAPadmin](https://github.com/osixia/docker-phpLDAPadmin) image is used.

[![GitHub stars](https://img.shields.io/github/stars/osixia/docker-phpLDAPadmin?style=social)](https://github.com/osixia/docker-phpLDAPadmin)