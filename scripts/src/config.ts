// tslint:disable-next-line: no-namespace
export namespace Config {
    // Secret key for JWT signing and encryption
    export const secret = process.env.secret || "super secret passphrase";
    // Database connection information
    export const database = process.env.database;
    // Setting port for server
    export const port = +process.env.serverPort || 3000;
}
