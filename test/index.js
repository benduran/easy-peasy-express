'use strict';

const
    fs = require('fs'),
    path = require('path');

const {expect} = require('chai');

const easyPeasy = require('../dist').default;

function runAll() {
    describe('Routefile', () => {
        it('Should read the route file in JSON format', () => {
            const middleware = easyPeasy({
                routesFile: path.resolve(path.join(__dirname, './routes.json')),
                controllersFolder: path.resolve(path.join(__dirname, './controllers'))
            });
            expect(JSON.stringify(middleware.routes)).to.equal(JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, '/routes.json'), 'utf8'))));
        });
        it('Should read the route file in YAML format', () => {
            const middleware = easyPeasy({
                routesFile: path.resolve(path.join(__dirname, './routes.json')),
                controllersFolder: path.resolve(path.join(__dirname, './controllers'))
            });
            expect(JSON.stringify(middleware.routes)).to.equal(JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, './routes.json'), 'utf8'))));
        });
    });
}

runAll();