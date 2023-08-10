const Laboratory = require("@moleculer/lab");

/**
 * 官方监测面板
 * apikey需要到官网申请
 */
module.exports = {
    mixins: [Laboratory.AgentService],
    settings: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        apiKey: "54MP2N9-W2Z4M42-ME3DBW3-0GWQ0W8"
    }
};