const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();

module.exports = {
	name: "AsyncContext",
	// 设置一个异步资源周期的 ctx,一个异步资源有自己的ID
	localAction(handler) {
		return ctx => asyncLocalStorage.run(ctx, () => handler(ctx));
	},

	serviceCreated(svc) {
		// 获取ctx值,确保ctx不会因为异步操作值被错误覆盖
		svc.getContext = () => asyncLocalStorage.getStore();
	}
};
