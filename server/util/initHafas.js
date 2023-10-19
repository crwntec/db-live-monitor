import { createInMemoryStore } from "cached-hafas-client/stores/in-memory.js"
import { createDbHafas } from "db-hafas";
import { createCachedHafasClient } from "cached-hafas-client"

export default function initHafas() {
    const store = createInMemoryStore();

    const hafas = createDbHafas("DB-Live-Monitor")

    const cachedHafas = createCachedHafasClient(hafas, store);

    return cachedHafas
}
