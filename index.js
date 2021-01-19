
let cli = require('./anypoint-cli-api');
const ENV  = 'Test02';

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
const nameToApiMap = {};


main();

async function main() {
    // await initApiMap(nameToApiMap);
    // let proxies = await getProxiesByExchangeName('C1 Core API');
     await cli.changeSpecification(ENV, 16578866,'1.0.10')
    

}

async function initApiMap(nameToApiMap) {
    let apis = await cli.listApis(ENV);
    apis.forEach(api =>{
        let proxiesInstances = nameToApiMap[api['Exchange Asset Name']]
        if (!proxiesInstances) {
            proxiesInstances = [];
            nameToApiMap[api['Exchange Asset Name']] = proxiesInstances;
        }
        proxiesInstances.push(api);
    })
    return nameToApiMap;
}

async function getProxiesByExchangeName(exchangeName) {
    return nameToApiMap[exchangeName]
}

async function getId(exchangeName) {
    return nameToApiMap[exchangeName]['Instance ID']
}
