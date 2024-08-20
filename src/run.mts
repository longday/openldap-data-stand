/* eslint-disable no-console */
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import { fs, path } from "zx";
import crypto from "crypto";

dotenv.config();
const config = {
  baseDn: "dc=contoso,dc=com",
  organization: "Contoso",
  domain: "contoso.com",
  users: "users",
  groups: "groups",
  adminPassword: process.env.LDAP_ADMIN_PASSWORD || "",
  idSeed: 70000,
  usersPassword: process.env.LDAP_USERS_PASSWORD || "",
  dist: process.env.LDAP_DIST_DIR || "",
  srcFiles: {
    csv: "data/db.csv",
    startup: "data/startup.ldif",
    compose: "data/docker-compose.yml",
    ldapDockerfile: "data/Dockerfile",
  },
  distFiles: {
    startupLdif: "db/00-startup.ldif",
    groupLdif: "db/01-groups.ldif",
    userLdif: "db/02-users.ldif",
    compose: "docker-compose.yml",
    ldapDockerfile: "Dockerfile",
  },
};

fs.ensureDirSync(path.join(config.dist, "db"));

const hashPassword = (passwd: string, ssha?: boolean) => {
  const ctx = crypto.createHash("sha1");

  let salt = "";
  ctx.update(passwd, "utf-8");
  if (ssha) {
    salt = crypto.randomBytes(4).toString("base64");
    ctx.update(salt, "binary");
  }
  const digest = ctx.digest("binary");
  return (
    `{S${ssha ? "S" : ""}HA}` +
    Buffer.from(digest + salt, "binary").toString("base64")
  );
};
// const generateCmd = (file: string) => {
//   return `#ldapmodify -a -x -h localhost -p 389 -D "cn=admin,${config.baseDn}" -f ${file} -c -w ${config.adminPassword}`;
// };

const records = parse(fs.readFileSync(config.srcFiles.csv), {
  columns: true,
  skip_empty_lines: true,
}) as object[];

// process groups
let buffer: string[] = [];
const unique = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...new Set(records.map((item: any) => (item.group ? item.group : ""))),
];
const groupBaseDn = `ou=${config.groups},${config.baseDn}`;

for (const group of unique) {
  if (group !== "") {
    const groupEntry: string[] = [
      `dn: cn=${group},${groupBaseDn}`,
      `changetype: add`,
      `objectClass: groupOfUniqueNames`,
      `cn: ${group}`,
      `uniqueMember: cn=${group},${groupBaseDn}`,
      `description: ${group}`,
      ``, //separator
    ];

    buffer.push(groupEntry.join("\r\n"));
  }
}
fs.writeFileSync(
  path.join(config.dist, config.distFiles.groupLdif),
  buffer.join("\r\n"),
);
console.log("Groups processed");

//process users

buffer = [];
const userBaseDn = `ou=${config.users},${config.baseDn}`;
let seed = config.idSeed;
const hashedPassword = hashPassword(config.usersPassword);
// Ldap User data
for (const row of records) {
  const rowKeys = Object.keys(row);
  let group: string = "";
  let uniqueMember: string = "";

  rowKeys.forEach((key: string) => {
    switch (key) {
      case "objectClass": {
        for (const oc of row[key].split(";")) {
          buffer.push(`objectClass: ${oc}`);
        }
        break;
      }
      case "group":
        group = row[key];
        break;
      case "dn":
        uniqueMember = row[key];
        buffer.push(`${key}: ${row[key]},${userBaseDn}`);
        buffer.push(`changetype: add`);
        break;
      case "manager":
        if (row[key] !== "") {
          buffer.push(`${key}: ${row[key]},${userBaseDn}`);
        }
        break;
      case "mail":
        if (row[key] !== "") {
          buffer.push(`mail: ${row[key]}`);
          buffer.push(`sAMAccountname: ${row[key].split("@")[0]}`);
          buffer.push(`userPrincipalName: ${row[key]}`);
        }
        break;
      default:
        buffer.push(`${key}: ${row[key]}`);
        break;
    }

    if (key === "uid") {
      buffer.push(`uidNumber: ${seed++}`);
      buffer.push(`gidNumber: ${seed++}`);
    }
  });

  buffer.push(`userPassword: ${hashedPassword}`);
  buffer.push(``);
  // Ldap User-Group data
  if (group && group !== "") {
    buffer.push(
      [
        `dn: cn=${group},${groupBaseDn}`,
        `changetype: modify`,
        `add: uniqueMember`,
        `uniqueMember: ${uniqueMember},${userBaseDn}`,
        ``,
      ].join("\r\n"),
    );
  }
}

fs.writeFileSync(
  path.join(config.dist, config.distFiles.userLdif),
  buffer.join("\r\n"),
);

fs.writeFileSync(
  path.join(config.dist, config.distFiles.startupLdif),
  fs.readFileSync(config.srcFiles.startup),
);

fs.copyFileSync(
  config.srcFiles.compose,
  path.join(config.dist, config.distFiles.compose),
);

fs.copyFileSync(
  config.srcFiles.ldapDockerfile,
  path.join(config.dist, config.distFiles.ldapDockerfile),
);

//create env file from config
const envBuffer = Array<string>();
envBuffer.push(`LDAP_ORGANIZATION=${config.organization}`);
envBuffer.push(`LDAP_DOMAIN=${config.domain}`);
envBuffer.push(`LDAP_ADMIN_PASSWORD=${config.adminPassword}`);
fs.writeFileSync(path.join(config.dist, ".env"), envBuffer.join("\r\n"));

console.log("Complete");
