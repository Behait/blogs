"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/content-distributions',
            handler: 'content-distribution.find',
            config: {
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/content-distributions/:id',
            handler: 'content-distribution.findOne',
            config: {
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/content-distributions',
            handler: 'content-distribution.create',
            config: {
                policies: [],
            },
        },
        {
            method: 'PUT',
            path: '/content-distributions/:id',
            handler: 'content-distribution.update',
            config: {
                policies: [],
            },
        },
        {
            method: 'DELETE',
            path: '/content-distributions/:id',
            handler: 'content-distribution.delete',
            config: {
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/content-distributions/:id/run',
            handler: 'content-distribution.runDistribution',
            config: {
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/content-distributions/:id/status',
            handler: 'content-distribution.getStatus',
            config: {
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/content-distributions/active',
            handler: 'content-distribution.findActive',
            config: {
                policies: [],
            },
        }
    ],
};
