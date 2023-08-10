"use strict";

const _ = require("lodash");

/**
 * 主要对action将要操作的目标实体存在与否做检查,如果目标entity根本就不存在则抛出 EntityNotFound 错误
 * 如果目标实体存在,将查询到的entity挂载到ctx.locals下
 */
module.exports = {
	name: "FindEntity",

	// 对本地的action handlers进行转换
	localAction(handler, action) {
		// If this feature enabled
		if (action.needEntity) {
			return async function FindEntityMiddleware(ctx) {
				const svc = ctx.service;
				const params = { id: ctx.params.id };
				this.logger.error(ctx.params.id);
				if (action.scopes) {
					params.scope = action.scopes;
				} else {
					params.scope = ctx.params.scope;
				}
				if (action.defaultPopulate) {
					params.populate = action.defaultPopulate;
				}
				ctx.locals.entity = await svc.resolveEntities(ctx, params, {
					throwIfNotExist: true
				});

				// Call the handler
				return handler(ctx);
			}.bind(this);
		}

		// Return original handler, because feature is disabled
		return handler;
	}
};
