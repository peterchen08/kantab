"use strict";

const _ = require("lodash");
const fs = require("fs");
const slugify = require("slugify");
const C = require("../constants");
const { inspect } = require("util");

const DbService = require("../mixins/db.mixin");
const CacheCleaner = require("../mixins/cache-cleaner.mixin");
const MemberCheckMixin = require("../mixins/member-check.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
const { MoleculerClientError } = require("moleculer").Errors;


/**
 * Boards service
 */
module.exports = {
	name: "boards",
	version: 1,

	mixins: [
		DbService({
			cache: {
				additionalKeys: ["#userID"],//额外的缓存健
				/**
		         * 最新版本只需设置 cacheCleanOnDeps=true, 无需混入下面的 CacheCleaner,
				 * dependencies 中所有的服务发生更新变化, populate 填充进来的数据的缓存 也将自动清除
				 * cacheCleanOnDeps:true
				 * 或者
				 * cacheCleanOnDeps: [
                     "user.created",
                     "cache.clean.comments",
                     "my.some.event"
                   ]
		        */
			}
		}),
		CacheCleaner(["cache.clean.v1.lists", "cache.clean.v1.boards", "cache.clean.v1.accounts"]),
		MemberCheckMixin
		//ConfigLoader([])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [{ name: "accounts", version: 1 }],

	/**
	 * Service settings
	 */
	settings: {
		rest: true,

		graphql: {
			entityName: "Board"
		},

		fields: {
			id: {
				type: "string",
				primaryKey: true,
				secure: true,
				columnName: "_id"
			},
			owner: {
				type: "string",
				readonly: true,
				required: true,
				populate: {
					action: "v1.accounts.resolve",
					params: {
						fields: ["id", "username", "fullName", "avatar"]
					}
				},
				/**
				 * 这是创建新实体（create操作createEntity和createEntities方法）时调用的hook操作
				 */
				onCreate: ({ ctx }) => ctx.meta.userID,
				validate: "validateOwner",
				graphql: { type: "Member", inputType: "String" }
			},
			title: {
				type: "string",
				required: true,
				trim: true,
				empty: false,
			},
			slug: {
				//将title中的文本在每个单词之间用“-”链接,生成一个具有可读性的字符串
				type: "string",
				readonly: true,
				set: ({ value, params }) =>
					params.title
						? slugify(params.title, { lower: true, remove: /[*+~.()'"!:@]/g })
						: value
			},
			description: {
				type: "string",
				required: false,
				trim: true,
			},
			position: { type: "number", integer: true, default: 0 },
			public: { type: "boolean", default: false },
			//stars: { type: "number", integer: true, min: 0, default: 0 },
			//starred: { type: "boolean", virtual: true, get: (value, entity, field, ctx) => ctx.call("v1.stars.has", { type: "board", entity: entity.id, user: ctx.meta.userID })},
			labels: {
				type: "array",
				onCreate: () => _.cloneDeep(C.DEFAULT_LABELS),
				items: {
					type: "object",
					properties: {
						id: {
							type: "number",
							/**
							 * ctx:moleculer的Context实例。可以是null
							 * value:字段的值
							 * root:根接收对象。对于嵌套对象验证很有用
							 * params:整个接收到的对象 ( ctx.params)
							 * entity:在更新、替换和删除时，它包含原始的原始（未转换）实体
							 */
							set({ value, root }) {
								if (value) return value;
								return this.generateNextLabelID(root.labels);
							}
						},
						name: { type: "string", required: true },
						color: { type: "string", required: true }
					}
				}
			},
			members: {
				type: "array",
				items: { type: "string", empty: false },
				readonly: true,
				onCreate: ({ ctx }) => (ctx.meta.userID ? [ctx.meta.userID] : []),
				validate: "validateMembers",
				populate: {
					action: "v1.accounts.resolve",
					params: {
						fields: ["id", "username", "fullName", "avatar"]
					}
				},
				graphql: { type: "[Member]", inputType: "String" }
			},
			lists: {
				type: "array",
				items: { type: "string", empty: false },
				readonly: true,
				graphql: {
					query: "lists(page: Int, pageSize: Int, sort: String): ListListResponse"
				},
				populate: {
					action: "v1.lists.list",
					handler(ctx, values, boards) {
						return this.Promise.all(
							boards.map(async board => {
								const res = await ctx.call("v1.lists.list", {
									board: this.encodeID(board._id)
								});
								return res.rows;
							})
						);
					},
					graphqlRootParams: { id: "board" }
				}
			},
			options: { type: "object" },
			...C.ARCHIVED_FIELDS,
			...C.TIMESTAMP_FIELDS
		},

		scopes: {
			// List only boards where the logged in user is a member.
			// If no logged in user, list only public boards.
			membership(query, ctx) {
				if (ctx && ctx.meta.userID) {
					query.members = ctx.meta.userID;
				} else {
					query.public = true;
				}
				return query;
			},

			// List the non-archived boards
			notArchived: { archived: false },

			// List the not deleted boards
			notDeleted: { deletedAt: null },

			// List public boards
			public(query, ctx) {
				query.public = true;
				delete query.members;
				return query;
			}
		},

		defaultScopes: ["membership", "notArchived", "notDeleted"]
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 *  @swagger
		 *
		 *  /api/v1/boards:
		 *    post:
		 *      tags:
		 *      - "Boards"
		 *      summary: 创建看板
		 *      description: 创建看板
		 *      requestBody:
	 	 *        content:
	 	 *          application/json:
		 *            schema:
	 	 *              required:
		 *              - title
		 *              - description
		 *              - public
	 	 *              type: object
		 *              properties:
	 	 *                title:
	 	 *                  type: string
	 	 *                  description: 看板名称
	 	 *                description:
	 	 *                  type: string
	 	 *                  description: 看板描述
	 	 *                public:
	 	 *                  type: boolean
	 	 *                  description: 是否公开
	 	 *                  default: false
		 *        required: false
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        400:
		 *          description: 参数错误
		 *          content: {}
		 *      x-codegen-request-body-name: params
		 */
		create: {
			permissions: [C.ROLE_AUTHENTICATED]
		},
		/**
		 *  @swagger
		 *
		 *  /api/v1/boards:
		 *    get:
		 *      tags:
		 *      - "Boards"
		 *      summary: 看板列表
		 *      description: 看板列表
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        401:
		 *          description: 无操作权限
		 *          content: {}
		 */
		list: {
			permissions: []
		},
		find: {
			rest: "GET /find",
			permissions: []
		},
		count: {
			rest: "GET /count",
			permissions: []
		},
		/**
		 *  @swagger
		 *
		 *  /api/v1/boards/{id}:
		 *    get:
		 *      tags:
		 *      - "Boards"
		 *      summary: 根据ID查看某个面板
		 *      description: 根据ID查看某个board,注意defaultScopes带来的影响,看板的成员才可以查看
		 *      parameters:
		 *      - name: id
	 	 *        in: path
	 	 *        description: 账号ID
	 	 *        schema:
	 	 *           type: string
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        401:
		 *          description: 无操作权限
		 *          content: {}
		 */
		get: {
			/**
			 * find-entity.middleware中间件中根据scopes进行查询,不同的登录用户(token)返回不同的查询结果
			 */
			needEntity: true,
			permissions: []
		},
		update: {
			needEntity: true,
			permissions: [C.ROLE_BOARD_MEMBER]
		},
		replace: false,
		remove: {
			needEntity: true,
			permissions: [C.ROLE_BOARD_OWNER]
		},

		// call v1.boards.addMembers --#userID xar8OJo4PMS753GeyN62 --id ZjQ1GMmYretJmgKpqZ14 --members[] xar8OJo4PMS753GeyN62
		addMembers: {
			description: "Add members to the board",
			rest: "POST /:id/members",
			params: {
				id: "string",
				members: "string[]"
			},
			needEntity: true,
			permissions: [C.ROLE_BOARD_OWNER],
			graphql: {
				mutation: `boardAddMembers(id: String!, members: [String!]!): Board!`
			},
			async handler(ctx) {
				const newMembers = _.uniq(
					[].concat(ctx.locals.entity.members || [], ctx.params.members)
				);

				return this.updateEntity(
					ctx,
					{
						...ctx.params,
						members: newMembers,
						scope: false
					},
					{ permissive: true }
				);
			}
		},

		removeMembers: {
			description: "Remove members from the board",
			rest: "DELETE /:id/members",
			params: {
				id: "string",
				members: "string[]"
			},
			needEntity: true,
			permissions: [C.ROLE_BOARD_OWNER],
			graphql: {
				mutation: `boardRemoveMembers(id: String!, members: [String!]!): Board!`
			},
			async handler(ctx) {
				const newMembers = ctx.locals.entity.members.filter(
					m => !ctx.params.members.includes(m)
				);

				return this.updateEntity(
					ctx,
					{
						id: ctx.params.id,
						members: newMembers,
						scope: false
					},
					{ permissive: true }
				);
			}
		},

		transferOwnership: {
			description: "Transfer the ownership of the board",
			rest: "POST /:id/transfer-ownership",
			params: {
				id: "string",
				owner: "string"
			},
			needEntity: true,
			permissions: [C.ROLE_BOARD_OWNER],
			graphql: {
				mutation: `boardTransferOwnership(id: String!, owner: String!): Board!`
			},
			async handler(ctx) {
				return this.updateEntity(
					ctx,
					{
						id: ctx.params.id,
						owner: ctx.params.owner,
						members: _.uniq([ctx.params.owner, ...ctx.locals.entity.members]),
						scope: false
					},
					{ permissive: true }
				);
			}
		},

		archive: {
			description: "Archive the board",
			rest: "POST /:id/archive",
			params: {
				id: "string"
			},
			needEntity: true,
			permissions: [C.ROLE_BOARD_OWNER],
			graphql: {
				mutation: `boardArchive(id: String!): Board!`
			},
			async handler(ctx) {
				if (ctx.locals.entity.archived)
					throw new MoleculerClientError(
						"Board is already archived",
						400,
						"BOARD_ALREADY_ARCHIVED",
						{ board: ctx.locals.entity.id }
					);
				return this.updateEntity(
					ctx,
					{
						id: ctx.params.id,
						archived: true,
						archivedAt: Date.now(),
						scope: false
					},
					{ permissive: true }
				);
			}
		},

		unarchive: {
			description: "Unarchive the board",
			rest: "POST /:id/unarchive",
			params: {
				id: "string"
			},
			needEntity: true,
			scopes: ["-notArchived"],
			permissions: [C.ROLE_BOARD_OWNER],
			graphql: {
				mutation: `boardUnarchive(id: String!): Board!`
			},
			async handler(ctx) {
				if (!ctx.locals.entity.archived)
					throw new MoleculerClientError(
						"Board is not archived",
						400,
						"BOARD_NOT_ARCHIVED",
						{ board: ctx.locals.entity.id }
					);
				return this.updateEntity(
					ctx,
					{
						id: ctx.params.id,
						archived: false,
						archivedAt: null,
						scope: false
					},
					{ permissive: true }
				);
			}
		}
	},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Generate an incremental number for labels.
		 *
		 * @param {Array} labels
		 * @returns {Number}
		 */
		generateNextLabelID(labels) {
			if (!labels || labels.length == 0) return 1;

			const max = labels.reduce((m, lbl) => Math.max(m, lbl.id || 0), 0);
			return max + 1;
		},

		async checkScopeAuthority(ctx, name, operation) {
			if (operation == "remove") return !["membership", "notDeleted"].includes(name);

			return true;
		},

		/**
		 * Validate the `members` property of board.
		 */
		validateMembers({ ctx, value, params, id, entity }) {
			const members = value;
			return ctx
				.call("v1.accounts.resolve", { id: members, throwIfNotExist: true, fields: ["id"] })
				.then(res => {
					if (res.length == members.length) return res;
					throw new MoleculerClientError(
						"One member is not a valid user.",
						400,
						"MEMBER_NOT_VALID",
						{ board: id, members }
					);
				})
				.then(async () => {
					if (id) {
						const owner = params.owner || entity.owner;
						if (!members.includes(owner)) {
							throw new MoleculerClientError(
								"The board owner can't be removed from the members.",
								400,
								"OWNER_CANT_BE_REMOVED",
								{ board: id, owner, members }
							);
						}
					}
				})
				.then(() => true)
				.catch(err => err.message);
		},

		/**
		 * Validate the `owner` property of board.
		 */
		validateOwner({ ctx, value }) {
			return ctx
				.call("v1.accounts.resolve", {
					id: value,
					throwIfNotExist: true,
					fields: ["status"]
				})
				.then(res =>
					res && res.status == C.STATUS_ACTIVE
						? true
						: `The owner '${value}' is not an active user.`
				)
				.catch(err => err.message);
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {},

	/**
	 * Service started lifecycle event handler
	 */
	started() {},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {}
};
