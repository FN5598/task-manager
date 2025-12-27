export type RoomState = {
    roomId: string
    members: string[];
    currentDrawerIndex: number;
    turnEndsAt: number | null;
    maxPlayers: 3;
    interval?: NodeJS.Timeout
};