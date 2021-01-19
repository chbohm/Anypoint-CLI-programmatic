const { exec } = require('child_process');
const credentials = require('./credentials.json');
let token;
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




async function login(username, password) {
    return new Promise((resolve, reject) => {
        let defaults = {
            timeout: 60000,
            baseUrl: 'https://anypoint.mulesoft.com',
            strictSSL: false,
            json: true
        }
        let request = require('request-promise');
        requester = request.defaults(defaults);

        let options = {
            headers: {
                'User-Agent': 'Anypoint-CLI/3.4.3'
            },
            url: '/accounts/login',
            body: {
                username: username,
                password: password
            }
        };

        requester.post(options).then((body) => {
            resolve(body.access_token);
        }).catch((error) => { reject(error) })
    });


}
module.exports.login = login;

async function run(env, command) {
    if (!token) {
        token = await login(credentials.username, credentials.password);
    }
    return new Promise((resolve, reject) => {
        let lastData;
        let child = exec(`node node_modules/anypoint-cli/src/app.js --organization ${credentials.organization} --environment ${env} --bearer=${token} ${command}`, (error, stdout, stderr) => {
            if (error) {
                return reject(error.message);
            }
            try {
                resolve(JSON.parse(lastData))
            } catch (error) {
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

async function listApis(env) {
    return await run(env, 'api-mgr api list --limit 1000 -o json');
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

async function changeSpecification(env, apiInstanceId, assetVersion) {
    let result = await run(env, `api-mgr api change-specification -o json ${apiInstanceId} ${assetVersion}`);
    console.log(result);
}
module.exports.changeSpecification = changeSpecification;



