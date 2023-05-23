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

const variableMap = (value, inMin, inMax, outMin, outMax) =>
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

io.on('connection', async (socket) => {
    const address: string = socket.handshake.address;

    const socketId: string = socket.id;

    logger.info(`Connection ${socketId} made from ${address}`);

    socket.on('disco', ({ id }) => {
        if (!id) {
            socket.close()

            logger.info(`Dropped invalid connection`)

            return
        }

        socket.discoId = id;

        discoOnMap[id] = {
            id,
        };

        logger.info(`Disco ${id} connected`);
    });

    socket.on('location', ({ latitude, longitude }) => {
        if (!socket.discoId) return;

        discoOnMap[socket.discoId].location = { latitude, longitude };

        sendUpdate(discoOnMap[socket.discoId]);
    });

    socket.on('altitude', ({ altitude }) => {
        if (!socket.discoId) return;

        discoOnMap[socket.discoId].altitude = altitude;

        sendUpdate(discoOnMap[socket.discoId]);
    });

    socket.on('yaw', ({ yaw }) => {
        if (!socket.discoId) return;

        let angle = Number(variableMap(yaw, -180, 180, 0, 360).toFixed(0)) - 180;

        if (angle > 360) angle -= 360;
        if (angle < 0) angle = 360 - angle * -1;

        discoOnMap[socket.discoId].angle = angle;

        sendUpdate(discoOnMap[socket.discoId]);
    });

    socket.on('speed', ({ speed }) => {
        if (!socket.discoId) return;

        discoOnMap[socket.discoId].speed = speed;

        sendUpdate(discoOnMap[socket.discoId]);
    });

    socket.on('disconnect', () => {
        if (!socket.discoId) {
            logger.info(`Socket ${socketId} disconnected (without disco)`);
        } else {
            logger.info(`Socket ${socketId} disconnected (with disco ${socket.discoId})`);
        }

        clients = clients.filter((o) => o.socketId !== socketId);
    });

    socket.on('test', () => {
        sendUpdate({
            id: 'test',
            location: { latitude: 53.34912, longitude: 17.64003 },
            altitude: 100,
            speed: 8,
            angle: 180,
        });
    });

    clients.push({
        socketId: socket.id,
        socket,
    });
});
