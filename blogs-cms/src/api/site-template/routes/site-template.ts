export default {
  routes: [
    {
      method: 'GET',
      path: '/site-templates',
      handler: 'site-template.find',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/site-templates/:id',
      handler: 'site-template.findOne',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/site-templates',
      handler: 'site-template.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/site-templates/:id',
      handler: 'site-template.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/site-templates/:id',
      handler: 'site-template.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};