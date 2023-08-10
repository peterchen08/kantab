var Y=Object.defineProperty,J=Object.defineProperties;var X=Object.getOwnPropertyDescriptors;var U=Object.getOwnPropertySymbols;var Z=Object.prototype.hasOwnProperty,ee=Object.prototype.propertyIsEnumerable;var j=(e,t,o)=>t in e?Y(e,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[t]=o,w=(e,t)=>{for(var o in t||(t={}))Z.call(t,o)&&j(e,o,t[o]);if(U)for(var o of U(t))ee.call(t,o)&&j(e,o,t[o]);return e},R=(e,t)=>J(e,X(t));import{d as k,l as te,i as A,B as oe,a as se,b as re,m as ae,c as P,e as c,f as E,g as F,h as ie,j as ne,r as de,o as u,k as m,n as S,w as C,p as $,T as M,q as le,s as d,t as h,u as I,v as z,x as B,y as K,z as V,A as H,C as ce,D as ue,E as pe,F as N,G as me,H as he,I as G,J as ge,K as fe,L as be,M as ve,N as _e,O as ye,P as we,Q as $e,R as ke}from"./vendor.bd38f07c.js";const qe=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function o(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerpolicy&&(r.referrerPolicy=s.referrerpolicy),s.crossorigin==="use-credentials"?r.credentials="include":s.crossorigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(s){if(s.ep)return;s.ep=!0;const r=o(s);fetch(s.href,r)}};qe();k.extend(te);function Ae(){return Se().then(e=>t=>{t.config.globalProperties.$i18n=A,t.config.globalProperties.$lang=A.language,t.config.globalProperties.$t=e,t.directive("i18n",{bind:function(o,a){o.innerHTML=A.t(a.expression)}}),k.locale(A.language),console.log(`I18Next initialized! Language: ${A.language}, Date format: ${k().format("LLLL")}`)}).catch(e=>(console.error("Unable to initialize I18Next",e),e))}async function Se(){return A.use(oe).use(se).init({fallbackLng:"en",whitelist:["en","hu"],ns:["common","errors"],defaultNS:"common",load:"languageOnly",saveMissing:!0,saveMissingTo:"all",backend:{backend:re,backendOption:{loadPath:"/locales?lng={{lng}}&ns={{ns}}",addPath:"/locales?lng={{lng}}&ns={{ns}}"}},detection:{order:["cookie","navigator"]}})}const T=ae(),O={on:(...e)=>T.on(...e),once:(...e)=>T.once(...e),off:(...e)=>T.off(...e),emit:(...e)=>T.emit(...e),install:e=>{e.config.globalProperties.$bus=O,e.mixin({beforeMount(){const t=this.$options.events;if(t)for(const o in t){const a=t[o].bind(this);t[o]._binded=a,O.on(o,a)}},beforeUnmount(){const t=this.$options.events;if(t)for(const o in t)t[o]._binded&&O.off(o,t[o]._binded)}})}},Ce="modulepreload",Q={},Be="/",f=function(t,o){return!o||o.length===0?t():Promise.all(o.map(a=>{if(a=`${Be}${a}`,a in Q)return;Q[a]=!0;const s=a.endsWith(".css"),r=s?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${a}"]${r}`))return;const i=document.createElement("link");if(i.rel=s?"stylesheet":Ce,s||(i.as="script",i.crossOrigin=""),i.href=a,document.head.appendChild(i),s)return new Promise((n,v)=>{i.addEventListener("load",n),i.addEventListener("error",v)})})).then(()=>t())},Le="jwt-token",Pe="/graphql",x=P.get(Le),l=new c.GraphQLClient(Pe);l.setHeader("authorization",x?`Bearer ${x}`:null);l.setHeaders({authorization:x?`Bearer ${x}`:null,anotherheader:"header_value"});E.settings({theme:"light",position:"bottomRight",animateInside:!1,transitionIn:"fadeInUp"});function b(e){E.info({title:e})}function _(e){E.error({title:e})}const q=F({id:"mainStore",state:()=>({board:null,boards:[]}),getters:{isPublicBoard:e=>{var t;return!!((t=e.board)==null?void 0:t.public)},userIsOwner:e=>{var t;return y().user&&e.board&&((t=e.board.owner)==null?void 0:t.id)==y().user.id},userIsMember:e=>y().user&&e.board&&e.board.members.find(t=>t.id==y().user.id)},actions:{async init(){await y().protectRouter();try{await y().getSupportedSocialAuthProviders(),await y().getMe(),await this.getBoards()}catch(e){console.log("Error",e)}},async selectBoardById(e){try{const t=c.gql`
					query boardById($id: String!) {
						boardById(id: $id) {
							id
							title
							slug
							description
							public
							archived
							createdAt
							updatedAt
							owner {
								id
								username
								fullName
								avatar
							}
							lists(page: 1, pageSize: 10, sort: "position") {
								rows {
									id
									title
									description
									position
									color
									createdAt
									updatedAt
									cards(page: 1, pageSize: 20, sort: "position") {
										rows {
											id
											title
											description
											color
											position
										}
										total
									}
								}
								total
							}
							members {
								id
								username
								fullName
								avatar
							}
						}
					}
				`,o={id:e},a=await l.request(t,o);return this.board=a.boardById,a.boardById}catch(t){console.log("selectBoardById error",t),b("Could not load board: "+t.message)}},async getBoards(){try{const e=c.gql`
					query boards {
						boards(page: 1, pageSize: 10, sort: "title") {
							rows {
								id
								title
								slug
								description
								public
								archived
								createdAt
								updatedAt
								owner {
									username
									fullName
									avatar
								}
							}
						}
					}
				`,t=await l.request(e);return this.boards=t.boards.rows,t.boards.rows}catch(e){console.log("getBoard error",e),b("Could not load boards: "+e.message)}},async createBoard(e){try{const t=c.gql`
					mutation boardCreate($input: BoardCreateInput!) {
						boardCreate(input: $input) {
							id
							title
							slug
							description
							public
							archived
							createdAt
							updatedAt
							owner {
								username
								fullName
								avatar
							}
						}
					}
				`,o={input:e},s=(await l.request(t,o)).boardCreate;this.boards=[...this.boards,s],b(`Board '${s.title}' created`)}catch(t){console.error("createBoard err",t),_("Could not create board: "+t.message)}},async updateBoard(e){var t;try{const o=c.gql`
					mutation boardUpdate($input: BoardUpdateInput!) {
						boardUpdate(input: $input) {
							id
							title
							slug
							description
							public
							archived
							createdAt
							updatedAt
							owner {
								username
								fullName
								avatar
							}
						}
					}
				`,a={input:e},r=(await l.request(o,a)).boardUpdate,i=this.boards.find(n=>n.id==r.id);i?Object.assign(i,r):this.boards=[...this.boards,r],((t=this.board)==null?void 0:t.id)==r.id&&Object.assign(this.board,r),b(`Board '${r.title}' updated`)}catch(o){console.error("updateBoard error: ",o),_("Could not update board: "+o.message)}},async removeBoard(e){try{const t=c.gql`
					mutation boardRemove($id: String!) {
						boardRemove(id: $id)
					}
				`,o={id:e},a=await l.request(t,o);this.boards=this.boards.filter(s=>s.id!==a.boardRemove),b("Board removed")}catch(t){console.error("removeBoard error: ",t),_("Board creation failed: "+t.message)}},async createList(e){try{const t=c.gql`
					mutation listCreate($input: ListCreateInput!) {
						listCreate(input: $input) {
							id
							title
							description
							position
							cards(page: 1, pageSize: 20, sort: "position") {
								rows {
									id
									title
									description
									position
								}
								total
							}
						}
					}
				`,o={input:e},a=await l.request(t,o);this.board.lists.rows=[...this.board.lists.rows,a.listCreate],b("List created")}catch(t){console.error("createList err",t),_("Could not create list: "+t.message)}},async updateList(e){try{const t=c.gql`
					mutation listUpdate($input: ListUpdateInput!) {
						listUpdate(input: $input) {
							id
							title
							description
							position
							cards(page: 1, pageSize: 20, sort: "position") {
								rows {
									id
									title
									description
									position
								}
								total
							}
						}
					}
				`,o={input:e},a=await l.request(t,o),s=this.board.lists.rows.find(r=>r.id==a.listUpdate.id);s?Object.assign(s,a.listUpdate):this.board.lists.rows.push(a.listUpdate),b("List updated")}catch(t){console.error("updateList error: ",t),_("Could not update list: "+t.message)}},async removeList({id:e}){console.log("id",e);try{const t=c.gql`
					mutation listRemove($id: String!) {
						listRemove(id: $id)
					}
				`,o={id:e},a=await l.request(t,o);this.board.lists.rows=this.board.lists.rows.filter(s=>s.id!==a.listRemove),b("List removed")}catch(t){console.error("removeList error: ",t),_("Could not remove list: "+t.message)}},async createCard({list:e,input:t}){try{const o=c.gql`
					mutation cardCreate($input: CardCreateInput!) {
						cardCreate(input: $input) {
							id
							title
							description
							position
							color
						}
					}
				`,a={input:t},r=(await l.request(o,a)).cardCreate;let i=null;for(let n=0;n<e.cards.rows.length;n++)if(e.cards.rows[n].position>r.position){i=n;break}i===null?e.cards.rows.push(r):e.cards.rows.splice(i,0,r),b(`Card '${r.title}' created`)}catch(o){console.error("createCard err",o),_("Could not create card: "+o.message)}},async updateCard({list:e,input:t}){try{const o=c.gql`
					mutation cardUpdate($input: CardUpdateInput!) {
						cardUpdate(input: $input) {
							id
							title
							description
							position
							color
						}
					}
				`,a={input:t},r=(await l.request(o,a)).cardUpdate,i=e.cards.rows.find(n=>n.id==r.id);i?Object.assign(i,r):e.cards.rows.push(r),b(`Card '${r.title}' updated`)}catch(o){console.error("updateCard error: ",o),_("Could not update card: "+o.message)}},async removeCard({list:e,id:t}){try{const o=c.gql`
					mutation cardRemove($id: String!) {
						cardRemove(id: $id)
					}
				`,a={id:t};await l.request(o,a);const s=e.cards.rows.findIndex(r=>r.id===t);s>=0&&e.cards.rows.splice(s,1),b("Card removed")}catch(o){console.error("removeCard error: ",o),_("Could not remove card: "+o.message)}},async changeListPosition({fromIndex:e,toIndex:t}){const a=[...this.board.lists.rows];let s;e!==null&&(s=a.splice(e,1)[0]),t!==null&&a.splice(t,0,s);let r=0;const i=a[t-1],n=a[t+1];n?i?r=(n.position+i.position)/2:r=Math.floor(n.position-1):r=Math.ceil(i.position+1),console.debug(`Move ${s.title} to ${r}. Between ${n==null?void 0:n.position} <-> ${i==null?void 0:i.position}`),s.position=r,this.board.lists.rows=a,this.updateList({id:s.id,position:r})},async changeCardPosition({list:e,fromIndex:t,toIndex:o,card:a}){const s=[...e.cards.rows];if(t!==null&&s.splice(t,1),o!==null){s.splice(o,0,a);let r=0;const i=s[o-1],n=s[o+1];!n&&!i?r=1:n?i?r=(n.position+i.position)/2:r=Math.floor(n.position-1):r=Math.ceil(i.position+1),console.debug(`Move ${a.title} to ${r}. Between ${n==null?void 0:n.position} <-> ${i==null?void 0:i.position}`),a.position=r,e.cards.rows=s,this.updateCard({list:e,input:{id:a.id,list:e.id,position:r}})}else e.cards.rows=s}}}),D="jwt-token",Ee=90,y=F({id:"authStore",state:()=>({user:null,providers:[]}),getters:{},actions:{async getMe(){try{const e=c.gql`
					query {
						me {
							id
							username
							fullName
							avatar
							verified
							passwordless
							totp {
								enabled
							}
							socialLinks {
								github
								google
								facebook
							}
						}
					}
				`,t=await l.request(e);return this.user=t.me,t.me}catch(e){console.log("Unable to get current user",e)}return null},async register(e){var s,r,i;const t=c.gql`
				mutation register(
					$username: String!
					$fullName: String!
					$email: String!
					$password: String
				) {
					register(
						username: $username
						fullName: $fullName
						email: $email
						password: $password
					) {
						id
						username
						fullName
						avatar
						verified
						passwordless
					}
				}
			`,o=R(w({},e),{password:e.password||null}),a=await l.request(t,o);if(a.register.verified){const n=await this.applyToken(a.login.token),v=(i=(r=(s=p==null?void 0:p.currentRoute)==null?void 0:s.value)==null?void 0:r.query)==null?void 0:i.redirect;return p.push(v||{name:"home"}),n}return null},async login({email:e,password:t,token:o}){var i,n,v;const a=c.gql`
				mutation login($email: String!, $password: String, $token: String) {
					login(email: $email, password: $password, token: $token) {
						token
						passwordless
						email
					}
				}
			`,s={email:e,password:t,token:o},r=await l.request(a,s);if(r.login.token){console.log("data login token",r.login.token),await this.applyToken(r.login.token),await q().getBoards();const g=(v=(n=(i=p==null?void 0:p.currentRoute)==null?void 0:i.value)==null?void 0:n.query)==null?void 0:v.redirect;p.push(g||{name:"home"})}return r.login},async applyToken(e){return P.set(D,e,{expires:Ee}),await this.getMe()},async passwordless({token:e}){var s,r,i;const t=c.gql`
				mutation passwordlessLogin($token: String!) {
					passwordlessLogin(token: $token) {
						token
					}
				}
			`,o={token:e},a=await l.request(t,o);if(a.passwordlessLogin.token){await this.applyToken(a.passwordlessLogin.token),await q().getBoards();const n=(i=(r=(s=p==null?void 0:p.currentRoute)==null?void 0:s.value)==null?void 0:r.query)==null?void 0:i.redirect;p.push(n||{name:"home"})}return a.passwordlessLogin},async logout(e){this.user=null,P.remove(D),p.push({name:"login"})},async forgotPassword({email:e}){const t=c.gql`
				mutation forgotPassword($email: String!) {
					forgotPassword(email: $email)
				}
			`,o={email:e};await l.request(t,o)},async resetPassword({token:e,password:t}){const o=c.gql`
				mutation resetPassword($token: String!, $password: String!) {
					resetPassword(token: $token, password: $password) {
						token
					}
				}
			`,a={token:e,password:t},s=await l.request(o,a);if(s.resetPassword.token){const r=await this.applyToken(s.resetPassword.token);return await q().getBoards(),p.push({name:"home"}),r}},async verifyAccount({token:e}){const t=c.gql`
				mutation accountVerify($token: String!) {
					accountVerify(token: $token) {
						token
					}
				}
			`,o={token:e},a=await l.request(t,o);if(a.accountVerify.token){const s=await this.applyToken(a.accountVerify.token);return await q().getBoards(),p.push({name:"home"}),s}},async finalize2FA({token:e}){const t=c.gql`
				mutation accountFinalize2FA($token: String) {
					accountFinalize2FA(token: $token)
				}
			`,o={token:e};return await l.request(t,o)},async disable2FA({token:e}){const t=c.gql`
				mutation accountDisable2FA($token: String!) {
					accountDisable2FA(token: $token)
				}
			`,o={token:e};return await l.request(t,o)},async getSupportedSocialAuthProviders(){try{const e=c.gql`
					query supportedSocialAuthProviders {
						supportedSocialAuthProviders
					}
				`,t=await l.request(e);return this.providers=t.supportedSocialAuthProviders,t.supportedSocialAuthProviders}catch(e){console.log("cant get auth",e)}return null},async unlinkSocial({id:e,provider:t}){var o,a,s;try{const r=c.gql`
					mutation accountUnlink($id: String, $provider: String!) {
						accountUnlink(id: $id, provider: $provider) {
							id
							username
							fullName
							avatar
							verified
							passwordless
							totp {
								enabled
							}
							socialLinks {
								github
								google
								facebook
							}
						}
					}
				`,i={id:e,provider:t},n=await l.request(r,i);return this.user=n.accountUnlink,console.log("unlinkSocial: ",n.accountUnlink),null}catch(r){console.log("unlinkSocial",(s=(a=(o=r==null?void 0:r.response)==null?void 0:o.errors)==null?void 0:a[0])==null?void 0:s.message)}},protectRouter(){p.beforeEach(async(e,t,o)=>{t.name||P.get(D)&&await this.getMe(),e.matched.some(a=>a.meta.requiresAuth)?this.user?o():o({name:"login",query:{redirect:e.fullPath}}):e.matched.some(a=>a.meta.redirectAuth)&&this.user?o({name:e.meta.redirectAuth,query:e.query}):o()}),p.beforeEach(async(e,t,o)=>{e.matched.every(s=>ie.exports.isFunction(s.meta.authorize)?!!s.meta.authorize(e):!0)?o():o(!1)})},async enable2FA(){const e=c.gql`
				mutation accountEnable2FA {
					accountEnable2FA {
						secret
						otpauthURL
					}
				}
			`;return(await l.request(e)).accountEnable2FA}}});k.extend(ne);k.extend(de);var Ie={methods:{dateToAgo(e){return k(e).fromNow()},dateToLong(e){return k(e).format("LLL")}}},L=(e,t)=>{const o=e.__vccOpts||e;for(const[a,s]of t)o[a]=s;return o};const Te={props:{title:{type:String,default:"Dialog"},modelValue:{type:Boolean,default:!1}},emits:["update:modelValue"],methods:{close(){this.$emit("update:modelValue",!1)}}},Oe={key:0,class:"fixed top-0 right-0 bottom-0 left-0 bg-black bg-opacity-50"},xe={class:"w-[400px] max-w-full border border-neutral-500 rounded-md bg-panel shadow-2xl"},Re={class:"px-5 pt-5"},Ve={class:"mb-3 font-title font-light text-xl uppercase pb-1 border-b-2 border-primary-600"};function Ne(e,t,o,a,s,r){return u(),m("div",null,[S(M,{name:"fade"},{default:C(()=>[o.modelValue?(u(),m("div",Oe)):$("",!0)]),_:1}),S(M,{name:"scale"},{default:C(()=>[o.modelValue?(u(),m("div",{key:0,role:"dialog",class:"fixed top-0 right-0 bottom-0 left-0 flex justify-center items-center",onClick:t[0]||(t[0]=le((...i)=>r.close&&r.close(...i),["self"]))},[d("div",xe,[d("div",Re,[d("div",Ve,h(o.title),1),I(e.$slots,"default"),I(e.$slots,"actions")])])])):$("",!0)]),_:3})])}var De=L(Te,[["render",Ne]]);const Ue={components:{KDialog:De},data(){return{visible:!1,pageTitle:"",board:{title:"",description:"",public:!1}}},methods:R(w({},z(q,["updateBoard","createBoard","removeBoard"])),{show(e){e?(this.pageTitle=this.$t("EditBoard"),this.board=w({},e),this.isUpdate=!0):(this.board={title:"",description:"",public:!1},this.pageTitle=this.$t("NewBoard")),this.visible=!0,this.$nextTick(()=>this.$refs.mainInput.focus())},async remove(){await this.removeBoard(this.board.id),this.close()},close(){this.visible=!1},async save(){this.board.id?await this.updateBoard({id:this.board.id,title:this.board.title,description:this.board.description,public:this.board.public}):await this.createBoard({title:this.board.title,description:this.board.description,public:this.board.public}),this.close()}})},je={class:"form-element"},Fe={class:"block mb-1 text-primary"},Me={class:"mt-3 form-element"},ze={class:"block mt-2 mb-1 text-primary"},Ke={class:"mt-3 form-option"},He={for:"public-checkbox"},Ge={key:0,class:"mt-3"},Qe=d("label",{class:"block mt-2 mb-1 text-primary"},"Owner",-1),We={class:"ml-4 flex items-center"},Ye=["src"],Je={class:"flex-1 ml-4"},Xe={class:""},Ze={class:"text-muted"},et=d("button",{class:"button secondary small outlined w-32"},"Change ownership",-1),tt={class:"flex justify-between items-center my-4 pt-4 border-t-2 border-t-primary-600"},ot={class:"space-x-3"},st={key:0},rt=["title"],at=d("i",{class:"fa fa-trash"},null,-1),it=[at];function nt(e,t,o,a,s,r){const i=B("k-dialog");return u(),K(i,{modelValue:s.visible,"onUpdate:modelValue":t[7]||(t[7]=n=>s.visible=n),title:s.pageTitle},{default:C(()=>[d("div",je,[d("label",Fe,h(e.$t("Title")),1),V(d("input",{ref:"mainInput","onUpdate:modelValue":t[0]||(t[0]=n=>s.board.title=n),type:"text",onKeydown:t[1]||(t[1]=ce((...n)=>r.save&&r.save(...n),["enter"]))},null,544),[[H,s.board.title]])]),d("div",Me,[d("label",ze,h(e.$t("Description")),1),V(d("input",{"onUpdate:modelValue":t[2]||(t[2]=n=>s.board.description=n),type:"text"},null,512),[[H,s.board.description]])]),d("div",Ke,[V(d("input",{id:"public-checkbox","onUpdate:modelValue":t[3]||(t[3]=n=>s.board.public=n),type:"checkbox"},null,512),[[ue,s.board.public]]),d("label",He,h(e.$t("Public")),1)]),s.board.id?(u(),m("div",Ge,[Qe,d("div",We,[d("img",{src:s.board.owner.avatar,class:"w-12 h-12 rounded-full",alt:"Owner's avatar"},null,8,Ye),d("div",Je,[d("div",Xe,h(s.board.owner.fullName),1),d("div",Ze,h(s.board.owner.username),1)]),et])])):$("",!0)]),actions:C(()=>[d("div",tt,[d("div",ot,[d("button",{class:"button primary",onClick:t[4]||(t[4]=n=>r.save())},h(e.$t("Ok")),1),d("button",{class:"button flat",onClick:t[5]||(t[5]=n=>r.close())},h(e.$t("Cancel")),1)]),s.board.id?(u(),m("div",st,[d("button",{class:"button danger",title:e.$t("Remove"),onClick:t[6]||(t[6]=n=>r.remove())},it,8,rt)])):$("",!0)])]),_:1},8,["modelValue","title"])}var dt=L(Ue,[["render",nt]]);const lt={props:{coverImage:{type:String,default:null},title:{type:String,default:null},description:{type:String,default:null},footer:{type:String,default:null},ribbon:{type:String,default:null},ribbonDirection:{type:String,default:"right"},ribbonColor:{type:String,default:"blue"}},computed:{hasFooterSlot(){return!!this.$slots.footer}}},ct={class:"border border-gray-500 rounded-md bg-panel shadow-lg relative"},ut=["src"],pt={class:"p-5"},mt={class:"font-title text-2xl font-light text-white"},ht={class:"mt-2 text-sm text-gray-300"},gt={key:0},ft={key:1,class:"text-muted italic"},bt={key:0,class:"pt-5"},vt={class:"text-xs text-muted"},_t={key:1,class:"pt-5"};function yt(e,t,o,a,s,r){return u(),m("div",ct,[o.ribbon?(u(),m("div",{key:0,class:pe("ribbon "+o.ribbonDirection+" "+o.ribbonColor)},[d("span",null,h(o.ribbon),1)],2)):$("",!0),o.coverImage?(u(),m("img",{key:1,class:"w-full object-cover rounded-t shadow-lg",src:o.coverImage},null,8,ut)):$("",!0),I(e.$slots,"default",{},()=>[d("div",pt,[d("div",null,[d("span",mt,h(o.title),1)]),d("div",ht,[o.description?(u(),m("span",gt,h(o.description),1)):(u(),m("span",ft,h(e.$t("noDescription")),1))]),o.footer?(u(),m("div",bt,[d("small",vt,h(o.footer),1)])):$("",!0),r.hasFooterSlot?(u(),m("div",_t,[I(e.$slots,"footer",{},void 0,!0)])):$("",!0)])],!0)])}var wt=L(lt,[["render",yt],["__scopeId","data-v-05894ade"]]);const $t={components:{Card:wt,EditBoardDialog:dt},mixins:[Ie],computed:w(w({},N(q,["boards"])),N(y,["user"])),methods:{newBoardDialog(){if(!this.user)return this.$router.push({name:"login"});this.$refs.editDialog.show()}}},W=e=>(ge("data-v-2439372a"),e=e(),fe(),e),kt={class:"m-5"},qt={class:"mb-8 text-center"},At={key:0,class:"flex justify-center flex-wrap gap-8"},St={key:1,class:"mt-8 text-center text-muted"},Ct=G(" You have no boards. Click to the "),Bt=W(()=>d("i",{class:"fa fa-plus"},null,-1)),Lt=G(" button to create one. "),Pt=[Ct,Bt,Lt],Et={id:"add-board-button",class:"fixed right-8 bottom-8"},It=W(()=>d("i",{class:"fa fa-plus"},null,-1)),Tt=[It];function Ot(e,t,o,a,s,r){const i=B("card"),n=B("router-link"),v=B("edit-board-dialog");return u(),m("div",null,[d("div",kt,[d("h3",qt,h(e.user?e.$t("MyBoards"):e.$t("PublicBoards")),1),e.boards&&e.boards.length>0?(u(),m("div",At,[(u(!0),m(me,null,he(e.boards,g=>(u(),m("div",{key:g.id},[S(n,{to:{name:"Board",params:{id:g.id,slug:g.slug}},class:"div text-nodec"},{default:C(()=>[S(i,{class:"w-64",title:g.title,description:g.description,footer:e.$t("ModifiedAt",{ago:e.dateToAgo(g.updatedAt||g.createdAt)}),ribbon:e.user&&g.public?e.$t("Public"):null},null,8,["title","description","footer","ribbon"])]),_:2},1032,["to"])]))),128))])):(u(),m("div",St,Pt))]),d("div",Et,[d("div",{class:"w-12 h-12 rounded-full bg-primary hover:bg-primary-400 active:bg-primary-600 shadow-lg text-black text-2xl flex justify-center items-center",onClick:t[0]||(t[0]=g=>r.newBoardDialog())},Tt)]),S(v,{ref:"editDialog"},null,512)])}var xt=L($t,[["render",Ot],["__scopeId","data-v-2439372a"]]),Rt=[{path:"/",component:()=>f(()=>import("./AppLayout.4db8d473.js"),["assets/AppLayout.4db8d473.js","assets/AppLayout.8c880c93.css","assets/Logo.bda78646.js","assets/vendor.bd38f07c.js"]),children:[{path:"/",name:"home",component:xt},{path:"/style-guide",name:"style-guide",component:()=>f(()=>import("./StyleGuide.5f7da724.js"),["assets/StyleGuide.5f7da724.js","assets/StyleGuide.3c55a406.css","assets/vendor.bd38f07c.js"])},{path:"/about",name:"about",component:()=>f(()=>import("./About.51c47b7c.js"),["assets/About.51c47b7c.js","assets/About.93158357.css","assets/vendor.bd38f07c.js"]),meta:{requiresAuth:!0}},{path:"/board/:id-:slug",name:"Board",component:()=>f(()=>import("./Board.ea3bcd8d.js"),["assets/Board.ea3bcd8d.js","assets/Board.19f082a2.css","assets/vendor.bd38f07c.js"]),props:!0}]},{path:"/auth",component:()=>f(()=>import("./AuthLayout.cff496b0.js"),["assets/AuthLayout.cff496b0.js","assets/vendor.bd38f07c.js","assets/Logo.bda78646.js"]),children:[{path:"/login",name:"login",component:()=>f(()=>import("./Login.a380f120.js"),["assets/Login.a380f120.js","assets/auth.mixin.0a2474ce.js","assets/auth.mixin.f0cb7d90.css","assets/vendor.bd38f07c.js"]),meta:{redirectAuth:"home"}},{path:"/signup",name:"signup",component:()=>f(()=>import("./SignUp.183439f0.js"),["assets/SignUp.183439f0.js","assets/auth.mixin.0a2474ce.js","assets/auth.mixin.f0cb7d90.css","assets/vendor.bd38f07c.js"]),meta:{redirectAuth:"home"}},{path:"/forgot-password",name:"forgot-password",component:()=>f(()=>import("./ForgotPassword.2e3881b3.js"),["assets/ForgotPassword.2e3881b3.js","assets/auth.mixin.0a2474ce.js","assets/auth.mixin.f0cb7d90.css","assets/vendor.bd38f07c.js"]),meta:{redirectAuth:"home"}},{path:"/reset-password",name:"reset-password",component:()=>f(()=>import("./ResetPassword.ff42ae68.js"),["assets/ResetPassword.ff42ae68.js","assets/auth.mixin.0a2474ce.js","assets/auth.mixin.f0cb7d90.css","assets/vendor.bd38f07c.js"]),meta:{redirectAuth:"home"}},{path:"/verify-account",name:"verify-account",component:()=>f(()=>import("./VerifyAccount.344a5a2b.js"),["assets/VerifyAccount.344a5a2b.js","assets/auth.mixin.0a2474ce.js","assets/auth.mixin.f0cb7d90.css","assets/vendor.bd38f07c.js"]),meta:{redirectAuth:"home"}},{path:"/passwordless",name:"passwordless",component:()=>f(()=>import("./Passwordless.b0b6493e.js"),["assets/Passwordless.b0b6493e.js","assets/auth.mixin.0a2474ce.js","assets/auth.mixin.f0cb7d90.css","assets/vendor.bd38f07c.js"]),meta:{redirectAuth:"home"}}]},{path:"/:pathMatch(.*)*",name:"404",component:()=>f(()=>import("./NotFound.d46ca2bb.js"),["assets/NotFound.d46ca2bb.js","assets/Logo.bda78646.js","assets/vendor.bd38f07c.js"])}],p=be({history:ve(),scrollBehavior:()=>({top:0}),routes:Rt});_e("service-worker.js",{ready(){console.log(`App is being served from cache by a service worker.
For more details, visit https://goo.gl/AFskqB`)},registered(){console.log("Service worker has been registered.")},cached(){console.log("Content has been cached for offline use.")},updatefound(){console.log("New content is downloading.")},updated(){console.log("New content is available; please refresh.")},offline(){console.log("No internet connection found. App is running in offline mode.")},error(e){console.error("Error during service worker registration:",e)}});const Vt={computed:w({},N(y,["user"])),created(){this.init()},methods:w({},z(q,["init"]))};function Nt(e,t,o,a,s,r){const i=B("router-view");return u(),K(i)}var Dt=L(Vt,[["render",Nt]]);Ae().then(e=>{const t=ye({render:()=>we(Dt)});t.use(O),t.use(p),t.use(e),t.use(l),t.use($e()),t.config.globalProperties.$swal=ke,t.config.globalProperties.$toast=E,t.mount("#app"),window.app=t});export{wt as C,dt as E,De as K,L as _,y as a,Ie as d,q as m};
