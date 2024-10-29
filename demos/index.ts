import { Client } from "../src/index.ts";

const client = new Client(
        {
                address: "192.168.1.149",
                port: 9000,
        },
        {
                name: "generic_third_party_application_test",
                password: "asd",
                cmdPassword: "",
                updateMS: 300,
        }
);

client.connect();

client.on("disconnect", () => Deno.exit(0));

client.on("realTimeCarUpdate", update => {
        console.clear();
        console.table(update);
});
