const { exec } = require('child_process');


let envs = {
    'Dev': {
        'target': 3888174
    },
    'Test01': {
        'target': 2311411
    },
    'Test02': {
        'target': 2190934
    },
    'Test03': {
        'target': 2190937
    },
    'Test04': {
        'target': 2190941
    },
    'Test05': {
        'target': 2190942
    }
}

module.exports.envs = envs;


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

async function run(env, command) {
    return new Promise((resolve, reject) => {
        let lastData;
        let child = exec(`node node_modules/anypoint-cli/src/app.js --environment ${env} ${command}`, (error, stdout, stderr) => {
            if (error) {
                return reject(error.message);
            }
            try {
                resolve(JSON.parse(lastData))
            } catch(error){
                resolve(lastData)
            };
        });

        child.stdout.on('data', function (data) {
            lastData = data;
        });
    }).catch((error) => {
        console.log('ERRRRORRRR ' + error);
    })


}



async function getId(exchangeName) {
    return nameToApiMap[exchangeName]['Instance ID']
}
module.exports.getId = getId;

async function updateAssetVersion(apiInstanceId, assetVersion, env) {
    createCommand(env, ['api-mgr', 'api', 'change-specification', '-o', , '\'json\'', apiInstanceId, assetVersion]);
    await run();
}
module.exports.updateAssetVersion = updateAssetVersion;


async function listApis(env) {
    return await run(env, 'api-mgr api list -o json');
}
module.exports.listApis = listApis;

async function getApiDetail(env, apiInstanceId) {
    let result = await run(env, `api-mgr api describe -o json ${apiInstanceId}`);
    return JSON.parse(result);

}
module.exports.getApiDetail = getApiDetail;

//https://docs.mulesoft.com/runtime-manager/anypoint-platform-cli-commands#api-mgr-api-deploy
async function deployApi(apiInstanceId) {
    let result = await run(`api-mgr api deploy -o json --target ${envs[env].target} ${apiInstanceId}`);
    return JSON.parse(result);
}
module.exports.deployApi = deployApi;

async function redeploy(apiInstanceId, path) {
    let result = await run(`api-mgr api redeploy -o json --target ${envs[env].target} ${apiInstanceId}`);
    return JSON.parse(result);
}
module.exports.redeploy = redeploy;

//https://docs.mulesoft.com/runtime-manager/anypoint-platform-cli-commands#api-mgr-api-deploy
async function editApiUri(apiInstanceId, uri) {
    let result = await run(`api-mgr api edit -o json --uri ${uri} ${apiInstanceId}`);
    return JSON.parse(result);
}

async function editApiPath(apiInstanceId, path) {
    let result = await run(`api-mgr api edit -o json --path ${path} ${apiInstanceId}`);
    return JSON.parse(result);
}

async function listPolicies(apiInstanceId) {
    let result = await run(`api-mgr policy list -o json --muleVersion4OrAbove true ${apiInstanceId}`);
    return JSON.parse(result);
}




