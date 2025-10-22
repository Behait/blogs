"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function ensureIndexes(strapi) {
    var _a;
    const knex = (_a = strapi.db) === null || _a === void 0 ? void 0 : _a.connection;
    if (!knex) {
        strapi.log.warn('[Indexer] No DB connection available. Skipping index creation.');
        return;
    }
    async function safeAlter(tableName, alterFn, indexName) {
        try {
            await knex.schema.alterTable(tableName, alterFn);
            if (indexName)
                strapi.log.info(`[Indexer] Ensured index: ${tableName}.${indexName}`);
        }
        catch (err) {
            const msg = (err === null || err === void 0 ? void 0 : err.message) || String(err);
            // 索引已存在等错误，忽略
            strapi.log.warn(`[Indexer] Skip creating index on ${tableName}${indexName ? '.' + indexName : ''}: ${msg}`);
        }
    }
    // articles
    await safeAlter('articles', (table) => {
        // 对发布、站点、分类添加索引
        table.index(['published_at'], 'idx_articles_published_at');
        table.index(['site_id'], 'idx_articles_site_id');
        table.index(['category_id'], 'idx_articles_category_id');
    }, 'articles_basic_indexes');
    // 文章-标签关联表
    await safeAlter('articles_tags_links', (table) => {
        table.index(['tag_id'], 'idx_articles_tags_links_tag_id');
        table.index(['article_id'], 'idx_articles_tags_links_article_id');
    }, 'articles_tags_links_indexes');
    // 分发记录表
    await safeAlter('distribution_records', (table) => {
        table.index(['article_id'], 'idx_distribution_records_article_id');
        table.index(['status'], 'idx_distribution_records_status');
        table.index(['distributed_at'], 'idx_distribution_records_distributed_at');
    }, 'distribution_records_indexes');
}
exports.default = ensureIndexes;
