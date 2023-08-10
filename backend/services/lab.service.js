const Laboratory = require("@moleculer/lab");

/**
 * 官方监测面板
 * token和apikey需要到官网申请
 * 详情:https://medium.com/moleculer/moleculers-laboratory-b3262cc3b39e
 * 申请地址:https://docs.google.com/forms/d/e/1FAIpQLSdqRh7zTKDxm-0JvJoPlc7N3u2Buiet8Hpe7xqHPC_O_ifIIA/viewform?fbzx=-3878820790936324826
 */
module.exports = {
    mixins: [Laboratory.AgentService],
    settings: {
        token: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        apiKey: "XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX"
    }
};