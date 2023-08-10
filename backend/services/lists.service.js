"use strict";

const C = require("../constants");
const DbService = require("../mixins/db.mixin");
const CacheCleaner = require("../mixins/cache-cleaner.mixin");
const MemberCheckMixin = require("../mixins/member-check.mixin");
const NextPositionMixin = require("../mixins/next-position.mixin");
const BoardValidatorsMixin = require("../mixins/board-validators.mixin");
//const ConfigLoader = require("../mixins/config.mixin");
const { MoleculerClientError } = require("moleculer").Errors;

/**
 * List of boards service
 */
module.exports = {
	name: "lists",
	version: 1,

	mixins: [
		DbService({
			cache: {
				additionalKeys: ["board", "#userID"]
			}
		}),
		CacheCleaner(["cache.clean.v1.lists", "cache.clean.v1.boards", "cache.clean.v1.accounts"]),
		MemberCheckMixin,
		NextPositionMixin,
		BoardValidatorsMixin
		//ConfigLoader([])
	],

	/**
	 * Service dependencies
	 */
	dependencies: [{ name: "boards", version: 1 }],

	/**
	 * Service settings
	 */
	settings: {
		rest: "/v1/boards/:board/lists",

		graphql: {
			entityName: "List"
		},

		fields: {
			id: {
				type: "string",
				primaryKey: true,
				secure: true,
				columnName: "_id"
			},
			board: {
				type: "string",
				required: true,
				immutable: true,
				populate: {
					action: "v1.boards.resolve",
					params: {
						fields: ["id", "title", "slug", "description"]
					}
				},
				validate: "validateBoard",
				graphql: { type: "Board", inputType: "String" }
			},
			title: {
				type: "string",
				required: true,
				trim: true,
				empty: false,
				openapi: { example: "Backlog" }
			},
			description: {
				type: "string",
				required: false,
				trim: true,
				openapi: { example: "My list description" }
			},
			color: { type: "string", required: false, trim: true },
			position: {
				type: "number",
				graphql: { type: "Float" },
				default({ ctx }) {
					return this.getNextPosition(ctx);
				}
			},
			cards: {
				type: "array",
				items: { type: "string", empty: false },
				readonly: true,
				graphql: {
					query: "cards(page: Int, pageSize: Int, sort: String): CardListResponse"
				},
				populate: {
					action: "v1.cards.list",
					handler(ctx, values, boards) {
						return this.Promise.all(
							boards.map(async board => {
								const res = await ctx.call("v1.cards.list", {
									board: this.encodeID(board._id)
								});
								return res.rows;
							})
						);
					},
					graphqlRootParams: { id: "list" }
				}
			},
			options: { type: "object" },
			...C.TIMESTAMP_FIELDS
		},

		scopes: {
			// Return lists of a given board where the logged in user is a member.
			async board(query, ctx, params) {
				// Adapter init
				if (!ctx) return query;

				if (params.board) {
					const res = await ctx.call("v1.boards.resolve", {
						id: params.board,
						throwIfNotExist: false
					});
					if (res) {
						query.board = params.board;
						return query;
					}
					throw new MoleculerClientError(
						`You have no right for the board '${params.board}'`,
						403,
						"ERR_NO_PERMISSION",
						{ board: params.board }
					);
				}
				if (ctx.action.params.board && !ctx.action.params.board.optional) {
					throw new MoleculerClientError(`Board is required`, 422, "VALIDATION_ERROR", [
						{ type: "required", field: "board" }
					]);
				}
			},

			// List the not deleted lists
			notDeleted: { deletedAt: null }
		},

		defaultScopes: ["board", "notDeleted"]
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 *  @swagger
		 *
		 *  /api/v1/boards/{board}/lists:
		 *    post:
		 *      tags:
		 *      - "Lists"
		 *      summary: 创建条目
		 *      description: 创建条目
		 *      parameters:
		 *      - name: board
	 	 *        in: path
	 	 *        description: 看板ID
	 	 *        schema:
	 	 *           type: string
		 *      requestBody:
	 	 *        content:
	 	 *          application/json:
		 *            schema:
		 *              required:
		 *              - title
		 *              - description
	 	 *              type: object
		 *              properties:
	 	 *                title:
	 	 *                  type: string
	 	 *                  description: 条目名称
	 	 *                description:
	 	 *                  type: string
	 	 *                  description: 条目描述
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
			permissions: [C.ROLE_BOARD_MEMBER]
		},
		/**
		 *  @swagger
		 *
		 *  /api/v1/boards/{board}/lists:
		 *    get:
		 *      tags:
		 *      - "Lists"
		 *      summary: 看板下所有条目
		 *      description: 看板下所有条目
		 *      parameters:
		 *      - name: board
	 	 *        in: path
	 	 *        description: 看板ID
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
		list: {
			permissions: [],
			params: {
				board: { type: "string" }
			}
		},

		find: {
			rest: "GET /find",
			permissions: [],
			params: {
				board: { type: "string" }
			}
		},

		count: {
			rest: "GET /count",
			permissions: [],
			params: {
				board: { type: "string" }
			}
		},
		/**
		 *  @swagger
		 *
		 *  /api/v1/boards/{board}/lists/{id}:
		 *    get:
		 *      tags:
		 *      - "Lists"
		 *      summary: 根据看板ID、条目ID查看某个条目
		 *      description: 根据看板ID、条目ID查看某个条目
		 *      parameters:
		 *      - name: board
		 *        in: path
		 *        description: 看板ID
		 *        schema:
		 *          type: string
		 *      - name: id
	 	 *        in: path
	 	 *        description: 条目ID
	 	 *        schema:
		 *          type: string
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        401:
		 *          description: 无操作权限
		 *          content: {}
		 */
		get: {
			needEntity: true,
			permissions: [C.ROLE_BOARD_MEMBER]
		},

		update: {
			needEntity: true,
			permissions: [C.ROLE_BOARD_MEMBER]
		},

		replace: false,

		remove: {
			needEntity: true,
			permissions: [C.ROLE_BOARD_MEMBER]
		}
	},

	/**
	 * Events
	 */
	events: {
		async "boards.removed"(ctx) {
			const board = ctx.params.data;
			try {
				const lists = await this.findEntities(ctx, {
					query: { board: board.id },
					fields: ["id"],
					scope: false
				});
				await this.Promise.all(
					lists.map(list => this.removeEntity(ctx, { id: list.id, scope: false }))
				);
			} catch (err) {
				this.logger.error(`Unable to delete lists of board '${board.id}'`, err);
			}
		},

		async "boards.cleared"(ctx) {
			try {
				await this.clearEntities(ctx);
			} catch (err) {
				this.logger.error("Unable to clear lists", err);
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {},

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
