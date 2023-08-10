"use strict";

const _ = require("lodash");
const crypto = require("crypto");
const path = require("path");
const mkdir = require("mkdirp").sync;
const DbService = require("@moleculer/database").Service;
const HashIds = require("hashids/cjs");
const ObjectID = require("mongodb").ObjectID;


module.exports = function (opts = {}) {
	/**
	 * 打开注释,可生成一串随机的字符串
	 * process.env.HASHID_SALT = crypto.randomBytes(32).toString("hex");
	 * console.log("HASHID_SALT:"+process.env.HASHID_SALT)
	 */
	

	const hashids = new HashIds(process.env.HASHID_SALT);

	opts = _.defaultsDeep(opts, {
		adapter: {
			type: "MongoDB",
			options: {
				uri: process.env.MONGO_URI || "mongodb://localhost:27017/atuan",
				collection: opts.collection
			}
		}
	});

	const schema = {
		mixins: [DbService(opts)],

		/**
		 * 对filed字段设置了secure: true,会调用encodeID、decodeID进行id的哈希加密解密
		 * @param {*} id 
		 */
		encodeID(id) {
			if (ObjectID.isValid(id)) id = id.toString();
			return hashids.encodeHex(id);
		},

		decodeID(id) {
			return hashids.decodeHex(id);
		},

		created() {
			if (!process.env.HASHID_SALT) {
				this.broker.fatal("环境变量 'HASHID_SALT' 必须被设置!需要该值对ID进行哈希加密");
			}
		},

		async started() {
			/* istanbul ignore next */
			try {
				// Create indexes
				await this.createIndexes();
			} catch (err) {
				this.logger.error("无法创建索引.", err);
			}
			// 打开注释,可清空测试数据
			// await this.clearEntities();

			// 填充初始数据
			const count = await this.countEntities(null, {});
			if (count == 0 && _.isFunction(this.seedDB)) {
				this.logger.info(`Seed '${opts.collection}' collection...`);
				await this.seedDB();
			}
		}
	};

	return schema;
};
