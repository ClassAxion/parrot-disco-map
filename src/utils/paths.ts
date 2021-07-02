import { join } from 'path';

import isDev from './isDev';

export enum Paths {
    PUBLIC,
}

const development: { [key: number]: string } = {
    [Paths.PUBLIC]: join(__dirname, '..', '..', 'public'),
};

const production: { [key: number]: string } = {
    [Paths.PUBLIC]: join(__dirname, '..', 'public'),
};

export default isDev ? development : production;
