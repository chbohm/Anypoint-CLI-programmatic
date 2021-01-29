
let cli = require('./anypoint-cli-api');
const ENV = 'Test03';

// {
//     "WorkCase History Service Http": {
//                                       "Asset ID": "workcase-history-service-http",
//                                       "Instance ID": 123456,
//                                       "Asset Version": "1.0.0",
//                                       "Exchange Asset Name": ,
//                                       "Product Version": "v1",
//                                       "Instance Label": "78987654",
//                                       "Deprecated": "N",
//                                       "Public": "N"
//                                       }
//     ...
// }
let nameToApiMap = {};


main().then(() => console.log('done')).catch((error) => { console.error(error) });

async function main() {
    await cli.applyJwtPolicy('Test06', 16505783)
}

async function changeSpec() {
    let envs = ['Test04', 'Test05', 'Test06', 'Test07', 'Test08', 'Test09'];
    //  let ids = ['16578952', '16578952', '16578952', '16578952', '16578952', '16578952'];
    for (let i = 0; i < envs.length; i++) {
        let env = envs[i];
        //    let id = ids[i];
        // console.log("Env: "+env);
        nameToApiMap = {}
        nameToApiMap = await initApiMap(env, nameToApiMap);
        cli.redeploy
        let id = getId('C1 Core API');
        console.log("Id: " + id);
        await cli.changeSpecification(env, id, '1.0.12')
    }


}

async function initApiMap(env, nameToApiMap) {
    let apis = await cli.listApis(env);
    apis.forEach(api => {
        let proxiesInstances = nameToApiMap[api['Exchange Asset Name']]
        if (!proxiesInstances) {
            proxiesInstances = [];
            nameToApiMap[api['Exchange Asset Name']] = proxiesInstances;
        }
        proxiesInstances.push(api);
    })
    return nameToApiMap;
}

function getProxyByExchangeName(exchangeName) {
    return nameToApiMap[exchangeName]
}

function getId(exchangeName) {
    let proxy = nameToApiMap[exchangeName];
    return proxy[0]['Instance ID'];
}
