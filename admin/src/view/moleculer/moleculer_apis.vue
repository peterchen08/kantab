<template>
  <div>
    <Card shadow title="API接口">
      <div class="flex row no-wrap m-y-sm ">
        <input type="text" class="input-size-md flex-grow" placeholder="Search in actions, methods, paths..." v-model="apiSearchText" />
        <button class="m-x-xs button outlined positive" @click="refreshApiPage">
          <i class="fa fa-refresh"></i>
          刷新
        </button>
        <button :class="`button  ${globalAuth.token ? 'positive' : 'outlined negative'}`" @click="showAuthorizeDialog">
          <i :class="`fa fa-${globalAuth.token ? 'lock' : 'unlock'}`"></i>
          Authorize
        </button>
      </div>
      <hr/>
      <div v-for="(section, name) in filteredApis" :key="name">
        <section v-if="section && section.length>0" :id="name">
          <fieldset>
            <legend>
              {{ getService(name).fullName }}
              <span v-if="getService(name).version" class="badge light  m-x-xs">{{ getService(name).version }}</span>
            </legend>
            <div class="content">
              <div :class="`action-card action-method-${item.rest.method.toLocaleLowerCase()} `" v-for="(item,ix) in section" :key="ix">
                <div class="action-card-header" @click="item.expand=!item.expand">
                  <span :class="`badge lg fixed text-center text-code bg-method-${item.rest.method.toLocaleLowerCase()} `"> {{ item.rest.method }}</span>
                  <span class="text-subtitle2 m-x-xs">{{ item.rest.path }}</span>
                  <div class="flex-spacer"></div>
                  <span class="text-caption m-x-xs">{{ item.action }}</span>
                  <span class="badge m-x-xs">{{ item.fields.length }}</span>
                </div>
                <form @submit.prevent.stop="callAction(item,name)">
                  <div :class="{'action-card-section':true,expand:item.expand}">
                    <div class="action-card-section-parameters">
                      <div class="action-card-section-parameters-header">

                        <div class="text-p">Parameters</div>
                        <div class="flex-spacer"></div>
                        <div class="">
                          <button :disabled="item.loading" class="button" type="submit">
                            <i :class="`fa fa-${item.loading ? 'spinner':'rocket'}`"></i>
                            {{item.loading ? 'Trying...' : 'Try'}}
                          </button>
                        </div>
                      </div>
                      <div class="action-card-section-parameters-body">
                        <div v-if="item.fields" class="parameters">
                          <div :class="{field:true,required:field.optional===false}" v-for="(field,ix) in item.fields" :key="field.name">
                            <label :for="field.name+'--'+ix">{{ field.label }}: </label>
                            <input v-if="field.dataType==='number'" :min="field.min" :max="field.max" :type="field.type" :id="field.name+'--'+ix" :name="field.name" v-model.number="field.value" :required="field.required === true || field.optional===false"></input>
                            <input v-else :type="field.type" :maxlength="field.maxLength" :minlength="field.minLength" :id="field.name+'--'+ix" :name="field.name" v-model="field.value" :required="field.required === true || field.optional===false"></input>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="action-card-section-response" v-if="item.status">
                      <div class="action-card-section-response-header">
                        <div class="text-p">Response</div>
                        <span text>
                          <div class="badge m-x-xs" :class="{ green: item.status < 400, red: item.status >= 400 || item.status == 'ERR' }">{{ item.status }}</div>
                          <div class="badge time m-r-xs">{{ humanize(item.duration) }}</div>
                        </span>
                        <div class="flex-spacer"></div>
                        <div>
                          <button v-if="item.response" class="button outlined negative" @click="clearResponse(item)">
                            <i :class="`fa fa-remove`"></i>
                            Clear
                          </button>
                        </div>
                      </div>
                      <div class="action-card-section-response-body">
                        <pre><code>{{ item.response }}</code></pre>
                      </div>

                    </div>
                  </div>
                </form>
              </div>
            </div>
          </fieldset>
        </section>
      </div>
    </Card>

    <div v-if="openAuthorizeDialog">
      <div class="modal-overlay"></div>
      <div class="modal">
        <div class="modal-header">
          <span class="text-title text-bold">Authorization</span>
          <span class="modal-close" @click="openAuthorizeDialog = false"></span>
        </div>
        <div class="modal-content">
          <fieldset>
            <legend>Authorize by username and password</legend>
            <div class="flex column">
              <div class="form-group">
                <label>Username</label>
                <input type="text" v-model="auth.username" class="form-control" placeholder="Username">
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" v-model="auth.password" class="form-control" placeholder="Password">
              </div>
              <div class="form-group">
                <label>Tenant</label>
                <input type="text" v-model="auth.tenant" class="form-control" placeholder="Tenant">
              </div>
              <button class="self-end button outlined positive" @click="authorize">Authorize</button>
            </div>
          </fieldset>

          <div class="form-group">
            <label>Token</label>
            <textarea style="height:100pxwidth: 100%" v-model="auth.token" class="form-control" placeholder="Token"></textarea>
          </div>

        </div>
        <div class="modal-actions">

          <button class="button flat" @click="openAuthorizeDialog = false">取消</button>
          <button class="button flat m-x-xs" @click="resetAuthorization">重置</button>
          <button class="button" @click="saveAuthorize">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
				

