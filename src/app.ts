import express, { Application } from 'express';
import { Server } from 'http';

import logger from './utils/logger';
import paths, { Paths } from './utils/paths';

const port: number = Number(process.env.PORT || '8000');

const app: Application = express();

const server: Server = app.listen(port, () => logger.info(`Server listening on ${port}`));

app.use(express.static(paths[Paths.PUBLIC]));

interface Disco {
    id: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    altitude?: number;
    angle?: number;
    speed?: number;
}

const discoOnMap: { [key: string]: Disco } = {};

const io = require('socket.io')(server, {
    allowEIO3: true,
});

let clients = [];

const sendUpdate = (data) => {
    for (const client of clients) {
        client.socket.emit('update', data);
    }
};

io.on('connection', async (socket) => {
    const address: string = socket.handshake.address;

    const socketId: string = socket.id;

    const discoId = Math.random().toString(36).slice(2, 8);

    discoOnMap[discoId] = {
        id: discoId,
    };

    logger.info(`Connection ${socketId} made from ${address}`);

    socket.on('location', ({ latitude, longitude }) => {
        discoOnMap[discoId].location = { latitude, longitude };

        sendUpdate(discoOnMap[discoId]);
    });

    socket.on('altitude', ({ altitude }) => {
        discoOnMap[discoId].altitude = altitude;

        sendUpdate(discoOnMap[discoId]);
    });

    socket.on('angle', ({ angle }) => {
        discoOnMap[discoId].angle = angle;

        sendUpdate(discoOnMap[discoId]);
    });

    socket.on('speed', ({ speed }) => {
        discoOnMap[discoId].speed = speed;

        sendUpdate(discoOnMap[discoId]);
    });

    socket.on('disconnect', () => {
        logger.info(`Socket ${socketId} disconnected`);

        clients = clients.filter((o) => o.socketId !== socketId);
    });

    clients.push({
        socketId: socket.id,
        socket,
    });
});
