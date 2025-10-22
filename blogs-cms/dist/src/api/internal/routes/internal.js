"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/internal/auto-tag',
            handler: 'internal.autoTag',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/internal/ai-generate',
            handler: 'internal.aiGenerate',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
