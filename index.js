let env = 'Dev';

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
process.argv = [process.argv[0], process.argv[1], '--environment', env];
// require('./node_modules/anypoint-cli/src/app');

let envs = {
    'Dev': {
        'target': 3888174
    }
}

//const api = require('anypoint-cli/src/commands/api-mgr/api');
const { get } = require('lodash');
let  appCore = require('./appCore')
appCore.init().then(async () => {
    let result = await listApis();
    let apis =  JSON.parse(result);

    for(api of apis) {
        let exchangeAssetName  = api['Exchange Asset Name'];
        nameToApiMap[exchangeAssetName] = api;
        let detail = await getApiDetail(api['Instance ID']);
        console.log(detail);
    }
  })

async function listApis() {
    return appCore.executeCommand('api-mgr api list -o \'json\'');
}

async function getApiDetail(apiInstanceId) {
    return appCore.executeCommand('api-mgr api describe -o \'json\' '+apiInstanceId);
}

//https://docs.mulesoft.com/runtime-manager/anypoint-platform-cli-commands#api-mgr-api-deploy
async function deployApi(apiInstanceId) {
    return appCore.executeCommand('api-mgr api deploy -o \'json\' --target ' + envs[env].target + ' ' + apiInstanceId);
}

async function redeploy(apiInstanceId, path) {
    return appCore.executeCommand('api-mgr api redeploy -o \'json\' --target ' + envs[env].target + ' ' + apiInstanceId);
}

//https://docs.mulesoft.com/runtime-manager/anypoint-platform-cli-commands#api-mgr-api-deploy
async function editApiUri(apiInstanceId, uri) {
    return appCore.executeCommand('api-mgr api edit -o \'json\' --uri ' + uri + ' ' + apiInstanceId);
}

async function editApiPath(apiInstanceId, path) {
    return appCore.executeCommand('api-mgr api edit -o \'json\' --path ' +path + ' ' + apiInstanceId);
}

async function listPolicies(apiInstanceId) {
    return appCore.executeCommand('api-mgr policy list -o \'json\' --muleVersion4OrAbove true ' + apiInstanceId);
}