<script>
export default {
  name: 'moleculer_configs',
  data() {
    return {
      apiSearchText: "",

      requests: {

      },
      openAuthorizeDialog: false,
      auth: {
        tenant: "",
        username: "",
        password: "",
        token: ""
      },
      globalAuth: {
        tenant: "",
        username: "",
        password: "",
        token: ""
      },
      fields: {

      },

      broker: null,
      nodes: [],
      services: [],
      actions: {},
    };
  },

  computed: {
    filteredApis() {
      const s = this.apiSearchText.toLocaleLowerCase();
      if (!this.apiSearchText) {
        for (const key in this.requests) {
          const item = this.requests[key];
          console.log("-----" + key + "-----");
          console.log(item);
        }
        return this.requests;
      } else {
        const reqs = {};
        for (const key in this.requests) {
          reqs[key] = this.requests[key]
            .filter(r => r.action.toLocaleLowerCase().includes(s) ||
              r.rest.method.toLocaleLowerCase().includes(s) ||
                r.rest.path.toLocaleLowerCase().includes(s) ||
                  r.rest.url.toLocaleLowerCase().includes(s));
        }
        return reqs;
      }
    },
  },

  methods: {
    resetAuthorization() {
      this.auth = {
        tenant: "",
        username: "",
        password: "",
        token: ""
      };
      this.saveAuthorize();
    },

    authorize() {
      fetch("/api/v1/identity/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(this.auth)

      }).then(res => {
        if (res.status == 401) {
          this.openAuthorizeDialog = true;
          alert("Invalid username or password");
        } else if (res.status == 200) {
          res.json().then(data => {
            this.auth.token = res.headers.get("Authorization") || data.token;
            this.auth.tenant = res.headers.get("x-tenant-id") || data.tenant;
            // this.saveAuthorize();
          });
        }
        else {
          alert("Not authorized");
        }
      });
    },

    saveAuthorize() {
      this.globalAuth = { ...this.auth };
      localStorage.setItem("globalAuth", JSON.stringify(this.globalAuth));
      this.openAuthorizeDialog = false;
    },

    refreshApiPage() {
      return this.updateServiceList();
    },

    showAuthorizeDialog() {
      this.openAuthorizeDialog = true;
    },

    closeAuthorizeDialog() {
      this.openAuthorizeDialog = false;
    },

    humanize(ms) {
      return ms > 1500 ? (ms / 1500).toFixed(2) + " s" : ms + " ms";
    },

    getRest(item) {
      if (!item.rest) return item.rest;
      if (typeof item.rest === "object") return item.rest; // REST object
      if (item.rest.indexOf(" ") !== -1) {
        const p = item.rest.split(" ");
        return { method: p[0], path: p[1] };
      } else {
        return { method: "*", path: item.rest };
      }
    },

    getFields(item, method, url) {
      if (!item.params) return [];
      const r = [];
      for (const key in item.params) {
        if (key.startsWith('$')) continue;
        if (item.params[key].readonly === true) continue;
        if (item.params[key].hidden === true) continue;
        const dataType = item.params[key].type || item.params[key];
        const hidden = item.params[key].hidden || false;
        const required = item.params[key].required || false;
        const optional = Array.isArray(item.params[key]) ? item.params[key].every(xx => xx.optional === true) : item.params[key].optional || false;
        const maxLength = item.params[key].max || undefined;
        const minLength = item.params[key].min || undefined;
        const pattern = item.params[key].pattern || undefined;
        let type = "text";
        let value = item.params[key].default || undefined;
        if (dataType.includes("number")) { type = "number"; };
        if (dataType === "boolean") { type = "checkbox"; value = value || false; };
        if (dataType === "string") type = "text";
        if (dataType === "object") type = "textarea";
        if (dataType === "array") type = "textarea";
        if (dataType === "file") type = "file";
        if (dataType === "date") type = "date";
        if (dataType === "datetime") type = "datetime";
        if (dataType === "time") type = "time";
        if (dataType === "password") type = "password";
        if (dataType === "enum") type = "select";
        if (dataType === "enum-multi") type = "select-multi";

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
        });
      }
      return r;
    },

    getService(fullName) {
      const svc = this.services.find(svc => svc.fullName == fullName);
      return svc || {};
    },

    clearResponse(item) {
      item.response = undefined;
      item.duration = undefined;
      item.loading = false;
      item.status = undefined;
    },

    callAction: function(item, fullName) {
      if (!item.rest) return;
      item.loading = true;
      const service = this.services.find(svc => svc.name == fullName);
      var startTime = Date.now();

      const method = item.rest.method || "GET";
      let url = item.rest.url;
      let fields = item.fields;
      let body = null;
      let params = null;
      if (fields) {
        body = {};
        params = {};
        fields.forEach(field => {
          const value = field.value;
          if (field.paramType == "body") {
            body[field.name] = value;
            if (value === undefined && field.optional === true) {
              delete body[field.name];
            }
          }
          else if (field.paramType == "param") {

            params[field.name] = value;
            if (value === undefined && field.optional === true) {
              delete params[field.name];
            }
          }

          else if (field.paramType == "url") {
            if (value === undefined && field.optional === true) {
              url = url.replace(`:${field.name}`, '');
            }
            else {
              url = url.replace(`:${field.name}`, value);
            }
          }
          url = url.replace(`:${field.name}`, value);
        });

        if (body && method == "GET") {
          body = null;
        }
        if (params && Object.keys(params).length > 0) {
          const qparams = {};
          for (const key in params) {
            if (params[key] !== undefined) {
              qparams[key] = params[key];
            }
          }
          url += "?" + new URLSearchParams(qparams).toString();
        }

      }
      const authtoken = this.globalAuth.token;
      const tenant = this.globalAuth.tenant;
      const authHeader = {};
      if (authtoken) {
        authHeader['Authorization'] = `Bearer ${authtoken}`;
      }
      if (tenant) {
        authHeader["x-tenant"] = tenant;
      }
      return fetch(url, {
        method,
        body: body ? JSON.stringify(body) : null,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        }
      }).then(function(res) {
        item.status = res.status;
        item.duration = Date.now() - startTime;
        return res.json().then(json => {
          item.response = json;
          item.loading = false;
          if (item.afterResponse)
            return item.afterResponse(json);
        });
      }).catch(function(err) {
        item.status = "ERR";
        item.duration = Date.now() - startTime;
        item.response = err.message;
        item.loading = false;
        console.log(err);
      });

    },

    updateServiceList: function(name) {
      this.req("/metric/node/services?withActions=true", null)
        .then(res => {
          //动态添加响应式属性
          this.services = Object.assign([],res);

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
          //动态添加响应式属性
          this.actions = Object.assign({},actions);
          const requests = {};
          for (const service of this.services) {
            requests[service.fullName] = [];
            const version = service.version ? "v" + service.version + "/" : "";
            for (const key in service.actions) {
              const action = service.actions[key];
              if (!action.rest) continue;
              const req = {
                expand: false,
                loading: false,
                id: action.name,
                action: action.name,
                rest: this.getRest(action),
                fields: action.fields,
                response: null,
                status: null,
                duration: null,
                afterResponse: action.afterResponse
              };
              const baseUrl = service.settings.rest;
              if (req.rest.method === '*') {
                ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(method => {
                  const req2 = Object.assign({}, req);
                  req2.id = req2.id + '.' + method.toLocaleLowerCase();
                  req2.rest = Object.assign({}, req.rest);
                  req2.rest.method = method;
                  const url = baseUrl ? `/api${baseUrl}${req2.rest.path}` : `/api/${version}${service.name}${req2.rest.path}`;
                  req2.rest.url = url;
                  req2.fields = this.getFields(action, req2.rest.method, req2.rest.url);
                  requests[service.fullName].push(req2);
                });
              } else {
                let version = service.version ? "v" + service.version + "/" : "";
                let url = baseUrl ? `/api${baseUrl}${req.rest.path}` : `/api/${version}${service.name}${req.rest.path}`;
                req.rest.url = url;
                req.fields = this.getFields(action, req.rest.method, req.rest.url);
                requests[service.fullName].push(req);
              }

            }
            if (requests[service.fullName].length === 0) delete requests[service.fullName];
          }
          //动态添加响应式属性
          this.requests = Object.assign({},requests);
        });
    },

    req: function(url, params) {
      return fetch(url, { method: "GET", body: params ? JSON.stringify(params) : null })
        .then(function(res) {
          return res.json()
        })
        .then(json=>{
          let data = json.data;
          let list = [];
          for (const key in data) {
            list.push(data[key]);
          }
          return list;
        })
    }
  },

  mounted() {
    var self = this;

    this.refreshApiPage();

    const globalAuth = localStorage.getItem("globalAuth");
    this.globalAuth = globalAuth ? JSON.parse(globalAuth) : {};

  }
}
</script>

<style lang="css">
@import './main.css';
</style>
