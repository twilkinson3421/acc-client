import { EventEmitter } from "@denosaurs/event";
import { match } from "@korkje/match";
import type {
        Car,
        CarMap,
        ConnectionOptions,
        ConnectionParams,
        Events,
        RegistrationResult,
} from "./types.ts";
import { Socket, createSocket } from "node:dgram";
import type { Buffer } from "node:buffer";
import {
        makeDeregisterConnection,
        makeRegisterConnection,
        makeRequestEntryList,
        makeRequestTrackData,
        parseBroadcastingEvent,
        parseEntryList,
        parseEntryListCar,
        parseRealTimeCarUpdate,
        parseRealTimeUpdate,
        parseRegistrationResult,
        parseTrackData,
} from "./coerce.ts";
import { BinReader } from "@exts/binutils";
import { MessageType } from "./enums.ts";

export class Client extends EventEmitter<Events> {
        private socket: Socket = createSocket("udp4");
        private cars: CarMap = new Map();
        private registrationResult: RegistrationResult | undefined;
        private connectionId: number | undefined;
        public accessor isConnected: boolean = false;

        constructor(
                private opts: ConnectionOptions,
                private params: ConnectionParams
        ) {
                super();
                this.socket.on("message", this.handleMessage.bind(this));
        }

        private send(message: Buffer): void {
                this.socket.send(
                        message,
                        0x00,
                        message.length,
                        this.opts.port,
                        this.opts.address
                );
        }

        public connect(): void {
                if (this.isConnected) {
                        const msg = `Cannot connect to ${this.opts.address}:${this.opts.port} because there is already a connection open`;
                        console.error(msg);
                        return;
                }
                this.send(makeRegisterConnection(this.params));
                this.isConnected = true;
                const msg = `Client connected to ${this.opts.address}:${this.opts.port}`;
                console.info(msg);
                const onInterrupt = this.handleInterrupt.bind(this);
                Deno.addSignalListener("SIGINT", onInterrupt);
        }

        public disconnect(): void {
                if (!this.isConnected) {
                        const msg = `\nCannot disconnect from ${this.opts.address}:${this.opts.port} because there is no connection to close`;
                        console.error(msg);
                        return;
                }
                this.send(makeDeregisterConnection());
                this.isConnected = false;
                const msg = `\nClient disconnected from ${this.opts.address}:${this.opts.port}`;
                console.info(msg);
                this.emit("disconnect");
        }

        private handleInterrupt(): void {
                this.disconnect();
                Deno.exit(0);
        }

        private requestTrackData(): void {
                const connectionId = this.connectionId!;
                this.send(makeRequestTrackData(connectionId));
        }

        private requestEntryList(): void {
                const connectionId = this.connectionId!;
                this.send(makeRequestEntryList(connectionId));
        }

        private handleMessage(message: Buffer): void {
                const reader = new BinReader(message);
                const messageType = reader.readUInt8() as MessageType;
                match(messageType)
                        .on(MessageType.RegistrationResult, () => {
                                const res = parseRegistrationResult(reader);
                                this.registrationResult = res;
                                this.emit("registrationResult", res);
                                const rOnly =
                                        this.registrationResult.isReadOnly;
                                if (rOnly) return;
                                this.requestTrackData();
                                this.requestEntryList();
                        })
                        .on(MessageType.RealTimeUpdate, () => {
                                const res = parseRealTimeUpdate(reader);
                                this.emit("realTimeUpdate", res);
                        })
                        .on(MessageType.RealTimeCarUpdate, () => {
                                const res = parseRealTimeCarUpdate(reader);
                                this.emit("realTimeCarUpdate", res);
                        })
                        .on(MessageType.EntryList, () => {
                                this.cars.clear();
                                const map = this.cars;
                                const res = parseEntryList(reader);
                                const val = {} as Car;
                                res.forEach(id => map.set(id, val));
                                this.emit("entryList", this.cars);
                        })
                        .on(MessageType.TrackData, () => {
                                const res = parseTrackData(reader);
                                this.emit("trackData", res);
                        })
                        .on(MessageType.EntryListCar, () => {
                                const map = this.cars;
                                const res = parseEntryListCar(reader, map);
                                this.emit("entryListCar", res);
                        })
                        .on(MessageType.BroadcastingEvent, () => {
                                const map = this.cars;
                                const res = parseBroadcastingEvent(reader, map);
                                this.emit("broadcastingEvent", res);
                        })
                        .default(() => {
                                const err = `Unknown message type: ${messageType}`;
                                console.error(err);
                        })
                        .result();
        }
}
