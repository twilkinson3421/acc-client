import type {
        BroadcastingCarEventType,
        DriverCategory,
        Nationality,
        RaceSessionType,
        SessionPhase,
        CarLocation,
} from "./enums.ts";

export interface ConnectionOptions {
        address: string;
        port: number;
}

export interface ConnectionParams {
        name: string;
        password: string;
        cmdPassword: string;
        updateMS: number;
}

export interface RegistrationResult {
        connectionId: number;
        connectionSuccess: boolean;
        isReadOnly: boolean;
        errorMessage: string;
}

export type Events = {
        registrationResult: [RegistrationResult];
        realTimeUpdate: [RealTimeUpdate];
        realTimeCarUpdate: [RealTimeCarUpdate];
        entryList: [CarMap];
        trackData: [TrackData];
        entryListCar: [EntryListCar];
        broadcastingEvent: [BroadcastingEvent];
        disconnect: [void];
};

export interface Lap {
        splits: (number | null)[];
        laptimeMS: number | null;
        carIndex: number;
        driverIndex: number;
        isInvalid: boolean;
        isValidForBest: boolean;
        isOutLap: boolean;
        isInLap: boolean;
}

export interface CameraSets {
        Driveable:
                | "Chase"
                | "FarChase"
                | "Bonnet"
                | "DashPro"
                | "Cockpit"
                | "Dash"
                | "Helmet";
        Onboard: "Onboard0" | "Onboard1" | "Onboard2" | "Onboard3";
        Helicam: "Helicam";
        pitlane: "CameraPit1";
        set1:
                | "CameraTV4"
                | "CameraTV4B"
                | "CameraTV5"
                | "CameraTV6_0"
                | "CameraTV7_0"
                | "CameraTV8"
                | "CameraTV9"
                | "CameraTV10_16"
                | "CameraTV11"
                | "CameraTV12_5"
                | "CameraTV13"
                | "CameraTV14"
                | "CameraTV15"
                | "CameraTV16_1"
                | "CameraTV1"
                | "CameraTV1B_5"
                | "CameraTV2";
        set2:
                | "CameraTV20"
                | "CameraTV21"
                | "CameraTV22"
                | "CameraTV23"
                | "CameraTV24"
                | "CameraTV25"
                | "CameraTV26"
                | "CameraTV27"
                | "CameraTV17"
                | "CameraTV18"
                | "CameraTV19";
        setVR:
                | "CameraVR3"
                | "CameraVR4"
                | "CameraVR5"
                | "CameraVR6"
                | "CameraVR7"
                | "CameraVR8"
                | "CameraVR9"
                | "CameraVR1"
                | "CameraVR2";
}

export type HUDPage =
        | "Blank"
        | "Basic HUD"
        | "Help"
        | "TimeTable"
        | "Broadcasting"
        | "TrackMap";

export interface Driver {
        firstName: string;
        lastName: string;
        shortName: string;
        category: DriverCategory;
        nationality: Nationality;
}

export interface Car {
        carModelType: number;
        teamName: string;
        raceNumber: number;
        cupCategory: number;
        currentDriverIndex: number;
        nationality: Nationality;
        drivers: Driver[];
        currentDriver: Driver;
}

export type CarMap = Map<number, Car>;
export interface EntryListCar extends Car {}

export interface BroadcastingEvent {
        type: BroadcastingCarEventType;
        message: string;
        timeMS: number;
        carId: number;
        car: Car;
}

export interface RealTimeUpdate {
        eventIndex: number;
        sessionIndex: number;
        sessionType: RaceSessionType;
        phase: SessionPhase;
        sessionTime: number;
        sessionEndTime: number;
        focusedCarIndex: number;
        activeCameraSet: string;
        activeCamera: string;
        currentHudPage: string;
        isReplayPlaying: boolean;
        replaySessionTime: number | null;
        replayRemainingTime: number | null;
        timeOfDay: number;
        ambientTemp: number;
        trackTemp: number;
        clouds: number;
        rainLevel: number;
        wetness: number;
        bestSessionLap: Lap;
}

export interface RealTimeCarUpdate {
        carIndex: number;
        driverIndex: number;
        driverCount: number;
        gear: number;
        worldPositionX: number;
        worldPositionY: number;
        yaw: number;
        carLocation: CarLocation;
        speedKMH: number;
        position: number;
        cupPosition: number;
        trackPosition: number;
        splinePosition: number;
        laps: number;
        delta: number;
        bestSessionLap: Lap;
        lastLap: Lap;
        currentLap: Lap;
}

export interface TrackData {
        cameraSets: {
                Driveable: CameraSets["Driveable"][];
                Onboard: CameraSets["Onboard"][];
                Helicam: CameraSets["Helicam"][];
                pitlane: CameraSets["pitlane"][];
                set1: CameraSets["set1"][];
                set2: CameraSets["set2"][];
                setVR: CameraSets["setVR"][];
        };
        HUDPages: HUDPage[];
        connectionId: number;
        trackName: string;
        trackId: number;
        trackLengthM: number;
}
