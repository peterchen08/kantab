"use strict";
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const _ = require("lodash");

const jwt = require("jsonwebtoken");

const DbService = require("../mixins/db.mixin");
const { generateValidatorSchemaFromFields } = require("@moleculer/database");
const ConfigLoader = require("../mixins/config.mixin");

const { MoleculerRetryableError, MoleculerClientError } = require("moleculer").Errors;
const C = require("../constants");

const HASH_SALT_ROUND = 10;


/**
 * 笔记摘要
 * 对于@moleculer/database服务,
 * 1、首先需要提供字段:FIELDS,然后调用该服务的adapter根据字段生成表格
 * 2、字段可以各种规范设置,符合要求才通过adapter存入指定数据库
 * 3、该服务可以从数据库中读取表格中各个字段的值,生成指定的实例entity对象
 * 4、实体entity与字段FIELDS并不等价,该服务通过数据库中的字段值对实体entity进行实例化,
 * 实体又可分为原始数据实体 和 变换后的实体,例如实体有些字段需要隐藏、实体的某个属性是通过几个字段计算出来的虚拟值等等
 * 因此FIELDS和entity并不等价,可以根据需求是否转换:transform
 * 5、某些字段的值可以监听实体entityChanged的onCreate、onUpdate、onReplace、onRemove事件自动更新
 * 6、该服务自动混进许多action,提高开发效率,可以通过混入选项createActions: false来禁止该功能
 * 可选的自动生成action: find、list、count、get、resolve(类似find by id||ids)、create、createMany
 * update、replace、remove
 * 7、当需要自定义自己的action的时候,可以调用服务内置的方法来完成我们的操作:
 * 数据库操作方法:
 * getAdapter、sanitizeParams、findEntities、streamEntities、countEntities、findEntity、resolveEntities
 * createEntity、createEntities、updateEntity、updateEntities、replaceEntity、removeEntity、removeEntities
 * clearEntities、validateParams、transformResult、createIndexes、createIndex
 * 8、其它需要按自定义逻辑去重写的方法(相关于需要Override):
 * getAdapterByContext(多租户)、entityChanged(手动发起通知)、encodeID、decodeID、checkFieldAuthorityI(字段权限检查)
 * checkScopeAuthority、
 * Streaming串流:streamEntities
 * 9、事件:{serviceName}.created、{serviceName}.updated、{serviceName}.replaced、{serviceName}.removed、{serviceName}.cleared
 */
const FIELDS = {
	/** 
	 * secure:true，可以加密 ID 字段的值。防止数据库自动递增ID值时被恶意猜出ID
	 * 同时需要在method中定义encodeID(id)和decodeID(id)方法
	 * columnName:string 数据库中存储的真实字段名,相当于自动别名
	*/
	id: { type: "string", primaryKey: true, secure: true, columnName: "_id" },
	username: {
		type: "string",
		max: 50,
		empty: false,
		required: true,
		trim: true,
		validate: ({ value }) => /^[a-zA-Z0-9]+$/.test(value) || "用户名仅限大小写字母+数字组成"
	},
	/**
	 * permission决定谁可以更改该字段,
	 * readPermission决定谁可以查看该字段
	 * 并且对应到method中定义的checkFieldAuthority方法
	 * async checkFieldAuthority(ctx, permission, params, field) {
			const roles = ctx.meta.user.roles || [];
			return roles.includes(permission);
		}
	 * hidden: true,当调用transformation并返回的结果的时候,该字段被隐藏
	 * readonly: true 该字段不能由用户设置,只能通过service才能设置
	 * immutable: true 不可变字段,只可以设置一次
	 * default默认值也可以是个回调函数, 这个函数有可能是异步的
	 * default: async ({ ctx }) => await ctx.call("config.getDefaultRole") }
	 */
	password: { type: "string", min: 6, max: 60, hidden: true },

	avatar: { type: "string", max: 255, default: C.DEFAULT_AVATAR },

	roles: {
		type: "array",
		items: { type: "string", empty: false },
		default() {
			return this.config["admins.defaultRoles"];
		}
	},
	mobile: {
		type: "string",
		required: true,
		permission: "admin",
		validate: ({ value }) => /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/.test(value) || "清输入正确的手机号码"
	},
	status: { type: "number", readonly: true, default: 1 },
	token: { type: "string", readonly: true, virtual: true }, // filled only in login response
	...C.TIMESTAMP_FIELDS
};

