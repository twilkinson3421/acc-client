import { BinReader, BinWriter } from "@exts/binutils";
import type {
        BroadcastingEvent,
        CarMap,
        Driver,
        EntryListCar,
        Lap,
        RealTimeCarUpdate,
        RealTimeUpdate,
        RegistrationResult,
        TrackData,
} from "./types.ts";
import type { CameraSets } from "./types.ts";
import type { HUDPage } from "./types.ts";
import type { ConnectionParams } from "./types.ts";
import { Buffer } from "node:buffer";

export function parseString(reader: BinReader): string {
        const length = reader.readUInt16();
        const data = reader.readBytes(length).toString("utf8");
        return data;
}

export function parseLap(reader: BinReader): Lap {
        const lap: Lap = {} as unknown as Lap;
        lap.laptimeMS = reader.readInt32();
        if (lap.laptimeMS === 0x7fffffff) lap.laptimeMS = null;
        lap.carIndex = reader.readUInt16();
        lap.driverIndex = reader.readUInt16();
        lap.splits = [];
        let splitCount = reader.readUInt8();
        while (splitCount--) lap.splits.push(reader.readInt32());
        lap.splits = lap.splits.map(s => (s === 0x7fffffff ? null : s));
        lap.isInvalid = !!reader.readUInt8();
        lap.isValidForBest = !!reader.readUInt8();
        lap.isOutLap = !!reader.readUInt8();
        lap.isInLap = !!reader.readUInt8();
        return lap;
}

export function parseDriver(reader: BinReader): Driver {
        return {
                firstName: parseString(reader),
                lastName: parseString(reader),
                shortName: parseString(reader),
                category: reader.readUInt8(),
                nationality: reader.readUInt16(),
        };
}

export function parseRegistrationResult(reader: BinReader): RegistrationResult {
        return {
                connectionId: reader.readInt32(),
                connectionSuccess: !!reader.readUInt8(),
                isReadOnly: !!reader.readUInt8(),
                errorMessage: parseString(reader),
        };
}

export function parseRealTimeUpdate(reader: BinReader): RealTimeUpdate {
        const update: RealTimeUpdate = {} as unknown as RealTimeUpdate;
        update.eventIndex = reader.readUInt16();
        update.sessionIndex = reader.readUInt16();
        update.sessionType = reader.readUInt8();
        update.phase = reader.readUInt8();
        update.sessionTime = reader.readFloat32();
        update.sessionEndTime = reader.readFloat32();
        update.focusedCarIndex = reader.readInt32();
        update.activeCameraSet = parseString(reader);
        update.activeCamera = parseString(reader);
        update.currentHudPage = parseString(reader);
        update.isReplayPlaying = !!reader.readUInt8();
        const isReplay = update.isReplayPlaying;
        if (isReplay) update.replaySessionTime = reader.readFloat32();
        if (isReplay) update.replayRemainingTime = reader.readFloat32();
        update.timeOfDay = reader.readFloat32();
        update.ambientTemp = reader.readUInt8();
        update.trackTemp = reader.readUInt8();
        update.clouds = reader.readUInt8() / 10;
        update.rainLevel = reader.readUInt8() / 10;
        update.wetness = reader.readUInt8() / 10;
        update.bestSessionLap = parseLap(reader);
        return update;
}

export function parseRealTimeCarUpdate(reader: BinReader): RealTimeCarUpdate {
        return {
                carIndex: reader.readUInt16(),
                driverIndex: reader.readUInt16(),
                driverCount: reader.readUInt8(),
                gear: reader.readUInt8() - 1,
                worldPositionX: reader.readFloat32(),
                worldPositionY: reader.readFloat32(),
                yaw: reader.readFloat32(),
                carLocation: reader.readUInt8(),
                speedKMH: reader.readUInt16(),
                position: reader.readUInt16(),
                cupPosition: reader.readUInt16(),
                trackPosition: reader.readUInt16(),
                splinePosition: reader.readFloat32(),
                laps: reader.readUInt16(),
                delta: reader.readInt32(),
                bestSessionLap: parseLap(reader),
                lastLap: parseLap(reader),
                currentLap: parseLap(reader),
        };
}

