<template>
  <table>
    <thead>
      <th>Service/Action name</th>
      <th>REST</th>
      <th>Parameters</th>
      <th>Instances</th>
      <th>Status</th>
    </thead>
    <tbody v-for="svc in filteredServices" :key="svc.name">
      <tr class="service">
        <td>
          {{ svc.name }}
          <div v-if="svc.version" class="badge">{{ svc.version }}</div>
        </td>
        <td>{{ svc.settings.rest ? svc.settings.rest : svc.fullName }}</td>
        <td></td>
        <td class="badges">
          <div class="badge" v-for="(nodeID) in svc.nodes" :key="nodeID">
            {{ nodeID }}
          </div>
        </td>
        <td>
          <div v-if="svc.nodes.length > 0" class="badge green">Online</div>
          <div v-else class="badge red">Offline</div>
        </td>
      </tr>
      <tr v-for="(action) in getServiceActions(svc)" :key="action.name" :class="{ action: true, offline: !action.available, local: action.hasLocal }">
        <td>
          {{ action.name }}
          <div v-if="action.action.cache" class="badge orange">cached</div>
        </td>
        <td v-html="getActionREST(svc, action)"></td>
        <td :title="getActionParams(action)">
          {{ getActionParams(action, 40) }}
        </td>
        <td></td>
        <td>
          <div v-if="action.available" class="badge green">Online</div>
          <div v-else class="badge red">Offline</div>
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
      services: [],
      actions: {},
    };
  },

  methods: {
    req: function(url, params) {
      return fetch(url, { method: "GET", body: params ? JSON.stringify(params) : null })
        .then(function(res) {
          return res.json()
        })
        .then(json=>{
          let data = json;
          let list = [];
          for (const key in data) {
            list.push(data[key]);
          }
          return list;
        })
    },

    getServiceActions(svc) {
      return Object.keys(svc.actions)
        .map(name => this.actions[name])
        .filter(action => !!action)
    },

    getActionParams(action, maxLen) {
      if (action.action && action.action.params) {
        const s = Object.keys(action.action.params).join(", ")
        return s.length > maxLen ? s.substr(0, maxLen) + "…" : s
      }
      return "-"
    },

    getActionREST(svc, action) {
      if (action.action.rest) {
        let prefix = svc.fullName || svc.name
        if (typeof (svc.settings.rest) == "string")
          prefix = svc.settings.rest

        if (typeof action.action.rest == "string") {
          if (action.action.rest.indexOf(" ") !== -1) {
            const p = action.action.rest.split(" ")
            return "<span class='badge'>" + p[0] + "</span> " + prefix + p[1]
          } else {
            return "<span class='badge'>*</span> " + prefix + action.action.rest
          }
        } else {
          return "<span class='badge'>" + (action.action.rest.method || "*") + "</span> " + prefix + action.action.rest.path
        }
      }
      return ""
    },

    getRest(item) {
      if (!item.rest) return item.rest
      if (typeof item.rest === "object") return item.rest // REST object
      if (item.rest.indexOf(" ") !== -1) {
        const p = item.rest.split(" ")
        return { method: p[0], path: p[1] }
      } else {
        return { method: "*", path: item.rest }
      }
    },

    getFields(item, method, url) {
      if (!item.params) return []
      const r = []
      for (const key in item.params) {
        if (key.startsWith('$')) continue
        if (item.params[key].readonly === true) continue
        if (item.params[key].hidden === true) continue
        const dataType = item.params[key].type || item.params[key]
        const hidden = item.params[key].hidden || false
        const required = item.params[key].required || false
        const optional = Array.isArray(item.params[key]) ? item.params[key].every(xx => xx.optional === true) : item.params[key].optional || false
        const maxLength = item.params[key].max || undefined
        const minLength = item.params[key].min || undefined
        const pattern = item.params[key].pattern || undefined
        let type = "text"
        let value = item.params[key].default || undefined
        if (dataType.includes("number")) { type = "number" }
        if (dataType === "boolean") {
          type = "checkbox";
          value = value || false
        }
        if (dataType === "string") type = "text"
        if (dataType === "object") type = "textarea"
        if (dataType === "array") type = "textarea"
        if (dataType === "file") type = "file"
        if (dataType === "date") type = "date"
        if (dataType === "datetime") type = "datetime"
        if (dataType === "time") type = "time"
        if (dataType === "password") type = "password"
        if (dataType === "enum") type = "select"
        if (dataType === "enum-multi") type = "select-multi"

        r.push({
          name: key,
          label: key, optional,
          hidden, required,
          [type === 'number' ? 'min' : 'minLength']: minLength,
          [type === 'number' ? 'max' : 'maxLength']: maxLength,
          pattern,
          paramType: method === 'GET' ? 'param' : 'body',
          value,
          type, dataType, value: undefined
        })
      }
      return r
    },

    updateServiceList: function(name) {
      this.req("/metric/node/services?withActions=true", null)
        .then(res => {
          this.services = res;
          res.sort((a, b) => a.name.localeCompare(b.name));
          res.forEach(svc => svc.nodes.sort());
        })
        .then(() => this.req("/metric/node/actions", null))
        .then(res => {
          res.sort((a, b) => a.name.localeCompare(b.name));
          const actions = res.reduce((a, b) => {
            a[b.name] = b;
            return a;
          }, {});
          this.actions = actions;
          
        });
    }

  },

  computed: {
    filteredServices() {
      return this.services.filter(svc => !svc.name.startsWith("$"))
    }
  },

  mounted() {
    var self = this;
    setInterval(function() {
      self.updateServiceList();
    }, 2000);
    this.updateServiceList();
  }
}
</script>

<style lang="css">
@import './main.css';
</style>
