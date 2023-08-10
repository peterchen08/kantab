<template>
  <div v-if="broker">
    <Card shadow title="moleculer配置">
      <row class="page" :gutter="32">
        <i-col span="10">
        </i-col>
      </row>
      <row class="page" :gutter="32">
        <div class="boxes">
          <div class="box">
            <div class="caption">Namespace</div>
            <div class="value">{{ broker.namespace || "&lt;not set&gt;" }}</div>
          </div>

          <div class="box">
            <div class="caption">Transporter</div>
            <div class="value">{{ broker.transporter || "&lt;no transporter&gt;" }}</div>
          </div>

          <div class="box">
            <div class="caption">Serializer</div>
            <div class="value">{{ broker.serializer || "JSON" }}</div>
          </div>

          <div class="box">
            <div class="caption">Strategy</div>
            <div class="value">{{ broker.registry.strategy || "Round Robin" }}</div>
          </div>

        </div>
      </row>

      <row class="page" :gutter="32">
        <div class="boxes">
          <div class="box">
            <div class="caption">Cacher</div>
            <div class="value">{{ broker.cacher ? "Enabled" : "Disabled" }}</div>
          </div>

          <div class="box">
            <div class="caption">Logger</div>
            <div class="value">{{ broker.logger ? "Enabled" : "Disabled" }}</div>
          </div>

          <div class="box">
            <div class="caption">Metrics</div>
            <div class="value">{{ broker.metrics.enabled ? "Enabled" : "Disabled" }}</div>
          </div>

          <div class="box">
            <div class="caption">Tracing</div>
            <div class="value">{{ broker.tracing.enabled ? "Enabled" : "Disabled" }}</div>
          </div>
        </div>
      </row>
    </Card>

    <Card shadow title="">
      <row class="page" :gutter="32">
        <i-col span="10">
        </i-col>
      </row>
      <div class="boxes">
        <h3 class="cursor-pointer" @click="showBrokerOptions = !showBrokerOptions">{{showBrokerOptions?'隐藏Broker options':'显示Broker options'}}
          <i :class="'fa fa-angle-' + (showBrokerOptions ? 'up' : 'down')"></i>
        </h3>
      </div>
      <pre v-if="showBrokerOptions" class="broker-options"><code>{{ broker }}</code></pre>
    </Card>
  </div>
</template>
				

<script>
export default {
  name: 'moleculer_configs',
  data() {
    return {
      broker: null,
      showBrokerOptions: false
    };
  },

  methods: {
    req: function(url, params) {
      return fetch(url, { method: "GET", body: params ? JSON.stringify(params) : null })
        .then(function(res) {
          return res.json()
        })
    },

    updateBrokerOptions: function(name) {
      this.req("/metric/node/options", null)
      .then(res => {
        console.log(res);
        this.broker = res
      });
    }
  },

  mounted() {
    this.updateBrokerOptions();
  }
}
</script>

<style lang="css">
@import './main.css';
</style>