export function parseEntryList(reader: BinReader): number[] {
        const entryList = [];
        reader.readInt32(); // _connectionId
        let carEntryCount = reader.readUInt16();
        while (carEntryCount--) entryList.push(reader.readUInt16());
        return entryList;
}

export function parseEntryListCar(
        reader: BinReader,
        carMap: CarMap
): EntryListCar {
        const entryListCar: EntryListCar = {} as unknown as EntryListCar;
        const carId = reader.readUInt16();
        entryListCar.carModelType = reader.readUInt8();
        entryListCar.teamName = parseString(reader);
        entryListCar.raceNumber = reader.readInt32();
        entryListCar.cupCategory = reader.readUInt8();
        entryListCar.currentDriverIndex = reader.readUInt8();
        entryListCar.nationality = reader.readUInt16();
        entryListCar.drivers = [];
        let driversCount = reader.readUInt8();
        while (driversCount--) entryListCar.drivers.push(parseDriver(reader));
        const driver = entryListCar.drivers[entryListCar.currentDriverIndex];
        entryListCar.currentDriver = driver;
        carMap.set(carId, entryListCar);
        return entryListCar;
}

export function parseBroadcastingEvent(
        reader: BinReader,
        carMap: CarMap
): BroadcastingEvent {
        const event: BroadcastingEvent = {} as unknown as BroadcastingEvent;
        event.type = reader.readUInt8();
        event.message = parseString(reader);
        event.timeMS = reader.readInt32();
        event.carId = reader.readInt32();
        event.car = carMap.get(event.carId)!;
        return event;
}

export function parseTrackData(reader: BinReader): TrackData {
        const trackData: TrackData = {} as unknown as TrackData;
        trackData.cameraSets = {} as unknown as TrackData["cameraSets"];
        trackData.HUDPages = [];
        trackData.connectionId = reader.readInt32();
        trackData.trackName = parseString(reader);
        trackData.trackId = reader.readInt32();
        trackData.trackLengthM = reader.readInt32();
        let cameraSetsCount = reader.readUInt8();
        do {
                const cameraSetName = parseString(reader) as keyof CameraSets;
                trackData.cameraSets[cameraSetName] = [];
                let cameraCount = reader.readUInt8();
                const f = trackData.cameraSets[cameraSetName].push;
                while (cameraCount--)
                        f(parseString(reader) as unknown as never);
        } while (--cameraSetsCount);
        let HUDPagesCount = reader.readUInt8();
        const f = trackData.HUDPages.push;
        while (HUDPagesCount--) f(parseString(reader) as HUDPage);
        return trackData;
}

export function makeRegisterConnection(params: ConnectionParams): Buffer {
        const displayName = new TextEncoder().encode(params.name);
        const password = new TextEncoder().encode(params.password);
        const cmdPassword = new TextEncoder().encode(params.cmdPassword);
        const writer = new BinWriter();
        writer.writeUInt8(0x01);
        writer.writeUInt8(0x04);
        writer.writeUInt16(displayName.length);
        writer.writeBytes(Buffer.from(displayName));
        writer.writeUInt16(password.length);
        writer.writeBytes(Buffer.from(password));
        writer.writeUInt32(params.updateMS);
        writer.writeUInt16(cmdPassword.length);
        writer.writeBytes(Buffer.from(cmdPassword));
        return writer.buffer;
}

export function makeDeregisterConnection(): Buffer {
        const writer = new BinWriter();
        writer.writeUInt8(0x09);
        return writer.buffer;
}

export function makeRequestEntryList(connectionId: number): Buffer {
        const writer = new BinWriter();
        writer.writeUInt8(0x0a);
        writer.writeInt32(connectionId);
        return writer.buffer;
}

export function makeRequestTrackData(connectionId: number): Buffer {
        const writer = new BinWriter();
        writer.writeUInt8(0x0b);
        writer.writeInt32(connectionId);
        return writer.buffer;
}
