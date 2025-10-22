export default {
  routes: [
    {
      method: 'GET',
      path: '/distribution-records',
      handler: 'distribution-record.find',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/distribution-records/:id',
      handler: 'distribution-record.findOne',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/distribution-records',
      handler: 'distribution-record.create',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/distribution-records/:id',
      handler: 'distribution-record.update',
      config: {
        policies: [],
      },
    },
    {
      method: 'DELETE',
      path: '/distribution-records/:id',
      handler: 'distribution-record.delete',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/distribution-records/by-article/:articleId',
      handler: 'distribution-record.findByArticle',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/distribution-records/by-site/:siteId',
      handler: 'distribution-record.findBySite',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/distribution-records/:id/retry',
      handler: 'distribution-record.retry',
      config: {
        policies: [],
      },
    },
  ],
};