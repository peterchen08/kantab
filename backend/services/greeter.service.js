"use strict";
const { MoleculerServerError, MoleculerClientError } = require("moleculer").Errors;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "greeter",

	/**
	 * Settings
	 */
	settings: {
		// 自定义的一个属性,提供后台管理界面根据service和actions遍历并自动生成接口列表
		// aliases: {
		// 			'GET /hello': 'greeter.hello',
		// 			'POST /welcome': 'greeter.welcome',
		// 		}
		// api对greeter服务设置了别名,并且 mappingPolicy: 'restrict' 设置只能通过别名来路由
		// 因此greeter服务只能通过/greeter/hello及/greeter/welcome来访问
		gatewayRoute: "/",
		// admin/src/view/moleculer_apis.vue 中才能计算出别名化之后的正确url
		// const baseUrl = service.settings.gatewayRoute;
        // let url = `${baseUrl}${service.name}${req.rest.path}`;
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

		/**
		 *  @swagger
		 *
		 *  /greeter/hello:
		 *    get:
		 *      tags:
		 *      - "Greeter"
		 *      summary:  say hello
		 *      description: say hello
		 *      responses:
		 *        200:
		 *          description: welcome result
		 *          content: {}
		 *        422:
		 *          description: Missing parameters
		 *          content: {}
		 *      x-codegen-request-body-name: params
		 */
		hello: {
			rest: {
				method: "GET",
				path: "/hello"
			},
			async handler() {
				/**
				 * swagger/dashboard面板中, 4开头的错误码4xx代表客户端错误, 5开头的错误码5xx代表服务端错误
				 */
				throw new MoleculerServerError("抛出异常测试", 402, "ERROR_TEST")
			}
		},

		/**
	 *  @swagger
	 *
	 *  /greeter/welcome:
	 *    post:
	 *      tags:
	 *      - "Greeter"
	 *      summary:  Welcome a username
	 *      description: Welcome a username
	 *      requestBody:
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - name
	 *              type: object
	 *              properties:
	 *                name:
	 *                  type: string
	 *                  description: Name to be used
	 *                  default: John
	 *        required: false
	 *      responses:
	 *        200:
	 *          description: welcome result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
		welcome: {
			rest: "POST /welcome",
			params: {
				name: "string"
			},
			/** @param {Context} ctx  */
			async handler(ctx) {
				return `Welcome, ${ctx.params.name}`;
			}
		}
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
