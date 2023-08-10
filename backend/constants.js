"use strict";

const C = {
	STATUS_ACTIVE: 1,
	STATUS_INACTIVE: 0,
	STATUS_DELETED: -1,

	DEFAULT_AVATAR:"https://user-images.githubusercontent.com/306521/112635269-e7511f00-8e3b-11eb-8a59-df6dda998d05.png",

	ROLE_SUPER_ADMIN: "super_admin",//超级管理员
	ROLE_ADMIN: "admin",//普通管理员
	ROLE_AGENT: "agent",//渠道代理
	ROLE_SUB_AGENT: "sub_agent",//二级代理
	ROLE_GUEST: "guest",//访客
	ROLE_AUTHENTICATED:"authenticated",//通过验证的用户
	ROLE_USER: "user",//注册用户
	ROLE_MANAGER: "manager",//平台管理员
	ROLE_MASTER: "master",//导师
	ROLE_SYSTEM: "system",//系统

	VISIBILITY_PRIVATE: "private",
	VISIBILITY_PROTECTED: "protected",
	VISIBILITY_PUBLIC: "public",
	VISIBILITY_PUBLISHED: "published",

	TOKEN_TYPE_ADMIN_VERIFICATION: "admin-verification",//后台用户名密码登陆
	TOKEN_TYPE_ACCOUNT_VERIFICATION: "account-verification",//本机号码一键登陆验证
};

module.exports = {
	...C,

	TOKEN_TYPES: [
		C.TOKEN_TYPE_ADMIN_VERIFICATION,
		C.TOKEN_TYPE_ACCOUNT_VERIFICATION
	],

	ROLE_TYPES: [
		C.ROLE_SUPER_ADMIN,
		C.ROLE_ADMIN,
		C.ROLE_AGENT,
		C.ROLE_SUB_AGENT,
		C.ROLE_GUEST
	],

	DEFAULT_LABELS: [
		{ id: 1, name: "Low priority", color: "#fad900" },
		{ id: 2, name: "Medium priority", color: "#ff9f19" },
		{ id: 3, name: "High priority", color: "#eb4646" }
	],

	TIMESTAMP_FIELDS: {
		createdAt: {
			type: "number",
            readonly: true,
			required:false,
			graphql: { type: "Long" },
			onCreate: () => Date.now()
		},
		updatedAt: {
			type: "number",
			readonly: true,
            required:false,
			graphql: { type: "Long" },
			onUpdate: () => Date.now()
		},
		deletedAt: {
			type: "number",
			readonly: true,
            required:false,
			graphql: { type: "Long" },
			hidden: "byDefault",
			onRemove: () => Date.now()
		}
	},

	ARCHIVED_FIELDS: {
		archived: { type: "boolean", readonly: true, default: false },
		archivedAt: { type: "number", readonly: true, graphql: { type: "Long" } }
	}
};
