# kantab
基于icebob / kantab项目的看板应用,moleculer微服务架构,整合iview-admin后台管理,swagger接口文档、swagger-stats监控面板、moleculer_lab监控、REST API、GraphQL endpoint

## features

- [x] iview-admin backstage managed
- [x] Moleculer microservices backend
- [x] VueJS frontend (VueX, Vue-router)
- [x] MongoDB
- [x] Redis cache
- [x] NATS
- [x] Central configuration
- [x] Global REST API
- [x] Swagger API docs
- [x] Swagger stats
- [x] Swagger editor
- [x] GraphQL endpoint
- [x] Full authentication
    - [x] Login
    - [x] Sign Up
    - [x] Passwordless account
    - [x] Forgot password
    - [x] Reset password    
    - [x] Account verification
    - [x] Social login
        - [x] Google
        - [x] Facebook
        - [x] Github
    - [x] Two-factor authentication
- [x] ACL/RBAC (user roles & permissions)
- [x] I18N
- [x] Websocket
- [x] Metrics & monitoring
- [x] Unit test with Jest, Cypress
- [x] Unit test with Cypress
- [x] Docker files

## Install
建议使用yarn安装依赖,使用npm install 可能会有依赖库版本冲突,导致安装失败
```
git clone https://github.com/peterchen08/kantab.git
cd kantab
yarn
```
docker安装redis、mongodb、nats运行环境
```
npm run dc:env
```
启动程序开始调试
```
npm run dev
```
在浏览器中打开前端[http://localhost:3000/](http://localhost:3000/)

![Screenshot](https://user-images.githubusercontent.com/306521/47039154-865d9100-d183-11e8-85c9-4cfc571ac8a5.png)
<img width="1374" alt="image" src="https://github.com/peterchen08/kantab/assets/5748835/30c17796-45db-49c9-80a0-612163f2da6d">

## iview-admin
后台管理[http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html)
后台管理员登录账号:superAdmin  登录密码:admin

关于iview-admin请参考[https://lison16.github.io/iview-admin-doc/#/](https://lison16.github.io/iview-admin-doc/#/)

![Screenshot](https://github.com/peterchen08/kantab/assets/5748835/948af25d-6f05-403f-9ffb-73c28b175aa3)

<img width="1372" alt="image" src="https://github.com/peterchen08/kantab/assets/5748835/a1c56899-98a5-41aa-9278-5804ecbe9356">



## swagger
REST API 接口文档[http://localhost:3000/openapi/](http://localhost:3000/openapi/)

<img width="1375" alt="image" src="https://github.com/peterchen08/kantab/assets/5748835/876bd1dc-62ea-489a-91c1-2bc44d42e84a">



## swagger-stats
wsagger stats 接口监控面板
[http://localhost:3000/swagger/dashboard/](http://localhost:3000/swagger/dashboard/#/)

<img width="1369" alt="image" src="https://github.com/peterchen08/kantab/assets/5748835/20103a08-783f-4fbc-9215-2283cb9b45f3">

## swagger-editor
[http://localhost:3000/editor/](http://localhost:3000/editor/)

<img width="1373" alt="image" src="https://github.com/peterchen08/kantab/assets/5748835/418ff9fb-e99b-41b1-b8c2-75d8e89b2ae2">

## moleculer_lab
Moleculer’s Laboratory 是官方推出的Moleculer 监控面板,请自行申请token及appkey

更多信息请参考[https://medium.com/moleculer/moleculers-laboratory-b3262cc3b39e](https://medium.com/moleculer/moleculers-laboratory-b3262cc3b39e)

在[https://lab.moleculer.services/project/aHR0cDovL2xvY2FsaG9zdDozMjEw](https://lab.moleculer.services/project/aHR0cDovL2xvY2FsaG9zdDozMjEw)中输入申请到的token即可

<img width="1373" alt="image" src="https://github.com/peterchen08/kantab/assets/5748835/c89f9dc5-570b-4827-b12a-35cad18dcec3">
<img width="1366" alt="image" src="https://github.com/peterchen08/kantab/assets/5748835/ebb9d1fd-921f-429b-9ca2-7ea9a73adb8e">