module.exports = {
	name: "admins",
	version: 1,

	mixins: [
		/**
		 * 自动混进 entityChanged,在生命周期内creat、update、replace、remove事件中发生调用
		 * 可以在methods中对entityChanged方法进行重写覆盖
		 * @moleculer/database无需传入表名称,它会自动读取服务的 name
		 * 
		 * ConfigLoader 读取 site、admins开头的配置,然后通过this.config["admins.***"]取得配置文件的值
		 * DbService.actionVisibility 混入的actions的可见性
		 * published:默认值,可本地、远程调用,并且可通过api网关对外发布
		 * public:仅本地或远程service调用,不对外网开放
		 * protected:仅本地可调用
		 * private:service内部this.actions.xy()调用
		 */
		//public:混进来的actions将不可对外发布,同名重写也不行
		DbService({ actionVisibility: C.VISIBILITY_PUBLIC }),
		ConfigLoader(["site.**", "admins.**", "tokens.**"])
	],

	dependencies: [{ name: "config", version: 1 }],

	settings: {
		/**
		 * rest、actions、fields、indexes都是提供给@moleculer/database的设置
		 */

		// GET /{serviceName}/count 是否启用RESTful风格
		rest: true,

		fields: FIELDS,//表的字段验证和清理输入数据

		//创建索引
		indexes: [
			{ fields: "username", unique: true },
			{ fields: "mobile", unique: true }
		],


		// 自定义的一个属性,提供后台管理界面根据service和actions遍历并自动生成接口列表
		gatewayRoute: "/admins/",

	},

	actions: {
		/**
		 *  @swagger
		 *
		 *  /admins/register:
		 *    post:
		 *      tags:
		 *      - "Admin"
		 *      summary: 创建一个管理员
		 *      description: 创建一个管理员
		 *      requestBody:
	 	 *        content:
	 	 *          application/json:
		 *            schema:
	 	 *              required:
		 *              - username
		 *              - password
		 *              - mobile
		 *              - roles
		 *              - avatar
	 	 *              type: object
		 *              properties:
	 	 *                username:
	 	 *                  type: string
	 	 *                  description: 后台登录用户名
	 	 *                  default: guest
	 	 *                password:
	 	 *                  type: string
	 	 *                  description: 后台登录密码
	 	 *                  default: 123456
	 	 *                mobile:
	 	 *                  type: string
	 	 *                  description: 手机号
	 	 *                  default: 
		 *                roles:
		 *                  type: array
		 *                  items:
		 *                    type: string
		 *                  description: 角色权限
		 *                  default: ["guest"]
		 *                avatar:
		 *                  type: string
		 *                  description: 头像
	 	 *                  default: 	
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
		register: {
			rest: "POST /register",
			permissions: [C.ROLE_SUPER_ADMIN],
			params: generateValidatorSchemaFromFields(
				_.pick(FIELDS, ["username", "mobile", "password", "access", "avatar"]),
				{ type: "create" }
			),
			async handler(ctx) {
				//let entity = ctx.params;
				const entity = Object.assign({}, ctx.params);
				if (!entity.username) {
					throw new MoleculerClientError(
						"用户名不能为空.",
						400,
						"USERNAME_EMPTY"
					);
				}

				let found = await this.getUserByUsername(ctx, entity.username);
				if (found)
					throw new MoleculerClientError(
						"用户名已经被使用了.",
						400,
						"USERNAME_EXISTS"
					);

				if (!entity.avatar || entity.avatar.length == 0) {
					// Default avatar as Gravatar
					const md5 = crypto.createHash("md5").update(entity.username).digest("hex");
					entity.avatar = `https://gravatar.com/avatar/${md5}?s=64&d=robohash`;
				}

				if (entity.password) {
					entity.password = await bcrypt.hash(entity.password, 10);
				} else {
					throw new MoleculerClientError(
						"登录密码不能为空.",
						400,
						"PASSWORD_EMPTY"
					);
				}

				if (entity.mobile) {
					found = await this.getUserByMobile(ctx, entity.mobile);
					if (found)
						throw new MoleculerClientError(
							"该手机号已经被注册.",
							400,
							"MOBILE_EXISTS"
						);
				} else {
					throw new MoleculerClientError(
						"手机号码不能为空.",
						400,
						"MOBILE_EMPTY"
					);
				}

				/**
				 * permissive=true 可以设置和更新只读和不可变字段，并且不检查字段权限
				 */
				const admin = await this.createEntity(ctx, entity, { permissive: true });
				admin.token = await this.getToken(admin);

				return admin;
			}
		},

		/**
		 *  @swagger
		 *
		 *  /admins/auth:
		 *    post:
		 *      tags:
		 *      - "Admin"
		 *      summary: 后台管理员登录
		 *      description: 后台管理员登录
		 *      requestBody:
	 	 *        content:
	 	 *          application/json:
		 *            schema:
	 	 *              required:
		 *              - username
		 *              - password
	 	 *              type: object
		 *              properties:
	 	 *                username:
	 	 *                  type: string
	 	 *                  description: 后台登录用户名
	 	 *                password:
	 	 *                  type: string
	 	 *                  description: 后台登录密码
		 *        required: false
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        422:
		 *          description: 缺失参数
		 *          content: {}
		 *      x-codegen-request-body-name: params
		 */
		login: {
			rest: "POST /login",
			params: {
				username: { type: "string", optional: false },
				password: { type: "string", optional: false }
			},
			async handler(ctx) {
				// 默认使用用户名登录,transform: false 不过滤字段
				let _admin = await this.getUserByUsername(ctx, ctx.params.username, {
					transform: false
				});
				// 如果通过用户名找不到用户,那么用户可能输入的是手机号
				if (!_admin && this.config["admins.mobile.enabled"]) {
					// 如果配置文件中允许用户使用手机号+密码登录
					_admin = await this.getUserByMobile(ctx, ctx.params.email, { transform: false });
				}

				if (!_admin) {
					throw new MoleculerClientError(
						"该账号尚未注册.",
						400,
						"ACCOUNT_NOT_FOUND"
					);
				}

				const res = await bcrypt.compare(ctx.params.password, _admin.password);
				if (!res)
					throw new MoleculerClientError("用户名或密码错误!", 422, "", [{ field: "password", message: "用户名或密码错误" }]);

				// 变换一下entity 隐藏密码字段等操作,然后输出
				const admin = await this.transformResult(null, _admin, {}, ctx);
				admin.token = await this.getToken(admin);
				this.checkAdmin(admin);
				return admin;
			}
		},


		/**
		 *  @swagger
		 *
		 *  /admins/disable:
		 *    get:
		 *      tags:
		 *      - "Admin"
		 *      summary: 禁用一个后台账户
		 *      description: 禁用一个后台账户
	     *      parameters:
		 *      - name: id
	 	 *        in: query
	 	 *        description: 账号ID
	 	 *        schema:
	 	 *           type: string
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        400:
		 *          description: 账户已是启用状态
		 *          content: {}
		 */
		disable: {
			rest: "GET /disable",
			/**
			 * check-permissions中间件读取下面这个属性判断操作权限
			 */
			permissions: [C.ROLE_SUPER_ADMIN],
			params: {
				id: { type: "string" }
			},
			/**
			 * find_entity.middleware中间件,检查操作对象是否存在,如果存在则将操作对象赋予ctx.locals.entity
			 */
			needEntity: true,
			async handler(ctx) {
				const admin = ctx.locals.entity;
				if (admin.status == 0)
					throw new MoleculerClientError(
						"该账户已经被禁用.",
						400,
						"ERR_USER_ALREADY_DISABLED"
					);

				const res = await this.updateEntity(
					ctx,
					{
						id: admin.id,
						status: 0
					},
					//permissive为true,可略过权限检查
					{ permissive: true }
				);

				return res;
			}
		},

		/**
		 *  @swagger
		 *
		 *  /admins/list:
		 *    get:
		 *      tags:
		 *      - "Admin"
		 *      summary: DbService内置actions 测试
		 *      description: 混合选项actionVisibility为public的情况下,DbService混进来的actions及同名自定义action例如 list find update等都将无法被api网关对外发布
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        404:
		 *          description: 404 Service 'v1.admins.list' is not found 
		 *          content: {}
		 */
		list: {
			rest: 'GET /list',
			auth: "required",
			permissions: [C.ROLE_SUPER_ADMIN],
			async handler(ctx) {
				return "Welcome, moleculor!";
			}
		},

		/**
		 *  @swagger
		 *
		 *  /admins/adminlist:
		 *    get:
		 *      tags:
		 *      - "Admin"
		 *      summary: 后台账户列表
		 *      description: 后台账户列表,手动实现v1.admins.list相同功能
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        401:
		 *          description: 无操作权限
		 *          content: {}
		 */
		adminlist: {
			auth: "required",
			permissions: [C.ROLE_SUPER_ADMIN, C.ROLE_ADMIN],
			async handler(ctx) {
				return await this.findEntities(ctx, { limit: 10, offset: 0 });
			}
		},


		/**
		 *  @swagger
		 *
		 *  /admins/enable:
		 *    get:
		 *      tags:
		 *      - "Admin"
		 *      summary: 启用一个后台账户
		 *      description: 启用一个后台账户
	     *      parameters:
		 *      - name: id
	 	 *        in: query
	 	 *        description: 账号ID
	 	 *        schema:
	 	 *           type: string
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        400:
		 *          description: 账户已是启用状态
		 *          content: {}
		 */
		enable: {
			rest: "GET /enable",
			permissions: [C.ROLE_SUPER_ADMIN],
			params: {
				id: { type: "string" }
			},
			// find-entity.middleware 中间件将根据params中的id查询到的对象挂载到ctx.locals,找不到对象则抛出错误
			needEntity: true,
			async handler(ctx) {
				const user = ctx.locals.entity;
				if (user.status == 1)
					throw new MoleculerClientError(
						"账户已是启用状态.",
						400,
						"ERR_USER_ALREADY_ENABLED"
					);

				const res = await this.updateEntity(
					ctx,
					{
						id: user.id,
						status: 1
					},
					{ permissive: true }
				);

				return {
					id: user.id,
					status: res.status
				};
			}
		},


		resolveAdmin: {
			//visibility: "private",//对所有节点的borker均不可见
			visibility: "public",
			cache: {
				keys: ["id"],
				ttl: 60 * 60 // 1 小时
			},
			params: {
				id: "string"
			},
			async handler(ctx) {
				/**
				 * resolveEntities 类似findByID,第二个参数对象中必须包含{ id:xxx }id字段
				 */
				console.log(ctx.params);
				const admin = await this.resolveEntities(ctx, ctx.params, { transform: false/**不转换,获取原始的entity数据*/ });
				this.checkAdmin(admin);

				return await this.transformResult(null, admin, {}, ctx);
			}
		},

		/**
		 * parameters 获取参数的yaml语法
		 * /admin/user/{id} in: path 从url路径中读取
		 * /admin/user?ID=12345 in: qurey 从url携带的参数中读取
		 * in: header  从请求头文件中读取
		 * in: cookie  从cookie中读取
		 * 注意不要有中文空格
		 * /

		/**
		 *  @swagger
		 *
		 *  /admins/getAdminInfo:
		 *    get:
		 *      tags:
		 *      - "Admin"
		 *      summary: 获取管理员账号信息
		 *      description: 获取管理员账号信息
	     *      parameters:
		 *      - name: id
	 	 *        in: query
	 	 *        description: 账号ID
	 	 *        schema:
	 	 *           type: string
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        422:
		 *          description: 缺少参数
		 *          content: {}
		 */
		getAdminInfo: {
			auth: "required",
			cache: {
				keys: ["id"],
				ttl: 60 * 60 // 1 hour
			},
			params: {
				id: "string"
			},
			rest: "GET /getAdminInfo",
			async handler(ctx) {
				const admin = await this.resolveEntities(ctx, ctx.params, { transform: false });
				this.checkAdmin(admin);

				return await this.transformResult(null, admin, {}, ctx);
			}
		},

		/**
		 *  @swagger
		 *
		 *  /admins/me:
		 *    get:
		 *      tags:
		 *      - "Admin"
		 *      summary: 获取当前账号信息
		 *      description: 获取当前账号信息
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        422:
		 *          description: 缺失参数
		 *          content: {}
		 */
		getMyself: {
			/**
			 * api.service 中 authorize 认证的时候会读取action的auth字段进行token认证
			 * 并且认证成功后会往meta中添加了3个字段:token admin adminID
			 */
			auth: "required",
			rest: "GET /me",
			cache: {
				keys: ["#adminID"]
			},
			async handler(ctx) {
				//设置auth: "required"后,无需作下面的判断了,authorize认证通过后ctx.meta.adminID肯定不为null
				//if (!ctx.meta.adminID) return null;

				const admin = await this.resolveEntities(ctx, { id: ctx.meta.adminID }, { transform: false });
				this.checkAdmin(admin);

				return await this.transformResult(null, admin, {}, ctx);
			}
		},

		/**
		 *  @swagger
		 *
		 *  /admins/me:
		 *    put:
		 *      tags:
		 *      - "Admin"
		 *      summary: 更新当前账号信息
		 *      description: 更新当前账号信息
		 *      requestBody:
	 	 *        content:
	 	 *          application/json:
		 *            schema:
	 	 *              type: object
		 *              properties:
		 *                admin:
		 *                  type: object
		 *                  properties:
		 *                    avatar:
		 *                      type: string
		 *                      description: 头像地址
		 *                    roles:
		 *                      type: array
		 *                      items:
		 *                        type: string
		 *                        description: 账号权限
		 *                        default: "guest"
		 *        required: false
		 *      responses:
		 *        200:
		 *          description: 请求成功
		 *          content: {}
		 *        422:
		 *          description: 缺失参数
		 *          content: {}
		 *      x-codegen-request-body-name: params
		 */
		updateMyself: {
			auth: "required",
			rest: "PUT /me",
			params: {
				admin: {
					type: "object", props: {
						avatar: { type: "string" },
						roles: {
							type: "array",
							items: { type: "string" },
						}
					}
				}
			},
			async handler(ctx) {
				const newData = {
					id:ctx.meta.adminID,
					avatar:ctx.params.admin.avatar,
					roles:ctx.params.admin.roles
				};
				/**
				 * updateEntity方法中,第二个参数是个必须包含id字段的对象
				 */
				return await this.updateEntity(ctx, newData,{ permissive: true });
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {

		/**
		 * Get user by mobile
		 *
		 * @param {Context} ctx
		 * @param {String} mobile
		 * @param {Object?} opts
		 */
		async getUserByMobile(ctx, mobile, opts) {
			return await this.findEntity(ctx, { query: { mobile } }, opts);
		},

		/**
		 * Get user by username
		 *
		 * @param {Context} ctx
		 * @param {String} username
		 * @param {Object?} opts
		 */
		async getUserByUsername(ctx, username, opts) {
			return await this.findEntity(ctx, { query: { username } }, opts);
		},

		/**
		 * Check the admin fields (status)
		 * @param {Object} admin
		 * @param {Object?} opts
		 */
		checkAdmin(admin) {
			if (!admin) {
				throw new MoleculerClientError(
					"该账号尚未注册.",
					400,
					"ACCOUNT_NOT_FOUND"
				);
			}

			if (admin.status !== 1) {
				throw new MoleculerClientError("该账号被禁用了.", 400, "ACCOUNT_DISABLED");
			}
		},

		async getToken(admin) {
			return await this.generateJWT({ id: admin.id.toString(), type: C.TOKEN_TYPE_ADMIN_VERIFICATION });
		},

		/**
		 * Generate a JWT token from user entity.
		 *
		 * @param {Object} payload
		 * @param {String|Number} [expiresIn]
		 */
		generateJWT(payload, expiresIn) {
			console.log(this.config["tokens.jwt.expires"]);
			return new this.Promise((resolve, reject) => {
				return jwt.sign(
					payload,
					process.env.JWT_SECRET,
					{ expiresIn: expiresIn || this.config["tokens.jwt.expires"] },
					(err, token) => {
						if (err) {
							this.logger.warn("生成JWT token失败:", err);
							return reject(
								new MoleculerRetryableError(
									"生成JWT token失败",
									500,
									"UNABLE_GENERATE_TOKEN"
								)
							);
						}

						resolve(token);
					}
				);
			});
		},

		async hashPassword(pass) {
			return bcrypt.hash(pass, HASH_SALT_ROUND);
		},

		/**
		 * 初始化1个超级管理员，1个普通管理员, 1个测试用户
		 */
		async seedDB() {
			/**
			 * 打开注释可生成一串随机的JWT_SECRET
			 * let JWT_SECRET = crypto.randomBytes(32).toString("hex");
			 * console.log("JWT_SECRET:"+JWT_SECRET)
			 */

			const res = await this.createEntities(
				null,
				[
					// Administrator
					{
						username: "superAdmin",
						fullName: "Administrator",
						mobile: "13800000001",
						password: await this.hashPassword("admin"),
						avatar: "https://user-images.githubusercontent.com/306521/112635269-e7511f00-8e3b-11eb-8a59-df6dda998d05.png",
						roles: ["super_admin"]
					},

					{
						username: "admin",
						fullName: "Administrator",
						mobile: "13800000002",
						password: await this.hashPassword("admin"),
						avatar: "https://user-images.githubusercontent.com/306521/112635269-e7511f00-8e3b-11eb-8a59-df6dda998d05.png",
						roles: ["admin"]
					},

					// Agent user
					{
						username: "agent",
						fullName: "Agent User",
						mobile: "13800000003",
						password: await this.hashPassword("agent"),
						avatar: "https://user-images.githubusercontent.com/306521/112635366-03ed5700-8e3c-11eb-80a3-49804bf7e7c4.png",
						roles: ["agent"]
					}
				],
				{ permissive: true }
			);

			this.logger.info(`成功创建了 ${res.length} 个后台管理账号.`);
		}
	}
};
