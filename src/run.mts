/* eslint-disable no-console */
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import { fs, path } from "zx";
import crypto from "crypto";

dotenv.config({ path: process.env.LDAP_ENV_FILE });
const config = {
  baseDn: process.env.LDAP_BASE_DN || "",
  organization: process.env.LDAP_ORGANIZATION || "",
  domain: process.env.LDAP_DOMAIN || "",
  users: process.env.LDAP_USERS || "",
  groups: process.env.LDAP_GROUPS || "",
  adminPassword: process.env.LDAP_ADMIN_PASSWORD || "",
  idSeed: process.env.LDAP_ID_SEED || "",
  usersPassword: process.env.LDAP_USERS_PASSWORD || "",
  dist: process.env.LDAP_DIST_DIR || "",
  startupFileName: "00-startup.ldif",
  groupFileName: "01-groups.ldif",
  userFileName: "02-users.ldif",
};

for (const key in config) {
  if (config[key].length < 1) {
    throw new Error(`Environment variable ${key} is not set`);
  }
}

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
const generateCmd = (file: string) => {
  return `#ldapmodify -a -x -h localhost -p 389 -D "cn=admin,${config.baseDn}" -f ${file} -c -w ${config.adminPassword}`;
};

const records = parse(fs.readFileSync("./data/user_db.csv"), {
  columns: true,
  skip_empty_lines: true,
}) as object[];

// process groups
let buffer: string[] = [generateCmd(config.groupFileName)];
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
      `cn: ${config.groups}`,
      `uniqueMember: cn=${config.groups},${groupBaseDn}`,
      `description: ${group}`,
      ``, // Empty to have a separator
    ];

    buffer.push(groupEntry.join("\r\n"));
  }
}
fs.writeFileSync(
  path.join(config.dist, "db", config.groupFileName),
  buffer.join("\r\n"),
);
console.log("Groups processed");

//process users

buffer = [generateCmd(config.userFileName)];
const userBaseDn = `ou=${config.users},${config.baseDn}`;
let seed = parseInt(config.idSeed, 10);
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
  path.join(config.dist, "db", config.userFileName),
  buffer.join("\r\n"),
);
console.log("Users processed");

fs.writeFileSync(
  path.join(config.dist, "db", config.startupFileName),
  generateCmd(config.groupFileName) +
    "\r\n" +
    fs.readFileSync("./data/startup.ldif"),
);

//console.log("Complete");
