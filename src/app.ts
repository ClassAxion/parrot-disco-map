import express, { Application } from 'express';
import { Server } from 'http';

import logger from './utils/logger';
import paths, { Paths } from './utils/paths';

const port: number = Number(process.env.PORT || '8000');

const app: Application = express();

const server: Server = app.listen(port, () => logger.info(`Server listening on ${port}`));

app.use(express.static(paths[Paths.PUBLIC]));

const io = require('socket.io')(server, {
    allowEIO3: true,
});

io.on('connection', async (socket) => {
    const address = socket.handshake.address;

    logger.info(`Connection ${socket.id} made from ${address}`);

    socket.on('init', (data) => {});

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected`);
    });
});
