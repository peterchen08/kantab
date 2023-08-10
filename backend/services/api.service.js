"use strict";

var _ = require("lodash");
var ApiGateway = require("moleculer-web");
var OpenApiMixin = require("../mixins/openapi.mixin");
var editorMixin = require("../mixins/editor.mixin");
var { UnAuthorizedError } = ApiGateway.Errors;
var { swMiddleware, swStats } = require('../mixins/smstats.mixin');
const cookie = require("cookie");
var helmet = require('helmet');
var history = require('connect-history-api-fallback');
const C = require("../constants");
const jwt = require("jsonwebtoken");
const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;

const PassportMixin = require("../mixins/passport.mixin");
const ApolloMixin = require("../mixins/apollo.mixin");
const SocketIOMixin = require("moleculer-io");

module.exports = {
	name: "api",
	mixins: [
		ApiGateway,
		// Swagger 文档
		OpenApiMixin(),
		editorMixin(),
		// Passport
		PassportMixin({
			routePath: "/auth",
			localAuthAlias: "v1.accounts.login",
			successRedirect: "/",
			providers: {
				google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
				facebook: process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
				github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
				twitter: false
			}
		}),

		// GraphQL
		ApolloMixin,
		SocketIOMixin
	],

	//全局设置
	settings: {
		port: process.env.PORT || 3000,
		// 只要namespace相同,moleculer自动发现服务
		// 对全局所有路由的单点请求进行频率限制
		rateLimit: {
			// 时间窗口期,默认1分钟
			window: 60 * 1000,
			// 在一个时间窗口期最大请求次数,默认30次
			limit: 60,
			// 将单点请求频率限制写入response的头文件. 默认是false不写入
			headers: true,
			// Function used to generate keys. Defaults to:
			key: (req) => {
				return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
			},
		},
		// 全局级别的中间件
		use: [
			// 在全局,通过设置 HTTP 响应标头保护应用程序
			helmet({
				contentSecurityPolicy: {
					directives: {
						//'default-src': ["'self'"],
						//'base-uri': ["'self'"],
						// 'block-all-mixed-content',
						//'font-src': ["'self'"],
						//'frame-ancestors': ["'self'"],
						//'img-src': ["'self'", 'data:'],
						//'object-src': ["'none'"],
						'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
						//'script-src-attr': ["'none'"],
						//'style-src': ["'self'", "'unsafe-inline'"],
						//'upgrade-insecure-requests': [],
						//'worker-src': ['blob:'],
						'connect-src': [
							"'self'",
							'https://generator3.swagger.io/openapi.json',
							'https://generator3.swagger.io/api/clients',
							'https://generator3.swagger.io/api/servers',
							'https://generator.swagger.io/api/swagger.json',
							'https://generator.swagger.io/api/gen/clients',
							'https://generator.swagger.io/api/gen/servers',
							'https://converter.swagger.io/api/convert',
						],
					},
				},
				//解决跨域请求的问题
				crossOriginEmbedderPolicy: false,
			})
		],

		routes: [
			{
				// 系统监测
				path: '/metric',
				whitelist: [
					'$node.*',
				],
				aliases: {
					"GET /node/options": "$node.options",
					"GET /node/list": "$node.list",
					"GET /node/services": "$node.services",
					"GET /node/actions": "$node.actions"
				},
				autoAliases: true,
				// 只允许别名
				mappingPolicy: "restrict",
				logging: false,
			},
			{
				// swagger stats仪表盘路径
				path: '/swagger',
				// 跨域请求设置
				cors: {
					origin: ['*'],
					methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
					credentials: false,
					maxAge: 3600,
				},
				whitelist: [
					//在"/swagger"路由下将所有services的所有actions都加入白名单
					'**',
				],
				// 路由级别的中间件
				// 在/swagger这个路由下面,启动swagger stats仪表盘中间件
				use: [swMiddleware],
				// 启用/禁用 parameter merging method.
				mergeParams: true,

				// 是否启用身份认证. 对应是否调用 `authenticate` 方法进行认证. 
				authentication: false,

				// 是否启用权限认证. 对应是否调用 `authorize` 方法.
				// authorization: false,

				// 通过白名单中的所有service, 网关可以解析service的schema自动为其生成所有actions的路由
				autoAliases: false,

				aliases: {
					// swagger stats仪表盘入口, 请求http://localhost:3000/swagger 将重定向至 http://localhost:3000/swagger/dashboard
					'GET /'(req, res) {
						res.statusCode = 302;
						res.setHeader('Location', '/swagger/dashboard/');
						return res.end();
					},
					'GET /stats'(req, res) {
						res.setHeader('Content-Type', 'application/json; charset=utf-8');
						return res.end(JSON.stringify(swStats.getCoreStats()));
					},
					'GET /metrics'(req, res) {
						res.setHeader('Content-Type', 'application/json; charset=utf-8');
						return res.end(JSON.stringify(swStats.getPromStats()));
					}
				},

				callingOptions: {},

				bodyParsers: {
					json: { limit: "2MB" },
					urlencoded: { extended: true, limit: "2MB" }
				},

				mappingPolicy: 'restrict', // 有效值为: "all 全部"或"restrict 只允许别名路由"

				// wgger仪表盘不停的请求监测状态,很烦,禁掉
				logging: false,
			},
			{
				path: '/greeter',
				// swagger仪表盘对/greeter路径下的所有请求进行监测
				use: [swMiddleware],
				whitelist: ['greeter.*'],
				aliases: {
					'GET /hello': 'greeter.hello',
					'POST /welcome': 'greeter.welcome',
				},
				// 只允许别名访问,/greeter/greeter/hello将无法调用
				mappingPolicy: 'restrict',
				onAfterCall(ctx, route, req, res, data) {
					//统一返回数据格式
					res.statusCode = 200; //swagger仪表盘监测
					let responseData = {
						code: 200,
						msg: "success",
						data: Object.assign({}, data)
					}
					return responseData;
				}
			},
			{
				path: '/admins',
				cors: {
					origin: ['*'],
					methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
					credentials: false,
					maxAge: 3600,
				},
				whitelist: [
					'v1.admins.*',
				],
				// swagger仪表盘对/admins路径下的所有请求进行监测
				use: [swMiddleware],
				//身份认证
				authentication: true,
				//不自动生成别名接口,如果为tue,则service中的action的rest有值的、visibility不为false的都将被自动别名发布
				autoAliases: false,
				//仅对外暴露如下的别名,并对外发布api接口
				aliases: {
					"POST /auth": "v1.admins.login",
					"POST /register": "v1.admins.register",
					"GET /me": "v1.admins.getMyself",
					"PUT /me": "v1.admins.updateMyself",
					"GET /enable": "v1.admins.enable",
					"GET /disable": "v1.admins.disable",
					"GET /getAdminInfo": "v1.admins.getAdminInfo",
					"GET /list": "v1.admins.list",
					/**
					 * admins服务中DbService的混合选项actionVisibility值为public,所有自动混进来的同名actions,例如list、find、update等
					 * 都不可通过网关对外发布,接口将返回:404 Service 'v1.admins.list' is not found
					 */
					"GET /adminlist": "v1.admins.adminlist",
				},
				bodyParsers: {
					json: { limit: "2MB" },
					urlencoded: { extended: true, limit: "2MB" }
				},
				onAfterCall(ctx, route, req, res, data) {
					//统一返回数据格式
					res.statusCode = 200; //swagger仪表盘监测
					if (typeof (data) == "number") {
						// DbService的count action直接返回的data是一个数字，所以需要特别处理一下
						data = {
							count: data
						}
					}
					let responseData = {
						code: 200,
						msg: "success",
						data: Object.assign({}, data)
					}

					return responseData;
				}
			},
			/**
			 * API routes
			 */
			{
				path: "/api",

				whitelist: [
					"v1.accounts.**",
					"v1.boards.**",
					"v1.lists.**",
					"v1.cards.**",
					"maildev.**"
				],
				etag: true,
				// swagger仪表盘对/api路径下的所有请求进行监测
				// 一定要使用swMiddleware中间件才能有监测数据
				use: [swMiddleware],

				camelCaseNames: true,

				authentication: true,
				//authorization: true,

				autoAliases: true,

				aliases: {},

				// Disable to call not-mapped actions
				//mappingPolicy: "restrict",

				// Use bodyparser modules
				bodyParsers: {
					json: { limit: "2MB" },
					urlencoded: { extended: true, limit: "2MB" }
				},
				onAfterCall(ctx, route, req, res, data) {
					res.setHeader("Content-type", "application/json; charset=utf-8");
					res.statusCode = 200; //swagger仪表盘监测
					return data;
				}
			},
			/**
			 * 静态文件路由 routes
			 */
			{
				path: "/",
				use: [history(), ApiGateway.serveStatic("public", {})],

				mappingPolicy: "restrict",
				logging: false
			}
		],

		onError(req, res, err) {
			res.setHeader("Content-type", "application/json; charset=utf-8");
			res.statusCode = err.code; //swagger仪表盘根据这个返回码进行监测统计

			const errObj = _.pick(err, ["name", "message", "code", "type", "data"]);
			let responseData = {
				code: err.code,
				msg: "错误:" + errObj.message,
				data: {}
			}
			console.log(responseData);
			res.end(JSON.stringify(responseData));
			this.logResponse(req, res, err ? err.ctx : null);
		}
	},

	methods: {
		/**
		 * 对路由请求进行身份认证. 
		 * 
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authenticate(ctx, route, req) {
			let token;

			// 从请求的头文件中读取token,不能直接使用req.headers.authorization其将返回undefined
			const auth = req.headers["authorization"];
			if (auth && auth.startsWith("Bearer ")) token = auth.slice(7);

			// 从cookie中读取 JWT token
			if (!token && req.headers.cookie) {
				const cookies = cookie.parse(req.headers.cookie);
				token = cookies["jwt-token"];
			}

			// 角色暂定为游客
			ctx.meta.roles = [C.ROLE_GUEST];

			let entity;
			let decoded;
			if (token) {
				// 解析token
				decoded = await this.verifyJWT(token);
				if (decoded.type == C.TOKEN_TYPE_ADMIN_VERIFICATION) {
					// 如果token的类型是后台管理账号,则
					entity = await ctx.call("v1.admins.resolveAdmin", { id: decoded.id });
					if (entity) {
						this.logger.info("通过JWT验证:", entity.username);
						//将管理员账号信息写入上下文的元数据ctx.meta
						ctx.meta.admin = _.pick(entity, ["id", "username", "avatar", "roles"]);
						ctx.meta.token = token;
						ctx.meta.adminID = entity.id;

						//增加角色权限
						ctx.meta.roles = _.union(ctx.meta.roles, entity.roles);
					}
				} else if(decoded.type == C.TOKEN_TYPE_ACCOUNT_VERIFICATION){
					// 如果token的类型是短信登录或一键登录类型
					const user = await ctx.call("v1.accounts.resolveToken", { token });
					if (user) {
						this.logger.debug("User authenticated via JWT.", {
							username: user.username,
							email: user.email,
							id: user.id
						});

						ctx.meta.roles.push(C.ROLE_AUTHENTICATED);
						if (Array.isArray(user.roles)) ctx.meta.roles.push(...user.roles);
						ctx.meta.token = token;
						ctx.meta.userID = user.id;
						// Reduce user fields (it will be transferred to other nodes)
						return _.pick(user, ["id", "email", "username", "fullName", "avatar"]);
					}
					return null;
				}
			}

			if (req.$action) {
				if (req.$action.auth == "required" && !entity)
					// 如果请求的action需要身份认证 并且 认证失败则抛出错误
					throw new UnAuthorizedError();
			} else {
				this.logger.info("req.$action", "undefied");
			}


		},

		/**
		 * Verify a JWT token and return the decoded payload
		 *
		 * @param {String} token
		 */
		verifyJWT(token) {
			return new this.Promise((resolve, reject) => {
				jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
					if (err) {
						this.logger.warn("token 验证错误:", err);
						return reject(
							new MoleculerClientError("无效的 token err", 401, "INVALID_TOKEN")
						);
					}

					if (!decoded.id) {
						return reject(
							new MoleculerClientError("无效的 token 无 id", 401, "INVALID_TOKEN")
						);
					};

					if (!decoded.type) {
						return reject(
							new MoleculerClientError("无效的 token 无 type", 401, "INVALID_TOKEN")
						);
					};

					resolve(decoded);
				});
			});
		},
	}
};
