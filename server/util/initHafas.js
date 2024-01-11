import { createInMemoryStore } from "cached-hafas-client/stores/in-memory.js"
import { createCachedHafasClient } from "cached-hafas-client"
import { createClient } from "hafas-client";
import { profile as dbProfile } from "hafas-client/p/db/index.js";


export default function initHafas() {
    const store = createInMemoryStore();
    const userAgent = "DB-Live-Monitor";
   const client = createClient(dbProfile, userAgent);

    const cachedHafas = createCachedHafasClient(client, store);

    return cachedHafas
}
