import { createClient } from "db-vendo-client";
import { profile } from "db-vendo-client/p/dbnav/index";
import fs from "fs";
import path from "path";

const filePath = path.resolve("node_modules/db-hafas-stations/full.ndjson");
console.log("Checking file:", filePath);
console.log("File exists:", fs.existsSync(filePath));

export const createVendoClient = () => createClient(profile, "db-live");
