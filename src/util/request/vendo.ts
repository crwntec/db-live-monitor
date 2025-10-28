import {v4 as uuidv4} from "uuid";

export const randomHexString = (length: number): string =>
    [...Array(length)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
export const createRandomUserAgent = (): string => {
    let ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";
    const randomPart = randomHexString(16);
    ua = ua.replace(
        "115.0.0.0",
        `115.0.${randomHexString(4)}.${randomHexString(2)}`,
    );
    return ua + ` UniqueId/${randomPart}`;
};
export const getBrowserHeaders = (applicationName:string) => ({
    Accept: `application/x.db.vendo.mob.${applicationName}.v2+json`,
    "Content-Type": `application/x.db.vendo.mob.${applicationName}.v2+json`,
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    Referer: "https://www.bahn.de/",
    Origin: "https://www.bahn.de",
    "User-Agent": createRandomUserAgent(),
    "X-Correlation-ID": uuidv4() + "_" + uuidv4(),
});
