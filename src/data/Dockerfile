FROM osixia/openldap:1.5.0
COPY ./db/*.ldif /container/service/slapd/assets/config/bootstrap/ldif/custom/


# Environment variables for standlone use
ARG LDAP_ORGANIZATION
ENV LDAP_ORGANISATION=$LDAP_ORGANIZATION

ARG LDAP_DOMAIN
ENV LDAP_DOMAIN=$LDAP_DOMAIN

ARG LDAP_ADMIN_PASSWORD
ENV LDAP_CONFIG_PASSWORD=$LDAP_ADMIN_PASSWORD