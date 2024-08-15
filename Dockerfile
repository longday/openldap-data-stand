FROM debian:12.6-slim
ARG S6_OVERLAY_VERSION=3.2.0.0

# Install slapd and requirements
RUN apt-get update \
	&& apt-get dist-upgrade -y \
    && DEBIAN_FRONTEND=noninteractive apt-get \
        install -y --no-install-recommends \
            slapd \
            ldap-utils \
            openssl \
            ca-certificates \
            xz-utils \
            curl \
            htop \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir /etc/ldap/ssl /bootstrap \
    && curl -L https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz \
    | tar -xJf - -C / \
    && curl -L https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-x86_64.tar.xz \
    | tar -xJf - -C /

COPY ./rootfs /


# Configuration Env Variables with defaults
ENV DATA_DIR="/opt/openldap/bootstrap/data"
ENV CONFIG_DIR="/opt/openldap/bootstrap/config"
ENV LDAP_DOMAIN=planetexpress.com
ENV LDAP_ORGANISATION="Planet Express, Inc."
ENV LDAP_BASEDN="dc=planetexpress,dc=com"
ENV LDAP_BINDDN="cn=admin,dc=planetexpress,dc=com"
ENV LDAP_SECRET=GoodNewsEveryone
ENV LDAP_CA_CERT="/etc/ldap/ssl/fullchain.crt"
ENV LDAP_SSL_KEY="/etc/ldap/ssl/ldap.key"
ENV LDAP_SSL_CERT="/etc/ldap/ssl/ldap.crt"
ENV LDAP_FORCE_STARTTLS="false"

# VOLUME ["/etc/ldap/slapd.d", "/etc/ldap/ssl", "/var/lib/ldap", "/run/slapd"]

#CMD ["/init"]
ENTRYPOINT ["/init"]
#    HEALTHCHECK CMD ["ldapsearch", "-H", "ldap://127.0.0.1:10389", "-D", "${LDAP_BINDDN}", "-w", "${LDAP_SECRET}", "-b", "${LDAP_BINDDN}"]
