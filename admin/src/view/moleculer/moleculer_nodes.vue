<template v-if="broker">
  <table>
    <thead>
      <th>Node ID</th>
      <th>Type</th>
      <th>Version</th>
      <th>IP</th>
      <th>Hostname</th>
      <th>Status</th>
      <th>CPU</th>
    </thead>
    <tbody>
      <tr v-for="node in nodes" :class="{ offline: !node.available, local: node.local }" :key="node.id">
        <td>{{ node.id }}</td>
        <td>{{ node.client.type }}</td>
        <td>{{ node.client.version }}</td>
        <td>{{ node.ipList[0] }}</td>
        <td>{{ node.hostname }}</td>

        <td>
          <div class="badge" :class="{ green: node.available, red: !node.available }">{{ node.available ? "Online": "Offline" }}</div>
        </td>
        <td>
          <div class="bar" :style="{ width: node.cpu != null ? node.cpu + '%' : '0' }"></div>
          {{ node.cpu != null ? Number(node.cpu).toFixed(0) + '%' : '-' }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
				

<script>
export default {
  name: 'moleculer_nodes',
  data() {
    return {
      broker: null,
      nodes: [],
    };
  },

  methods: {
    req: function(url, params) {
      return fetch(url, { method: "GET", body: params ? JSON.stringify(params) : null })
        .then(function(res) {
          return res.json()
        })
        .then(json=>{
          console.log(json);
          let data = json;
          let list = [];
          for (const key in data) {
            list.push(data[key]);
          }
          return list;
        })
    },

    updateNodeList: function(name) {
      this.req("/metric/node/list", null).then(res => {
        res.sort((a, b) => a.id.localeCompare(b.id));
        this.nodes = res;
      });
    },

  },

  mounted() {
    var self = this;
    setInterval(function() {
      self.updateNodeList();
    }, 2000);
    this.updateNodeList();
  }
}
</script>

<style lang="css">
@import './main.css';
</style>
